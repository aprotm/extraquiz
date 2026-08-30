import { store } from './store.js';

/**
 * Multi-API Key Pool & Smart Load Balancer
 */
class KeyPoolManager {
    constructor() {
        this.currentIndex = 0;
        this.rateLimitedKeys = new Map(); // key -> cooldown timestamp
    }

    // Parses single key or multiple keys separated by comma, newline, or whitespace
    getAllKeys() {
        let raw = localStorage.getItem('gemini_api_key') || '';
        if (!raw.trim() && store.userProfile?.geminiApiKey) {
            raw = store.userProfile.geminiApiKey;
            try {
                localStorage.setItem('gemini_api_key', raw);
            } catch (_) {}
        }
        if (!raw.trim()) return [];
        return raw
            .split(/[\n,;]+/)
            .map(k => k.trim())
            .filter(k => k.length > 5);
    }

    getActiveKeys() {
        const now = Date.now();
        const allKeys = this.getAllKeys();
        // Clean expired cooldowns
        for (const [key, expireTime] of this.rateLimitedKeys.entries()) {
            if (now >= expireTime) {
                this.rateLimitedKeys.delete(key);
            }
        }
        const active = allKeys.filter(k => !this.rateLimitedKeys.has(k));
        // If all keys are temporarily rate-limited, fallback to all keys
        return active.length > 0 ? active : allKeys;
    }

    getNextKey() {
        const keys = this.getActiveKeys();
        if (keys.length === 0) return null;
        const key = keys[this.currentIndex % keys.length];
        this.currentIndex = (this.currentIndex + 1) % keys.length;
        return key;
    }

    markRateLimited(key, cooldownMs = 60000) {
        if (!key) return;
        this.rateLimitedKeys.set(key, Date.now() + cooldownMs);
    }

    getKeyStats() {
        const all = this.getAllKeys();
        const active = this.getActiveKeys();
        return {
            total: all.length,
            active: active.length,
            isPool: all.length > 1
        };
    }
}

export const keyPool = new KeyPoolManager();

export async function askGemini(prompt, maxRetries = null) {
    const allKeys = keyPool.getAllKeys();
    if (allKeys.length === 0) {
        throw new Error("Vui lòng nhập ít nhất 1 Gemini API Key trong Cài đặt trước khi sử dụng tính năng này.");
    }

    const retries = maxRetries !== null ? maxRetries : Math.max(allKeys.length, 2);
    let lastError = null;

    for (let attempt = 0; attempt < retries; attempt++) {
        const apiKey = keyPool.getNextKey();
        if (!apiKey) break;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                let msg = err.error?.message || "Lỗi khi gọi Gemini API";

                // Handle Rate Limit (429) or Quota
                if (response.status === 429 || msg.includes("quota") || msg.includes("RESOURCE_EXHAUSTED")) {
                    console.warn(`[KeyPool] API Key ending with ...${apiKey.slice(-4)} reached rate limit/quota. Switching to next key...`);
                    keyPool.markRateLimited(apiKey, 60000);
                    lastError = new Error("Vượt quá giới hạn gọi API (Rate limit). Đang tự động đổi sang Key dự phòng...");
                    continue; // Try next key in pool
                }

                if (msg.includes("high demand") || msg.includes("overloaded") || response.status === 503) {
                    console.warn(`[KeyPool] Google AI overloaded for key ...${apiKey.slice(-4)}. Trying next key...`);
                    lastError = new Error("Hệ thống AI Google đang quá tải. Đang tự động thử lại...");
                    continue;
                }

                if (response.status === 400 && msg.includes("API key not valid")) {
                    console.warn(`[KeyPool] Invalid API key ...${apiKey.slice(-4)}.`);
                    keyPool.markRateLimited(apiKey, 86400000);
                    lastError = new Error("Gemini API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt!");
                    continue;
                }

                throw new Error(msg);
            }

            const data = await response.json();
            return data.candidates[0].content.parts[0].text;

        } catch (e) {
            console.error(`[KeyPool] Request error with key ...${apiKey.slice(-4)}:`, e);
            lastError = e;
            if (attempt < retries - 1) {
                continue;
            }
        }
    }

    throw lastError || new Error("Không thể kết nối tới Google AI với các API Key hiện có. Vui lòng thử lại!");
}

export async function getIELTSAnalysis(word, definition) {
    const prompt = `Bạn là một chuyên gia IELTS. Hãy phân tích từ vựng tiếng Anh sau đây để giúp học viên ôn thi IELTS.
Từ vựng: "${word}"
Nghĩa: "${definition}"

Hãy trả về kết quả dưới định dạng JSON chính xác như sau (không thêm markdown \`\`\`json):
{
  "readingContext": "Một đoạn văn học thuật ngắn (khoảng 3-4 câu) mang phong cách IELTS Reading có chứa từ này.",
  "writingIdea": "Một câu luận điểm (Argument) chuẩn IELTS Writing Task 2 sử dụng từ này.",
  "grammar": "Cách dùng từ, collocation phổ biến hoặc từ đồng nghĩa."
}`;

    const text = await askGemini(prompt);
    // Remove markdown code blocks if AI still returns them
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanText);
}

export async function generateRoadmap(inputBand, targetBand, timeMonths, purpose, studyHours, strategyType = 'pull_strategy') {
    const prompt = `Bạn là một chuyên gia khảo thí và cố vấn học tập IELTS hàng đầu (IELTS Academic Master Coach 10+ năm kinh nghiệm), am hiểu sâu sắc thói quen, điểm mạnh và điểm yếu của học sinh - sinh viên Việt Nam.
Nhiệm vụ của bạn là thiết kế một **Lộ trình học IELTS cá nhân hóa đỉnh cao** áp dụng **Chiến thuật gánh điểm thông minh (Pull Strategy) chuẩn khảo thí IDP/British Council**.

⚠️ **YÊU CẦU BẮT BUỘC VỀ ĐỘ DÀI & ĐỘ SÂU**: Hãy viết lộ trình **RẤT CHI TIẾT, ĐẦY ĐỦ, KHÔNG LƯỢC BỎ BẤT KỲ PHẦN NÀO**, tối thiểu **2500–3500 từ**. Đảm bảo mỗi giai đoạn, mỗi kỹ năng đều được triển khai chi tiết với ví dụ cụ thể, bài tập mẫu, và timeline rõ ràng. KHÔNG được tóm tắt hay viết sơ sài.

**THÔNG TIN HỌC VIÊN:**
- Band hiện tại: ${inputBand}
- Band mục tiêu: ${targetBand}
- Thời gian ôn luyện: ${timeMonths} tháng
- Mục đích chính: ${purpose}
- Thời gian học mỗi ngày: ${studyHours} giờ/ngày
- Chiến lược định hướng: ${strategyType === 'balanced' ? 'Phát triển đồng đều 4 kỹ năng' : strategyType === 'weakness_boost' ? 'Tập trung bứt phá kỹ năng yếu' : 'Chiến thuật gánh điểm kinh điển cho học sinh Việt Nam (Listening & Reading kéo điểm Writing & Speaking)'}

---

**QUY TẮC BẮT BUỘC TRONG LỘ TRÌNH:**

### 1. ĐÁNH GIÁ TRÌNH ĐỘ VÀ KHOẢNG CÁCH (GAP ANALYSIS)
- Phân tích khoảng cách từ ${inputBand} lên ${targetBand} (chênh lệch +${(Number(targetBand) - Number(inputBand)).toFixed(1)} Band).
- Chỉ rõ thực trạng học viên Việt Nam: Thế mạnh về ngữ pháp/từ vựng tiếp nhận (Reading/Listening) và rào cản tâm lý khi phản xạ/diễn đạt (Writing/Speaking).
- Phân tích chi tiết từng kỹ năng: điểm mạnh, điểm yếu, thách thức cụ thể, và cách khắc phục.

### 2. MỤC TIÊU CỤ THỂ CHO TỪNG KỸ NĂNG (BẢNG PHÂN BỔ ĐIỂM CHIẾN LƯỢC)
BẮT BUỘC TẠO MỘT BẢNG MARKDOWN ĐỊNH DẠNG CHUẨN như sau:
Để đạt **Overall ${targetBand}**, chiến thuật thông minh nhất cho học sinh Việt Nam là **kéo mạnh kỹ năng Đọc và Nghe để gánh điểm cho Viết và Nói**.

Hãy tính toán mục tiêu Band cụ thể cho từng kỹ năng (Listening, Reading, Writing, Speaking) sao cho trung bình cộng 4 kỹ năng khi chia cho 4 và áp dụng quy tắc làm tròn của IELTS sẽ đạt đúng **Overall ${targetBand}**.
Ví dụ:
- Target 6.5: L: 7.0, R: 7.0, W: 6.0, S: 5.5 -> (7.0 + 7.0 + 6.0 + 5.5) / 4 = 6.375 -> Làm tròn thành 6.5
- Target 7.0: L: 7.5, R: 7.5, W: 6.5, S: 6.0 -> (7.5 + 7.5 + 6.5 + 6.0) / 4 = 6.875 -> Làm tròn thành 7.0
- Target 7.5: L: 8.0, R: 8.5, W: 6.5, S: 6.5 -> (8.0 + 8.5 + 6.5 + 6.5) / 4 = 7.375 -> Làm tròn thành 7.5
- Target 8.0: L: 8.5, R: 9.0, W: 7.0, S: 7.0 -> (8.5 + 9.0 + 7.0 + 7.0) / 4 = 7.875 -> Làm tròn thành 8.0

Trình bày bảng Markdown:
| Kỹ năng | Mục tiêu Band | Lý do chiến lược & Trọng tâm |
| :--- | :--- | :--- |
| **Listening** | [Điểm cụ thể] | Kỹ năng dễ tăng điểm nhất nếu nắm vững dạng bài, kỹ thuật bắt Keyword và luyện nghe chủ động (Active Listening). |
| **Reading** | [Điểm cụ thể] | **Trọng tâm.** Thế mạnh cốt lõi của học sinh Việt Nam. Tận dụng kỹ thuật Skimming/Scanning và cày từ vựng theo cụm để đạt điểm tối đa. |
| **Writing** | [Điểm cụ thể] | **Trọng tâm an toàn.** Tập trung viết đúng cấu trúc Task 1 & Task 2, ngữ pháp chính xác, dùng từ vựng tự nhiên, tránh lan man. |
| **Speaking** | [Điểm cụ thể] | Tập trung vào độ trôi chảy (Fluency), phát âm rõ ràng, tư duy mở rộng câu trả lời logic theo mô hình A.R.E.A. |
| **OVERALL** | **${targetBand}** | **([L] + [R] + [W] + [S]) / 4 = [Điểm TB] → Làm tròn thành ${targetBand}** |

### 3. LỘ TRÌNH CHI TIẾT THEO GIAI ĐOẠN (${timeMonths} THÁNG)
Chia lộ trình thành các giai đoạn rõ ràng:
${timeMonths > 12 ? `- Với thời gian ${timeMonths} tháng (lộ trình dài hạn/chắc chắn), hãy chia thành 4 đến 5 giai đoạn rõ ràng (mỗi giai đoạn 3–5 tháng): Xây nền ngữ pháp/phát âm căn bản -> Nạp từ vựng & Phương pháp làm quen từng dạng -> Luyện kỹ năng nâng cao & Chuyên đề -> Luyện giải đề chuyên sâu -> Tối ưu hóa điểm số & Mock Test áp lực thực tế.` : `- Chia thành 3 đến 4 giai đoạn cụ thể: Giai đoạn 1: Xây nền & Nạp từ vựng trọng điểm -> Giai đoạn 2: Luyện kỹ năng chuyên sâu từng dạng bài -> Giai đoạn 3: Thực chiến Mock Test & Giải đề dưới áp lực thời gian.`}

Trong TỪNG giai đoạn, phân bổ chi tiết:
- **Tỷ lệ học tập**: 60% thời lượng cho Listening & Reading + 40% cho Writing & Speaking.
- **Listening & Reading**: Các dạng bài mục tiêu (True/False/NG, Matching Headings, Multiple Choice, Map Labelling...), số lượng bài đọc/nghe mỗi tuần, phương pháp Dictation & Shadowing.
- **Writing & Speaking**: Cấu trúc bài Task 1/2, phương pháp Brainstorming ý tưởng theo chủ đề (Education, Environment, Tech, Culture...), các dạng câu hỏi Speaking Part 1, 2, 3.
- **Từ vựng & Ngữ pháp trọng tâm**: Chủ đề từ vựng Academic, collocations đắt giá, cấu trúc câu phức, câu điều kiện, mệnh đề quan hệ rút gọn.

### 4. THỜI KHÓA BIỂU MẪU HÀNG TUẦN (${studyHours} GIỜ/NGÀY)
BẮT BUỘC TẠO BẢNG THỜI KHÓA BIỂU HÀNG TUẦN chi tiết theo format Markdown:
| Thứ | Khung giờ gợi ý | Nội dung học tập chi tiết | Kỹ năng trọng tâm | Phương pháp / Tài liệu |
| :--- | :--- | :--- | :--- | :--- |
| Thứ 2 | [Ví dụ: 19:30 - 21:30] | [Chi tiết nội dung] | Listening & Vocab | Nghe chép chính tả + Flashcards |
| Thứ 3 | [Khung giờ] | [Chi tiết nội dung] | Reading & Grammar | Skimming/Scanning + Collocations |
| Thứ 4 | [Khung giờ] | [Chi tiết nội dung] | Writing Task 1/2 | Phân tích bài mẫu + Outline |
| Thứ 5 | [Khung giờ] | [Chi tiết nội dung] | Speaking Part 1/2 | Ghi âm theo AREA + Shadowing |
| Thứ 6 | [Khung giờ] | [Chi tiết nội dung] | Lis & Read tăng cường | Giải 1 section đề Cam |
| Thứ 7 | [Khung giờ] | [Chi tiết nội dung] | Mini Mock Test / Tổng hợp | Đánh giá tiến độ tuần |
| Chủ nhật | [Khung giờ] | Ôn tập thẻ nhớ (Spaced Repetition) & Nghỉ ngơi hồi phục | Review & Relaxation | Flashcard LexiLearn |

### 5. MILESTONE CHECKPOINTS (CỘT MỐC KIỂM TRA TIẾN ĐỘ)
BẮT BUỘC TẠO BẢNG CỘT MỐC KIỂM TRA ĐỊNH KỲ:
| Cột mốc | Listening Target | Reading Target | Writing Target | Speaking Target | Hình thức kiểm tra & Tiêu chí đạt |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Mốc 1 (Sau 20% thời gian) | [Band cụ thể] | [Band cụ thể] | [Band cụ thể] | [Band cụ thể] | Mini test từ vựng & nghe chép |
| Mốc 2 (Sau 50% thời gian) | [Band cụ thể] | [Band cụ thể] | [Band cụ thể] | [Band cụ thể] | Half Mock Test 2 kỹ năng |
| Mốc 3 (Sau 80% thời gian) | [Band cụ thể] | [Band cụ thể] | [Band cụ thể] | [Band cụ thể] | Full Mock Test tính giờ thật |
| Mốc đích (Tháng ${timeMonths}) | **${targetBand}** | **${targetBand}** | **${targetBand}** | **${targetBand}** | Sẵn sàng ngày thi chính thức |

### 6. KẾ HOẠCH MOCK TEST VÀ QUY TRÌNH PHÂN TÍCH LỖI (ERROR LOG)
- **Thời điểm bắt đầu giải full đề**: Xác định rõ từ tháng thứ mấy bắt đầu bấm giờ 100%.
- **Tần suất giải đề**: 1–2 đề Cambridge mỗi tuần trong giai đoạn nước rút.
- **Sổ tay phân tích lỗi sai (Error Log Framework)**: Phân loại 3 nhóm lỗi (Từ vựng chưa biết, Bẫy đề thi/Distractor, Quản lý thời gian/áp lực).
- **Chiến thuật phòng thi thực tế**: Cách làm bài Listening khi bị miss thông tin, thứ tự làm các Passage trong Reading, chiến lược "thắt lưng buộc bụng" thời gian cho Writing Task 2.

### 7. BỘ TÀI LIỆU & NGUỒN HỌC THỰC CHIẾN KHUYÊN DÙNG
- **Bộ sách chuẩn**: Cambridge IELTS (quyển phù hợp với band), Collins for IELTS, Road to IELTS, Hacker IELTS...
- **Kênh luyện Nghe/Đọc**: BBC 6 Minute English, TED Talks, The Guardian, Scientific American, Spotlight English...
- **Công cụ hỗ trợ**: LexiLearn Flashcard (học từ vựng Spaced Repetition), Paraphrasing Coach, Dictation Studio.
- **Website làm đề online miễn phí**: IELTS Online Tests, Mini-IELTS.

### 8. LỜI KHUYÊN TÂM LÝ & CHECKLIST NGÀY THI
- Kỹ thuật giữ nhịp thở và sự tự tin trước giám khảo Speaking.
- Checklist trước ngày thi: Passport/CCCD, nước lọc bóc nhãn, giấc ngủ và chế độ dinh dưỡng.

**ĐỊNH DẠNG ĐẦU RA:**
Sử dụng định dạng Markdown chuẩn đẹp, các tiêu đề rõ ràng (H1, H2, H3), bảng biểu chi tiết (PHẢI CÓ ÍT NHẤT 3-4 BẢNG), danh sách gạch đầu dòng mạch lạc, ngôn phong chuyên nghiệp, truyền cảm hứng và dễ theo dõi.
Nhắc lại: Viết ĐẦY ĐỦ CHI TIẾT, không tóm tắt, giúp học viên có thể in ra thành bộ cẩm nang học tập dài dặn và chất lượng.`;

    const text = await askGemini(prompt);
    return text;
}

export const IELTS_READING_LEVELS = {
    '4.5-5.5': {
        range: '4.5–5.5',
        label: 'Foundation',
        targetWords: '350–500 words (2-3 clear paragraphs)',
        vocabTarget: '80–90% familiar/common vocabulary, 10–20% basic academic vocabulary. When incorporating user flashcard terms, embed them in clear, supportive contexts.',
        grammar: 'Simple and compound sentences, common complex sentences, basic relative clauses and passive voice. Avoid deeply nested embedded clauses.',
        sentenceLength: '10–20 words per sentence.',
        cohesion: 'Explicit familiar connectors (however, therefore, because, although, for example, as a result).',
        infoDensity: 'Low to moderate. Information stated directly.',
        paraphrasing: 'Straightforward synonym and phrase substitution without distorting semantic meaning.',
        inference: 'Explicit information matching and basic single-step inference (main ideas, supporting facts, basic cause-effect).'
    },
    '5.5-6.5': {
        range: '5.5–6.5',
        label: 'Intermediate',
        targetWords: '450–650 words (3-4 paragraphs)',
        vocabTarget: '65–80% familiar vocabulary, 20–35% academic/uncommon vocabulary, academic collocations, moderate abstract nouns.',
        grammar: 'Varied sentence structures (complex sentences, relative clauses, passive constructions, concessive & comparative structures).',
        sentenceLength: '15–25 words per sentence, occasional 30+ word sentences.',
        cohesion: 'Balanced mix of explicit connectors, lexical cohesion, pronoun referencing, and synonym repetition.',
        infoDensity: 'Moderate. A single sentence may carry multiple related details.',
        paraphrasing: 'Distinct paraphrasing and sentence transformation representing source ideas with academic alternatives.',
        inference: 'Requires connecting information across two sentences, interpreting author perspective and single-step deductive reasoning.'
    },
    '6.5-7.5': {
        range: '6.5–7.5',
        label: 'Upper-Intermediate',
        targetWords: '550–750 words (4-5 paragraphs)',
        vocabTarget: '50–65% familiar vocabulary, 35–50% academic / abstract / domain-specific vocabulary, sophisticated collocations, nominalisation.',
        grammar: 'Multi-clause complex sentences, reduced relative clauses, participial clauses, complex noun phrases, nominalised syntax.',
        sentenceLength: '18–30 words per sentence with dynamic variation between short, medium, and extended sentences.',
        cohesion: 'Multi-layered cohesion: discourse markers, lexical chains, subtle transitions, and implicit thematic relationships.',
        infoDensity: 'Moderate to high. Complex arguments, qualifying statements, and contrasting viewpoints within the same paragraph.',
        paraphrasing: 'Strong paraphrasing using structural transformations, nominalisation, and conceptual synonyms.',
        inference: 'Multi-sentence inference, identifying author stance/attitude, evaluating counterarguments, and interpreting nuanced comparisons.'
    },
    '7.5-8.5+': {
        range: '7.5–8.5+',
        label: 'Advanced',
        targetWords: '650–850 words (4-6 paragraphs)',
        vocabTarget: '35–50% common vocabulary, 50–65% advanced academic, abstract terminology, nuanced lexical choices, and sophisticated academic collocations.',
        grammar: 'Sophisticated academic syntax, multiple embedded clauses, dense noun phrases, reduced participial structures, and concessive logic.',
        sentenceLength: '20–35 words per sentence with occasional natural 40+ word analytical sentences.',
        cohesion: 'Sophisticated discourse cohesion: semantic recurrence, thematic progression, implicit logical development without connector overuse.',
        infoDensity: 'High. Dense interconnected ideas, epistemological qualifications, and theoretical perspectives.',
        paraphrasing: 'Highly advanced paraphrasing and conceptual abstraction.',
        inference: 'Subtle multi-step inference, identifying implied assumptions, nuanced distinction between closely related hypotheses.'
    }
};

export async function generateReadingTest(input, options = {}) {
    let wordList = [];
    let readingLevel = '5.5-6.5';
    let questionCount = 8;

    if (Array.isArray(input)) {
        wordList = input;
        if (typeof options === 'object') {
            readingLevel = options.readingLevel || options.level || '5.5-6.5';
            questionCount = options.questionCount || 8;
        }
    } else if (typeof input === 'object' && input !== null) {
        wordList = input.wordList || input.cards || [];
        readingLevel = input.readingLevel || '5.5-6.5';
        questionCount = parseInt(input.questionCount || options.questionCount || 8, 10);
    }

    const levelProfile = IELTS_READING_LEVELS[readingLevel] || IELTS_READING_LEVELS['5.5-6.5'];
    const listString = wordList.map(w => `${w.term} – ${w.definition}`).join('\n');

    const prompt = `You are a premier IELTS Reading test designer and academic linguist.
Your mission is to generate a complete academic reading passage and comprehension test with EXACTLY ${questionCount} QUESTIONS based on the learner's vocabulary list.

=======================================================
TARGET DIFFICULTY PROFILE: IELTS ${levelProfile.range} (${levelProfile.label})
=======================================================
- Target Passage Length: ${levelProfile.targetWords}
- Vocabulary Profile: ${levelProfile.vocabTarget}
- Grammar & Syntax: ${levelProfile.grammar}
- Average Sentence Length: ${levelProfile.sentenceLength}
- Cohesion & Discourse: ${levelProfile.cohesion}
- Information Density: ${levelProfile.infoDensity}
- Paraphrasing Strategy: ${levelProfile.paraphrasing}
- Inference Depth: ${levelProfile.inference}

=======================================================
VOCABULARY INTEGRATION RULES:
=======================================================
1. Naturally incorporate as many terms from the learner's vocabulary list as fits the context smoothly. Do NOT artificially cram every single word if it degrades natural academic prose.
2. Mark blank fill slots inside the English passage with [điền từ] and immediately underneath provide the Vietnamese meaning prompt in parentheses. Example:
   [điền từ]
   (phi thường, đáng kinh ngạc)
3. Provide a full, natural Vietnamese translation for the entire passage in "passageVi".
4. Comprehension Questions:
   - Provide EXACTLY ${questionCount} rigorous comprehension questions testing main ideas, details, inference, tone, and specific arguments.
   - Mix IELTS Question Types:
     * Multiple Choice (type: "mcq"): 4 options (A, B, C, D)
     * True / False / Not Given (type: "tfng"): options ["True", "False", "Not Given"]
- IMPORTANT: Questions, options, and explanations MUST be 100% in English. ABSOLUTELY NO VIETNAMESE in the questions array. Do not translate the questions or options to Vietnamese.

=======================================================
JSON OUTPUT SPECIFICATION:
=======================================================
Respond with ONLY a valid JSON object matching this schema (no extra markdown backticks, no text before or after):
{
  "title": "Passage Title in English",
  "titleVi": "Tiêu đề bài đọc (tiếng Việt)",
  "readingLevel": "${levelProfile.range}",
  "levelLabel": "${levelProfile.label}",
  "questionCount": ${questionCount},
  "passage": "English passage content with [điền từ]\\n(nghĩa tiếng Việt) for each fill-in slot",
  "passageVi": "Bản dịch tiếng Việt hoàn chỉnh của bài đọc",
  "wordBank": ["word1", "word2", "word3"],
  "questions": [
    {
      "id": 1,
      "type": "mcq",
      "question": "Comprehension question in English?",
      "options": ["A. Option one", "B. Option two", "C. Option three", "D. Option four"],
      "answer": "A",
      "explanation": "According to paragraph 1, option A is directly supported by..."
    },
    {
      "id": 2,
      "type": "tfng",
      "question": "Statement to verify according to the passage.",
      "options": ["True", "False", "Not Given"],
      "answer": "True",
      "explanation": "The author explicitly mentions that..."
    }
  ],
  "answerKey": {
    "fillBlanks": ["word1", "word2", "word3"],
    "mcq": ["A", "True"]
  }
}

=======================================================
LEARNER'S VOCABULARY LIST:
=======================================================
${listString}`;

    const text = await askGemini(prompt);
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("JSON Parse Error in generateReadingTest:", e, cleanText);
        throw new Error("Lỗi xử lý dữ liệu bài đọc từ AI. Vui lòng bấm thử lại!");
    }
}

export async function autoFillFlashcard(term) {
    const prompt = `Bạn là một từ điển tiếng Anh IELTS nâng cao. Người học cung cấp một từ tiếng Anh: "${term}".
Hãy điền đầy đủ các thông tin sau để tạo thành một thẻ Flashcard hoàn chỉnh.
Trả về đúng định dạng JSON sau (không chứa thẻ markdown):
{
    "definition": "Nghĩa tiếng Việt ngắn gọn, dễ hiểu",
    "pronunciation": "/phiên_âm_IPA/",
    "pos": "loại từ (VD: n, v, adj)",
    "example": "Một câu ví dụ NGẮN GỌN chứa từ này (KHÔNG quá 12 từ, dùng ngữ cảnh hàng ngày, chủ động, đơn giản, dễ nhớ).",
    "synonyms": "2-3 từ đồng nghĩa tiếng Anh",
    "collocations": "2-3 cụm từ (collocations) đi kèm phổ biến",
    "wordFamily": "Các họ từ (VD: danh từ, tính từ, động từ của từ này)",
    "dna_tags": ["CEFR (VD: B2)", "Domain (VD: Academic, Daily, Business...)", "POS (VD: Noun)", "Cognitive (Abstract hoặc Concrete)"],
    "acceptedAnswers": ["Nghĩa 1", "Nghĩa 2", "Từ đồng nghĩa 1"],
    "acceptedEnglishAnswers": ["Synonym 1", "Synonym 2"]
}`;
    const text = await askGemini(prompt);
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Lỗi phân tích JSON từ AI.");
    }
}

export async function paraphraseSentence(sentence) {
    const prompt = `Bạn là một chuyên gia IELTS Writing. Người dùng sẽ cung cấp một câu tiếng Anh cơ bản. Nhiệm vụ của bạn là viết lại câu này (paraphrase) thành 3 phiên bản tương ứng với 3 mức điểm IELTS khác nhau: Band 6.0, Band 7.0 và Band 8.0+.
Ở mỗi phiên bản, hãy bôi đậm (dùng thẻ <b>...</b>) những từ vựng học thuật (academic vocabulary) hoặc cấu trúc ngữ pháp đắt giá mà bạn đã thay thế so với câu gốc, đồng thời giải thích ngắn gọn bằng tiếng Việt lý do tại sao phiên bản đó đạt điểm đó.

Câu gốc của người dùng: "${sentence}"

ĐỊNH DẠNG ĐẦU RA (Chỉ trả về JSON, không markdown):
{
  "band6": {
    "sentence": "Phiên bản band 6 (có chứa thẻ <b>...</b>)",
    "explanation": "Giải thích ngắn vì sao đạt band 6"
  },
  "band7": {
    "sentence": "Phiên bản band 7 (có chứa thẻ <b>...</b>)",
    "explanation": "Giải thích ngắn vì sao đạt band 7"
  },
  "band8": {
    "sentence": "Phiên bản band 8+ (có chứa thẻ <b>...</b>)",
    "explanation": "Giải thích ngắn vì sao đạt band 8+"
  }
}`;
    const text = await askGemini(prompt);
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Lỗi phân tích kết quả AI.");
    }
}

export async function evaluateEssay(taskType, essayText) {
    const prompt = `Bạn là một giám khảo IELTS giàu kinh nghiệm. Người dùng vừa nộp một bài essay cho ${taskType === 'task1' ? 'IELTS Writing Task 1' : 'IELTS Writing Task 2'}.
Hãy chấm điểm và nhận xét chi tiết bài viết này.

Bài viết của người dùng:
"""
${essayText}
"""

ĐỊNH DẠNG ĐẦU RA (Chỉ trả về JSON hợp lệ, không chứa thẻ markdown hay văn bản ngoài):
{
  "bandScore": "Ví dụ: 6.5",
  "taskResponse": "Nhận xét về Task Achievement / Task Response",
  "coherence": "Nhận xét về Coherence and Cohesion",
  "lexical": "Nhận xét về Lexical Resource (Từ vựng)",
  "grammar": "Nhận xét về Grammatical Range and Accuracy (Ngữ pháp)",
  "highlights": "Đưa ra 2-3 câu bị lỗi ngữ pháp hoặc dùng từ chưa hay, kèm theo gợi ý sửa lại (dưới dạng bullet point text).",
  "rewrite8": "Viết lại TOÀN BỘ bài này theo văn phong đạt Band 8.0+ để người dùng tham khảo."
}`;
    const text = await askGemini(prompt);
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Lỗi phân tích JSON đánh giá từ AI.");
    }
}

export async function autoFillFlashcardsBatch(termsArray) {
    if (!termsArray || termsArray.length === 0) return {};
    
    const termsString = termsArray.join('", "');
    const prompt = `Bạn là một từ điển tiếng Anh IELTS nâng cao. Người học cung cấp một mảng các từ tiếng Anh sau: ["${termsString}"].
Hãy điền đầy đủ các thông tin cho từng từ để tạo thành các thẻ Flashcard.
Trả về đúng định dạng JSON Object (Key là từ vựng, Value là thông tin của từ đó). Không chứa thẻ markdown.
Ví dụ định dạng đầu ra:
{
    "word1": {
        "definition": "Nghĩa tiếng Việt ngắn gọn, dễ hiểu",
        "pronunciation": "/phiên_âm_IPA/",
        "pos": "loại từ (VD: n, v, adj)",
        "example": "Một câu ví dụ NGẮN GỌN chứa từ này (KHÔNG quá 12 từ, dùng ngữ cảnh hàng ngày, chủ động, đơn giản, dễ nhớ).",
        "synonyms": "2-3 từ đồng nghĩa tiếng Anh",
        "collocations": "2-3 cụm từ đi kèm phổ biến",
        "wordFamily": "Các họ từ (danh từ, tính từ...)",
        "dna_tags": ["Domain", "POS"],
        "acceptedAnswers": ["Nghĩa 1", "Nghĩa 2", "Từ đồng nghĩa 1"],
        "acceptedEnglishAnswers": ["Synonym 1", "Synonym 2"]
    },
    "word2": { ... }
}`;
    const text = await askGemini(prompt);
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Lỗi phân tích JSON từ AI khi điền hàng loạt.");
    }
}

export async function gradeSentence(word, sentence, contextHint = '') {
    const prompt = `Bạn là một AI chấm điểm đặt câu tiếng Anh. Người dùng đang cố gắng chuyển từ vựng "${word}" từ dạng "Passive Vocabulary" sang "Active Vocabulary" bằng cách tự đặt câu.
Nhiệm vụ của bạn là kiểm tra xem họ dùng từ "${word}" trong câu: "${sentence}" có đúng ngữ pháp, đúng ngữ cảnh và có tự nhiên không.
Ngữ cảnh gợi ý (nếu có): ${contextHint}

ĐỊNH DẠNG ĐẦU RA (Chỉ trả về JSON hợp lệ, không chứa thẻ markdown hay văn bản ngoài):
{
  "isCorrect": true/false,
  "score": 85,
  "feedback": "Nhận xét chi tiết (tiếng Việt) về cách dùng từ này trong câu. Nếu sai, giải thích rõ tại sao sai và gợi ý cách sửa. Nếu đúng, có thể gợi ý cách viết hay hơn (paraphrase).",
  "isContextUsageGood": true/false
}`;
    const text = await askGemini(prompt);
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Lỗi phân tích JSON chấm điểm đặt câu.");
    }
}
