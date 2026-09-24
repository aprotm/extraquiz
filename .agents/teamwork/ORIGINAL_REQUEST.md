# Original User Request

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
