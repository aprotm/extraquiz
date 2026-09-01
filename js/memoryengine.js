/**
 * AI Memory Prediction Engine
 * Implements Half-Life Regression and Memory Strength calculations.
 * Strict Responsibility: Deterministic math only. No LLM integration.
 */

// Tính xác suất nhớ hiện tại (Retention Probability - Pr)
// P(t) = 2^(-Δt / h)
// delta_t: Số phút trôi qua kể từ lần ôn tập cuối
// half_life: Chu kỳ bán rã (phút)
export function calculateRetentionProb(halfLife, deltaT_minutes) {
    if (halfLife <= 0) return 0;
    
    const daysAbsent = deltaT_minutes / 1440;
    
    // Tính toán tỷ lệ nhớ cơ bản (Base Pr)
    let pr = Math.pow(2, -deltaT_minutes / halfLife);

    // CHẾ ĐỘ KỶ LUẬT THÉP (Hardcore Decay Penalty):
    // Bỏ mặc từ vựng quá 7 ngày (1 tuần) sẽ bắt đầu trừ thẳng vào trí nhớ thực tế
    // Không quan tâm half-life cao tới đâu.
    if (daysAbsent > 7) {
        // Mỗi ngày vắng mặt sau 1 tuần sẽ trừ 3% tỷ lệ nhớ
        const directPenalty = (daysAbsent - 7) * 0.03; 
        pr = pr - directPenalty;
    }
    
    // Đảm bảo không vượt quá 100% và không tụt dưới 10% (ít nhất vẫn còn mang máng)
    return Math.min(1.0, Math.max(0.1, pr));
}

// Cập nhật Chu kỳ bán rã mới (HLR - BKT Simplified)
export function updateHalfLife(currentHalfLife, outcome, latency_ms, modality) {
    // Nếu từ mới tinh
    if (!currentHalfLife || currentHalfLife <= 0) {
        currentHalfLife = modality === 'RECOGNITION' ? 1440 : 720; // Khởi tạo: Nhận diện = 1 ngày, Nhớ lại = 12 tiếng
    }

    let multiplier = 1.0;

    if (outcome) {
        // Phản hồi đúng
        multiplier = 2.0; // Cơ bản nhân đôi half-life
        
        // Bonus nếu trả lời cực nhanh
        if (latency_ms < 1500) multiplier += 0.5;
        // Trừ bớt nếu trả lời quá lâu (chứng tỏ đang vật lộn)
        else if (latency_ms > 5000) multiplier -= 0.5;

        // Recall khó hơn Recognition, nên nếu đúng Recall thì tăng half-life mạnh hơn
        if (modality === 'RECALL') {
            multiplier *= 1.2;
        }
    } else {
        // Phản hồi sai
        multiplier = 0.5; // Giảm một nửa
        
        if (latency_ms < 1000) {
            // Sai quá nhanh -> Đoán bừa
            multiplier = 0.2; 
        }
    }

    // Giới hạn max half life khoảng 3 năm để không mất hẳn
    const MAX_HALF_LIFE = 3 * 365 * 24 * 60; 
    // Giới hạn min half life 10 phút
    const MIN_HALF_LIFE = 10;

    let newHalfLife = currentHalfLife * multiplier;
    if (newHalfLife > MAX_HALF_LIFE) newHalfLife = MAX_HALF_LIFE;
    if (newHalfLife < MIN_HALF_LIFE) newHalfLife = MIN_HALF_LIFE;

    return newHalfLife;
}

// Đánh giá mức độ cần thiết ôn tập (Review Urgency)
// Dựa trên mức Pr lý tưởng là 0.85
export function calculateUrgency(retentionProb) {
    // Pr càng thấp, Urgency càng cao. Max là 1.0, Min là 0.0
    if (retentionProb <= 0.85) {
        // Ánh xạ từ 0 -> 0.85 thành 1.0 -> 0.5
        return Math.max(0.5, 1.0 - (retentionProb / 1.7));
    } else {
        // Pr từ 0.85 -> 1.0 => Urgency từ 0.5 -> 0.0
        return Math.max(0, 0.5 - ((retentionProb - 0.85) / 0.3));
    }
}

// Đánh giá độ tin cậy của thuật toán (Confidence Score)
export function calculateConfidence(historyLength, lastOutcome, currentOutcome, latency_ms) {
    if (historyLength === 0) return { score: 'LOW', reason: 'Chưa đủ dữ liệu để đánh giá chính xác.' };
    
    // Mâu thuẫn dữ liệu: Lần trước đúng, lần này sai rất nhanh
    if (lastOutcome === true && currentOutcome === false && latency_ms < 1500) {
        return { score: 'LOW', reason: 'Dữ liệu mâu thuẫn, hệ thống cần thêm một bài kiểm tra để xác nhận.' };
    }

    if (historyLength > 5) {
        return { score: 'HIGH', reason: 'Dữ liệu ổn định, dự đoán có độ tin cậy cao.' };
    }

    return { score: 'MEDIUM', reason: 'Dữ liệu đang ở mức trung bình, cần duy trì ôn tập để hệ thống học thói quen.' };
}

// Micro-Explanation (What - Why - Action)
export function generateMicroExplanation(retentionProb, urgency, deltaT_days) {
    if (urgency >= 0.8) {
        return {
            what: 'Tỷ lệ nhớ từ này đã giảm xuống mức nguy hiểm (dưới 50%).',
            why: `Bạn đã không ôn tập từ này trong khoảng ${Math.round(deltaT_days)} ngày qua.`,
            action: 'Hãy ôn tập ngay bây giờ để ngăn chặn việc quên vĩnh viễn.'
        };
    } else if (urgency >= 0.5) {
        return {
            what: 'Từ vựng đã chạm ngưỡng quên lý tưởng (khoảng 80%).',
            why: 'Đây là thời điểm tốt nhất để bộ não củng cố lại thông tin.',
            action: 'Hãy tiến hành Recall để ghim từ vào trí nhớ dài hạn.'
        };
    } else {
        return {
            what: 'Trí nhớ của bạn về từ này vẫn đang rất vững chắc.',
            why: 'Thuật toán HLR dự đoán bạn chưa thể quên từ này lúc này.',
            action: 'Bỏ qua, hãy dành thời gian học các từ khó hơn.'
        };
    }
}

// Tính toán Mastery Score (Active vs Passive)
export function calculateMastery(currentScore, modality, outcome, latency_ms, isSentenceGen = false, isContextUsage = false) {
    let newScore = currentScore || 0;
    
    if (!outcome) {
        newScore -= 5;
    } else {
        if (modality === 'RECOGNITION') {
            // Tối đa 20đ cho Recognition
            if (newScore < 20) {
                newScore += (latency_ms < 2000) ? 5 : 2;
                if (newScore > 20) newScore = 20;
            }
        } else if (modality === 'RECALL') {
            // Tối đa 40đ cho Recall (bao gồm 20đ recognition)
            if (newScore < 40) {
                newScore += (latency_ms < 3000) ? 8 : 4;
                if (newScore > 40) newScore = 40;
            }
        } else if (modality === 'ACTIVATE') {
            if (isSentenceGen) newScore += 30;
            if (isContextUsage) newScore += 20;
        }
    }
    
    if (newScore < 0) newScore = 0;
    if (newScore > 100) newScore = 100;
    
    let state = 'Unknown';
    if (newScore <= 10) state = 'Unknown';
    else if (newScore <= 30) state = 'Seen';
    else if (newScore <= 60) state = 'Passive';
    else if (newScore <= 75) state = 'Practicing';
    else if (newScore <= 90) state = 'Active';
    else state = 'Mastered';
    
    return { score: newScore, state };
}
