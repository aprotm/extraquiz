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

## 2026-09-24T09:06:24Z

Tái cấu trúc và đại tu toàn diện thiết kế giao diện UI/UX của hệ thống LexiLearn Flashcard Web App sang phong cách **Modern Cyber-Dark & Glassmorphism** (Neuroscience & AI Lab theme) chuẩn công nghiệp, tối ưu hóa responsive, hiệu ứng vi tương tác và loại bỏ hoàn toàn việc dùng emoji làm icon chức năng.

Working directory: e:\flashcardbyvanhngo
Integrity mode: development

## Requirements

### R1. Xây dựng Design System Core & Global Styles
- Định nghĩa bộ Design Tokens (bảng màu Cyber-Dark, typography Plus Jakarta Sans / Inter, spacing scale 4/8dp, utility classes cho Glassmorphism & Neon accents trong `css/style.css`).
- Thay thế toàn bộ emoji làm icon điều hướng/chức năng bằng Vector Icons (FontAwesome / Phosphor SVG).

### R2. Đại tu Dashboard & Trung Tâm Chỉ Huy AI
- Nâng cấp Hero Command Hub, các widget HLR Retention Decay v3.2, Radar nhận thức 5 chiều, Biểu đồ nhịp độ học 7 ngày và Ma trận Heatmap 365 ngày sang chuẩn Glassmorphism trong `js/components/lexilearndashboard.js`.

### R3. Tối ưu Giao diện Học & Võ đài Arcade
- Nâng cấp thẻ Flashcard 3D, giao diện Học từ vựng, Quiz, và các chế độ Arcade (Boss Battle, AI Arena) với thanh trạng thái HP, combo multiplier và countdown timer sinh động.

### R4. Đồng bộ Cửa hàng LexiStore, Phòng truyền thống & Cài đặt
- Nâng cấp card vật phẩm Cửa hàng theo cấp bậc độ hiếm, Gallery Phòng truyền thống huy hiệu, và Modal cài đặt UserTool.

## Acceptance Criteria

### Visual & Semantic Quality
- [ ] 100% Vector icons đồng bộ, không sử dụng emoji cho các nút bấm hành động hoặc menu điều hướng.
- [ ] Bảng màu và độ tương phản đạt chuẩn WCAG AA (Tỷ lệ tương phản text tối thiểu >= 4.5:1).
- [ ] Các thành phần giao diện sử dụng chung hệ thống token khoảng cách (4/8dp) và bo góc nhất quán.

### Responsiveness & Interaction
- [ ] Tương thích responsive mượt mà từ màn hình điện thoại 375px đến màn hình máy tính 1080p+.
- [ ] Kích thước vùng bấm (touch target) trên di động đạt tối thiểu 44x44px.
- [ ] Các tương tác rê chuột (hover), nhấn nút (active) và chuyển cảnh đều có hiệu ứng micro-transitions mượt mà.
