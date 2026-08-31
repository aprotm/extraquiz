# Original User Request

## 2026-08-31T05:35:17Z

Khắc phục các lỗi đồng bộ dữ liệu (mất dữ liệu ma trận học tập, sai lệch LexiCredit, biểu đồ trí nhớ Ebbinghaus không giảm) và xây dựng Hệ thống Động lực (Motivation System) theo cơ chế trừng phạt, khóa tính năng và cưỡng chế học tập.

Working directory: e:\flashcardbyvanhngo
Integrity mode: development

## Requirements

### R1. Sửa lỗi Đồng bộ dữ liệu & Logic Decay
- **Đồng bộ Firebase khắt khe**: Sửa lỗi mất dữ liệu trên Heatmap (Ma trận học tập) và sai lệch số dư LexiCredit. Yêu cầu mọi thao tác cập nhật điểm và lịch sử học phải đồng bộ lên Firebase ngay lập tức. Nếu thất bại (lỗi mạng/API), hệ thống phải hiển thị cảnh báo đỏ và yêu cầu thử lại.
- **Ebbinghaus Memory Curve**: Sửa logic trong HLR Decay Engine. Nếu người dùng bỏ học thời gian dài (ví dụ: vài tuần hoặc vài tháng), biểu đồ trí nhớ phải tụt xuống mức thực tế (dưới 20%), không được giữ ở mức cao một cách vô lý.

### R2. Xây dựng Hệ thống Cưỡng chế & Động lực Học tập (Motivation System)
- **Hệ thống Phạt (Punishment)**: Trừ LexiCredit mỗi ngày, rớt Rank, và hủy hoàn toàn chuỗi Streak nếu người dùng bỏ lỡ bài học vượt quá thời hạn cho phép.
- **Nhiệm vụ Bắt buộc (Lockdown)**: Khóa hoàn toàn các tính năng Pro (như Đọc hiểu AI, Chấm Writing AI) cho đến khi người dùng hoàn thành quota tối thiểu mỗi ngày (ví dụ: 50 thẻ).
- **Trạng thái Khẩn cấp (Urgency)**: Nếu chưa đạt quota ngày, ngay khi mở web, hệ thống phải liên tục bật popup cảnh báo đỏ và "cưỡng chế" chuyển hướng thẳng vào màn hình chế độ học, không cho phép sử dụng các tính năng giải trí khác.

## Acceptance Criteria

### R1 Verification (Agent-as-Judge Rubric)
- [ ] Khi ngắt kết nối mạng hoặc giả lập lỗi API, việc cập nhật điểm LexiCredit/Heatmap phải hiển thị cảnh báo đỏ và không được lưu cục bộ một cách sai lệch.
- [ ] Khi kết nối mạng bình thường, số dư LexiCredit trên Header và Profile phải giống nhau 100% khi reload trang.
- [ ] Agent kiểm duyệt phải thay đổi `lastStudiedDate` của một từ vựng thành 60 ngày trước, và xác nhận rằng hàm tính tỷ lệ nhớ (Retention Rate) trả về mức dưới 20%.

### R2 Verification (Agent-as-Judge Rubric)
- [ ] Agent kiểm duyệt phải giả lập người dùng đã bỏ học 3 ngày: Xác nhận rằng khi load app, LexiCredit bị trừ, Streak về 0, và Rank bị giảm.
- [ ] Agent kiểm duyệt phải thử truy cập URL/route của tính năng 'Đọc Hiểu AI' khi chưa học đủ thẻ: Xác nhận rằng hệ thống chặn truy cập và chuyển hướng (redirect) ép buộc về màn hình học thẻ.
- [ ] Giao diện hiển thị cảnh báo đỏ rõ ràng, báo cho người dùng biết họ đang bị "Lockdown" do chưa hoàn thành nhiệm vụ ngày.
