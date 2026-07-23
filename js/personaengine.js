import { store } from './store.js';
import { updateUserProfile } from './db.js';

// Khởi tạo các chiều không gian nhận thức cơ bản
export function initPersona(profile) {
    if (!profile.learning_persona) {
        profile.learning_persona = {
            consistency: 50,      // Mức độ ổn định trong học tập
            focus: 50,            // Khả năng duy trì sự chú ý
            persistence: 50,      // Sự kiên trì sau khi làm sai
            metacognition: 50,    // Nhận thức về sự học (đọc giải thích AI)
            exploration: 50,      // Dám học từ mới vs Ôn từ cũ
            interaction_count: 0,
            confidence: 0
        };
    }
    return profile.learning_persona;
}

// Hàm cốt lõi để cập nhật Persona bằng Exponential Moving Average (EMA)
export async function updatePersona(eventData) {
    if (!store.user || !store.userProfile) return;
    
    let persona = initPersona(store.userProfile);
    
    // Alpha càng thấp, dữ liệu lịch sử càng có sức nặng (Smooth learning curve)
    const ALPHA = 0.05; 
    
    // Xử lý các sự kiện hành vi khác nhau
    switch (eventData.type) {
        case 'study_card':
            // 1. Phân tích Focus: Trả lời nhanh gọn -> tăng. Quá lâu hoặc sai sau khi nghĩ lâu -> giảm.
            let focusDelta = 0;
            if (eventData.latency < 3000 && eventData.outcome) focusDelta = 5; // Tập trung tốt
            else if (eventData.latency > 10000 && !eventData.outcome) focusDelta = -5; // Mất tập trung
            persona.focus = (ALPHA * (persona.focus + focusDelta)) + ((1 - ALPHA) * persona.focus);

            // 2. Phân tích Persistence: Xử lý lỗi sai (Rage-click detection)
            // Nếu đây là câu sai và phản hồi quá nhanh (< 500ms), chứng tỏ học sinh đang "Rage-click" (click bừa cho qua)
            if (!eventData.outcome && eventData.latency < 500) {
                persona.persistence = (ALPHA * (persona.persistence - 10)) + ((1 - ALPHA) * persona.persistence);
            } 
            // Nếu trả lời đúng MỘT CÂU KHÓ (sau khi sai trước đó) và thời gian suy nghĩ kỹ (> 2s)
            else if (eventData.outcome && eventData.isAfterError && eventData.latency > 2000) {
                persona.persistence = (ALPHA * (persona.persistence + 10)) + ((1 - ALPHA) * persona.persistence);
            }
            break;
            
        case 'read_insight':
            // 3. Phân tích Metacognition: Thời gian dừng lại đọc AI Insight
            // Giả sử cứ 1 giây đọc insight = +1 điểm metacognition
            const readSeconds = Math.min(eventData.duration / 1000, 30); // Max cap 30s
            persona.metacognition = (ALPHA * (persona.metacognition + readSeconds)) + ((1 - ALPHA) * persona.metacognition);
            break;
            
        case 'session_end':
            // 4. Phân tích Consistency & Exploration
            // Exploration: Tỷ lệ thẻ mới / thẻ cũ trong một session
            if (eventData.totalCards > 0) {
                const newRatio = eventData.newCards / eventData.totalCards;
                // Nếu > 30% là thẻ mới -> tính là thích khám phá
                const explorationDelta = newRatio > 0.3 ? 10 : -2;
                persona.exploration = (ALPHA * (persona.exploration + explorationDelta)) + ((1 - ALPHA) * persona.exploration);
            }
            break;
    }
    
    // Normalize dữ liệu (0-100)
    ['consistency', 'focus', 'persistence', 'metacognition', 'exploration'].forEach(dim => {
        persona[dim] = Math.max(0, Math.min(100, persona[dim]));
    });
    
    // Cập nhật mức độ tin cậy của AI Profile (Cần ít nhất 500 interaction để đạt 100% confidence)
    persona.interaction_count += 1;
    persona.confidence = Math.min(100, (persona.interaction_count / 500) * 100);
    
    // Lưu lên Firestore
    store.userProfile.learning_persona = persona;
    await updateUserProfile(store.user.uid, { learning_persona: persona });
}
