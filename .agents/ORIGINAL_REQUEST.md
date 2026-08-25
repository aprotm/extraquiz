# Original User Request

## 2026-08-25T00:28:17Z

Xây dựng hệ thống giao diện toàn diện (Full Theme Visual Overhaul Engine) đạt tiêu chuẩn VIP cao cấp nhất cho 2 theme độc quyền trong LexiStore: Cyber Matrix Neon và Sunset Synthwave 80s, biến đổi toàn bộ màu sắc, ánh sáng neon huỳnh quang, hình nền grid/hiệu ứng visual, nút bấm, card, sidebar và biểu đồ mà không làm ảnh hưởng đến tính ổn định hay tính năng cốt lõi của ứng dụng.

Working directory: e:/flashcardbyvanhngo
Integrity mode: development

## Requirements

### R1. Cyber Matrix Neon Theme Engine (VIP Hacker Edition)
- Biến đổi toàn bộ không gian ứng dụng sang phong cách Cyber Matrix đỉnh cao: Nền Deep Obsidian (#040810), hiệu ứng lưới vi mạch cyber emerald neon (#00FF9D, #059669, #10B981), viền phát quang huỳnh quang và terminal headers.
- Áp dụng đồng bộ lên tất cả các thành phần: Dashboard, Sidebar, Topbar, Flashcard Study, Arcade Game Arena, LexiStore, và Modals.

### R2. Sunset Synthwave 80s Theme Engine (Outrun / Retro Laser Edition)
- Biến đổi toàn bộ không gian ứng dụng sang phong cách Outrun Retro 80s với bảng màu hoàng hôn rực rỡ: Hot Pink/Magenta (#FF2A85), Tím Neon Synth (#9D00FF), Cam hoàng hôn (#FF7B00), đường chân trời retro synthwave horizon, và nút bấm chrome laser phát sáng.
- Đồng bộ hóa 100% các component và view học tập.

### R3. Quick Theme Selector in Settings (UserTool)
- Tích hợp thêm bộ chọn nhanh giao diện (Theme Picker) ngay trong Tab Hiển Thị của Modal Cài Đặt (UserTool) bên cạnh nút quản lý trong LexiStore, hiển thị các theme đã mở khóa và cho phép đổi tức thì.

### R4. Seamless Theme Isolation & Zero Regression Guard
- Triển khai thông qua CSS Tokens và scoped classes sạch sẽ trên thẻ <html>/<body> (.theme-matrix và .theme-synthwave).
- 100% đảm bảo độ tương phản cao, dễ đọc văn bản và tương thích mượt mà trên cả PC và Mobile.

## Acceptance Criteria

### Visual & Aesthetics
- [ ] Giao diện Cyber Matrix Neon hiển thị rực rỡ với sắc màu Emerald huỳnh quang, viền neon tinh xảo và background cyber sống động.
- [ ] Giao diện Sunset Synthwave 80s hiển thị đầy đủ hiệu ứng laser gradient tím/hồng/cam hoàng hôn 80s huyền ảo.
- [ ] Chuyển đổi qua lại giữa Giao diện Mặc Định, Matrix, và Synthwave tức thì chỉ bằng 1 cú click trong LexiStore hoặc Cài đặt.

### Compatibility & Performance
- [ ] 100% các tính năng hiện có (Lật thẻ 3D, Ôn tập, Đấu Trùm, Arcade, Đọc hiểu AI, Roadmap, Cài đặt) hoạt động hoàn hảo, không bị đè nút hay vỡ layout.
- [ ] Độ tương phản văn bản luôn sắc nét, dễ đọc (tất cả các nhãn, câu hỏi, từ vựng đều nổi bật trên nền theme).
- [ ] 0 lỗi Javascript console khi bật/tắt hoặc đổi theme.
