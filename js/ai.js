export async function askGemini(prompt) {
    const apiKey = localStorage.getItem('gemini_api_key');
    if (!apiKey) {
        throw new Error("Vui lòng nhập Gemini API Key trong Cài đặt trước khi sử dụng tính năng này.");
    }

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
            const err = await response.json();
            let msg = err.error?.message || "Lỗi khi gọi Gemini API";
            if (msg.includes("high demand") || msg.includes("overloaded") || response.status === 503) {
                msg = "Hệ thống AI Google đang quá tải. Vui lòng thử lại sau giây lát!";
            } else if (response.status === 429 || msg.includes("quota")) {
                msg = "Vượt quá giới hạn gọi API (Rate limit). Vui lòng đợi một phút rồi thử lại!";
            } else if (response.status === 400 && msg.includes("API key not valid")) {
                msg = "Gemini API Key không hợp lệ. Vui lòng kiểm tra lại trong Cài đặt!";
            }
            throw new Error(msg);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (e) {
        console.error("Gemini Error:", e);
        throw e;
    }
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

export async function generateRoadmap(inputBand, targetBand, timeMonths, purpose, studyHours) {
    const prompt = `Bạn là một chuyên gia tư vấn học tập IELTS với kinh nghiệm 10+ năm, từng hỗ trợ hàng nghìn học viên đạt band mục tiêu. Nhiệm vụ của bạn là thiết kế một **lộ trình học IELTS chi tiết, cá nhân hóa cao** dựa trên thông tin người học.

**THÔNG TIN ĐẦU VÀO:**
- Band hiện tại (nếu chưa thi thì ước lượng): ${inputBand}
- Band mục tiêu: ${targetBand}
- Thời gian ôn thi (tháng): ${timeMonths}
- Nhu cầu chính: ${purpose} (ví dụ: du học bậc đại học, xin việc tại công ty đa quốc gia, xét tốt nghiệp THPT, định cư, ...)
- Thời gian học trung bình mỗi ngày (giờ): ${studyHours}

**YÊU CẦU ĐẦU RA – LỘ TRÌNH PHẢI BAO GỒM:**

### 1. Đánh giá trình độ hiện tại và khoảng cách
- Phân tích điểm mạnh/yếu của người học dựa trên band đầu vào (nếu có) hoặc ước lượng.
- Chỉ rõ mức độ chênh lệch giữa band hiện tại và band mục tiêu (khoảng cách).
- Dự đoán thách thức lớn nhất với từng kỹ năng (Nghe, Nói, Đọc, Viết).

### 2. Mục tiêu cụ thể cho từng kỹ năng
- Đề xuất điểm số cần đạt cho mỗi kỹ năng (Nghe, Nói, Đọc, Viết) để đạt được band tổng mong muốn.
- Giải thích ngắn gọn lý do phân bổ điểm đó.

### 3. Lộ trình chi tiết theo giai đoạn (chia theo tháng hoặc tuần)
Với mỗi giai đoạn, hãy cung cấp:
- **Mục tiêu giai đoạn:** Cụ thể cho từng kỹ năng.
- **Nội dung học tập:**
  - Nghe: Các dạng bài tập (VD: điền từ, bản đồ, matching), số lượng bài nghe/tuần, gợi ý nguồn nghe (BBC, TED, Podcast...).
  - Đọc: Các dạng bài đọc (True/False/NG, Matching Headings, Summary...), chiến thuật skimming/scanning, luyện tốc độ đọc.
  - Viết: Phân bổ thời gian cho Task 1 và Task 2, các dạng đề, cấu trúc bài viết, từ vựng học thuật (Academic word list).
  - Nói: Các chủ đề Part 1, Part 2 (cue card), Part 3, cách phát triển ý, phát âm, ngữ điệu.
- **Từ vựng:** Chủ đề và số lượng từ cần học mỗi tuần (theo chủ đề: Education, Environment, Technology, Health, etc.).
- **Ngữ pháp:** Các cấu trúc quan trọng cần ôn (câu điều kiện, mệnh đề quan hệ, đảo ngữ, thì...).
- **Lịch học gợi ý hàng ngày:** Phân chia thời gian cụ thể cho từng kỹ năng, đảm bảo phù hợp với ${studyHours} giờ mỗi ngày.

### 4. Tài liệu và công cụ học tập được đề xuất
- Danh sách sách (Cambridge IELTS, bộ sách chuyên sâu cho từng kỹ năng...).
- Ứng dụng/trang web (tự luyện, luyện phát âm, mô phỏng thi).
- Kênh YouTube / Podcast hữu ích.

### 5. Lộ trình luyện đề thi thử (mock test)
- Khi nào bắt đầu làm đề full test?
- Tần suất (tuần bao nhiêu đề) và cách phân tích kết quả.

### 6. Lời khuyên chiến lược đặc biệt (dành riêng cho nhu cầu của người học)
- Nếu nhu cầu là du học: tập trung vào viết học thuật và nói tự nhiên.
- Nếu nhu cầu là xin việc: ưu tiên kỹ năng giao tiếp (Nói, Viết email/ báo cáo).
- Nếu yếu một kỹ năng cụ thể: đề xuất kế hoạch cải thiện riêng.

**ĐỊNH DẠNG ĐẦU RA:**
Hãy trả lời bằng văn bản có cấu trúc Markdown, với các phần chính được đánh số và in đậm. Lộ trình phải chi tiết, dễ hiểu, thực tế và có thể áp dụng ngay.`;

    const text = await askGemini(prompt);
    return text;
}

export async function generateReadingTest(wordList) {
    const listString = wordList.map(w => `${w.term} – ${w.definition}`).join('\n');
    const prompt = `Bạn là chuyên gia ra đề thi IELTS Reading. Nhiệm vụ của bạn là tạo một **bài tập đọc hiểu dạng điền từ** hoàn chỉnh, dựa trên danh sách từ vựng mà người học đang ôn.

**YÊU CẦU ĐẶC BIỆT:**
- Mỗi chỗ trống cần được đánh dấu bằng \`[điền từ]\` và **ngay bên dưới** có gợi ý nghĩa tiếng Việt của từ cần điền (trong ngoặc đơn, ví dụ: \`(phi thường, đáng kinh ngạc)\`).
- Cung cấp **bản dịch tiếng Việt cho toàn bộ bài đọc** (để người học có thể đối chiếu).
- Mỗi câu trong passage có thể được đánh số hoặc tách đoạn để dễ theo dõi.

**ĐỊNH DẠNG ĐẦU RA (JSON):**

\`\`\`json
{
  "title": "Tiêu đề bài đọc (tiếng Anh)",
  "titleVi": "Tiêu đề bài đọc (tiếng Việt)",
  "passage": "Nội dung bài đọc tiếng Anh, với các [điền từ] và gợi ý nghĩa tiếng Việt ngay bên dưới mỗi chỗ trống (ví dụ: [điền từ]\\n(phi thường, đáng kinh ngạc))",
  "passageVi": "Bản dịch tiếng Việt của toàn bộ bài đọc (giữ nguyên các chỗ trống nhưng có thể dịch nghĩa của từ cần điền để tham khảo)",
  "wordBank": ["danh sách các từ cần điền (dạng nguyên mẫu, không có nghĩa)"],
  "questions": [
    {
      "id": 1,
      "question": "Câu hỏi đọc hiểu (tiếng Anh)",
      "questionVi": "Câu hỏi đọc hiểu (tiếng Việt - tùy chọn)",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "answer": "A"
    }
  ],
  "answerKey": {
    "fillBlanks": ["từ đúng cho chỗ trống 1", "từ đúng cho chỗ trống 2"],
    "mcq": ["A", "B"]
  }
}
\`\`\`

DANH SÁCH TỪ VỰNG CỦA NGƯỜI HỌC (điền vào chỗ trống bên dưới):
${listString}

HƯỚNG DẪN CỤ THỂ KHI VIẾT PASSAGE:
Bài đọc tiếng Anh dài khoảng 200-250 từ, chia thành 2-3 đoạn.
Tích hợp ít nhất 6-8 từ vựng từ danh sách vào bài đọc, mỗi từ xuất hiện ít nhất một lần (có thể biến đổi dạng từ nếu cần, nhưng phần điền phải là dạng gốc trong wordBank).
Với mỗi chỗ trống, cung cấp gợi ý nghĩa tiếng Việt ngay bên dưới nó trong dấu ngoặc đơn.
Bản dịch tiếng Việt (passageVi) cần dịch sát nghĩa, tự nhiên.

YÊU CẦU VỀ CÂU HỎI TRẮC NGHIỆM:
Có 3-4 câu hỏi đọc hiểu, mỗi câu 4 lựa chọn (A, B, C, D).
Câu hỏi kiểm tra ý chính, chi tiết, suy luận. Đáp án phải dựa trên thông tin trong bài đọc.

LƯU Ý QUAN TRỌNG:
Trả về duy nhất một JSON object hợp lệ, không kèm bất kỳ văn bản nào khác.
Đảm bảo JSON có thể parse được bằng JSON.parse().`;

    const text = await askGemini(prompt);
    // Xử lý loại bỏ block markdown (nếu AI cố tình trả về)
    const cleanText = text.replace(/```json/gi, '').replace(/```/gi, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        throw new Error("Lỗi đọc dữ liệu từ AI. Hãy thử lại!");
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
