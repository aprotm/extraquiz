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

## 2026-08-25T11:55:29Z

Tách riêng subsystem Gemini Image Extraction hiện tại từ hệ thống trích xuất đề thi (E:\testcapture\HSA_EXAM_TOOL) thành standalone Image Extractor độc lập tại E:\testcapture\HSA_EXAM_TOOL\image_extractor kèm CLI image_extractor_cli.py, bảo toàn nguyên vẹn 100% kiến trúc Gemini API / prompt / response parsing / coordinate processing / crop logic và các bug-fix hiện có, đồng thời xây dựng compatibility layer cho full pipeline hiện tại, bộ golden-master characterization test, visual debug viewer và benchmark suite.

Working directory: E:\testcapture\HSA_EXAM_TOOL
Integrity mode: development

## Requirements

### R1. Extraction & Subsystem Isolation
- Tách Image Extraction core (bao gồm Gemini Object Detection, Coordinate Normalization/Whitespace-Snap, CV Morphology Analyzer, Hard Filters & Cropper) thành package standalone image_extractor độc lập.
- Cung cấp interface chuẩn (ImageExtractor.extract(image_path_or_pil, options) -> ExtractionResult) hỗ trợ single image, directory of images và batch processing.
- Hỗ trợ trường hợp regions = [] (None / No illustration) hoàn toàn hợp lệ mà không sinh lỗi.

### R2. 100% Gemini & Logic Preservation
- Bảo toàn nguyên vẹn model (gemini-2.0-flash / gemini-1.5-flash / gemini-3.5-flash-lite), API flow, prompt text, system instruction, temperature/config, response schema, coordinate conversion, padding, và validation heuristics trong suốt giai đoạn migration.
- Không thay thế Gemini bằng OpenCV thuần, YOLO, SAM hay bất kỳ mô hình nào khác trong migration phase.

### R3. Full Pipeline Compatibility Layer
- Tạo compatibility wrapper để toàn bộ pipeline hiện tại (structured_extractor.py, Run_Trich_Xuat_De.bat) tiếp tục hoạt động 100% bình thường bằng cách import và tái sử dụng chung image_extractor core mà không bị duplicate code hay đứt gãy luồng xử lý cũ.

### R4. Characterization, Golden Master & Regression Suite
- Xây dựng bộ test characterization chạy trên tập ảnh representative để lưu lại: original.png, gemini_raw.json, parsed_regions.json, metadata.json, debug_bbox.png, và các ảnh crops/.
- Thiết lập Golden Master baseline để kiểm chứng tính tương đương (Equivalence Check: Old vs Standalone).
- Xây dựng Regression Test suite cho các lỗi đặc thù: False Positive ô nút A/B/C/D, cắt sót hình, cắt dính chữ đề bài, lẹm nhãn điểm.

### R5. Visual Debug Mode & Standalone CLI
- Standalone CLI cho phép chạy độc lập: python image_extractor_cli.py --input <image_or_dir> --output <output_dir> --debug.
- Sinh ảnh trực quan hóa visual debug: Bounding Box overlay (màu phân biệt giữa Accepted và Rejected candidates), nhãn vùng, confidence score, và preview các ảnh đã crop.

## Acceptance Criteria

### Architecture & Preservation
- [ ] Module image_extractor hoạt động hoàn toàn độc lập, không phụ thuộc vào question chunking hay docx/latex pipeline.
- [ ] Full pipeline structured_extractor.py tái sử dụng image_extractor và hoạt động không có regression.
- [ ] 100% Gemini prompt, request params, và coordinate conversion logic được giữ nguyên vẹn.

### Testing & Equivalence
- [ ] Golden Master equivalence test chứng minh output của Standalone 100% tương đương với implementation cũ trên cùng tập dữ liệu.
- [ ] Visual Debug Overlay sinh đầy đủ ảnh BBox overlay và lưu raw Gemini response JSON cho mọi lần chạy.
- [ ] Toàn bộ test suite chạy tự động và báo cáo metrics chi tiết (Precision, Recall, F1, IoU, Duplicate Rate, Contamination Rate).

