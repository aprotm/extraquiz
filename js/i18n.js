import { store } from './store.js';

export const translations = {
    vi: {
        // App / Navigation
        'nav.dashboard': 'Trang chủ',
        'nav.create': 'Tạo bộ thẻ',
        'nav.reading': 'Luyện đọc hiểu',
        'nav.logout': 'Đăng xuất',
        
        // Dashboard
        'dash.title': 'Bộ thẻ của bạn',
        'dash.subtitle': 'Quản lý và ôn tập từ vựng mỗi ngày',
        'dash.welcome': 'Chào mừng trở lại',
        'dash.streak': 'Ngày học liên tiếp',
        'dash.words_today': 'Từ đã học hôm nay',
        'dash.cards': 'thẻ',
        'dash.no_decks': 'Chưa có bộ thẻ nào',
        'dash.create_first_deck': 'Hãy tạo bộ thẻ đầu tiên của bạn để bắt đầu học nhé!',
        'dash.create_btn': 'Tạo bộ thẻ mới',

        // Deck Detail
        'detail.study_now': 'Học ngay',
        'detail.edit': 'Chỉnh sửa',
        'detail.delete': 'Xóa',
        'detail.word_list': 'Danh sách từ vựng',
        'detail.status_unlearned': 'Chưa học',
        'detail.status_learning': 'Đang học',
        'detail.status_mastered': 'Đã thuộc',
        'detail.synonyms': 'Đồng nghĩa:',
        'detail.ai_analysis': 'AI Phân Tích IELTS',
        'detail.ai_reading': 'Ngữ cảnh Reading',
        'detail.ai_writing': 'Ý tưởng Writing Task 2',
        'detail.ai_grammar': 'Ngữ pháp & Collocation',

        // Create/Edit
        'edit.title_create': 'Tạo bộ thẻ mới',
        'edit.title_edit': 'Chỉnh sửa bộ thẻ',
        'edit.valid_cards': 'thẻ hợp lệ',
        'edit.cancel': 'Hủy',
        'edit.save': 'Lưu',
        'edit.saving': 'Đang lưu...',
        'edit.deck_info': 'Thông tin bộ thẻ',
        'edit.deck_title': 'Tiêu đề *',
        'edit.deck_desc': 'Mô tả',
        'edit.add_card': 'Thêm thẻ mới',
        'edit.import': 'Nhập từ Word, Excel...',
        'edit.ai_autofill': 'AI Tự điền',
        'edit.term': 'Thuật ngữ (Anh) *',
        'edit.definition': 'Định nghĩa (Việt) *',
        'edit.pronunciation': 'Phiên âm',
        'edit.pos': 'Loại từ',
        'edit.collocations': 'Cụm từ (Collocations)',
        'edit.word_family': 'Họ từ (Word Family)',
        'edit.example': 'Ví dụ',
        'edit.add_image': 'Thêm ảnh minh họa',
        'edit.change_image': 'Đổi ảnh khác',
        'edit.uploading': 'Đang tải...',

        // Study
        'study.progress': 'Tiến độ',
        'study.cards_left': 'thẻ còn lại',
        'study.tap_to_flip': 'Nhấn để lật thẻ',
        'study.def': 'Định nghĩa',
        'study.again': 'Chưa nhớ (1)',
        'study.good': 'Đã thuộc (2)',
        'study.finish_title': '🎉 Chúc mừng!',
        'study.finish_desc': 'Bạn đã hoàn thành phiên ôn tập.',
        'study.back': 'Trở về',
        'study.shortcut_hint': 'Mẹo: Dùng phím Space để lật thẻ, phím 1 và 2 để đánh giá.',

        // Reading
        'read.title': 'Luyện Đọc Hiểu IELTS',
        'read.subtitle': 'Cải thiện kỹ năng đọc với các bài tập được thiết kế chuẩn format',
        'read.level': 'Độ khó',
        'read.topic': 'Chủ đề',
        'read.time': 'Thời gian',
        'read.start': 'Bắt đầu đọc',

        // User Tool
        'tool.settings': 'Tùy chỉnh',
        'tool.language': 'Ngôn ngữ (Language)',
        'tool.theme': 'Giao diện (Theme)',
        'tool.voice': 'Giọng đọc AI',
        'tool.font_size': 'Cỡ chữ bài đọc',
        'tool.focus_mode': 'Chế độ tập trung',
        'tool.dark': 'Tối',
        'tool.light': 'Sáng',
        'tool.on': 'Bật',
        'tool.off': 'Tắt'
    },
    en: {
        // App / Navigation
        'nav.dashboard': 'Dashboard',
        'nav.create': 'Create Deck',
        'nav.reading': 'Reading',
        'nav.logout': 'Log Out',
        
        // Dashboard
        'dash.title': 'Your Decks',
        'dash.subtitle': 'Manage and review vocabulary daily',
        'dash.welcome': 'Welcome back',
        'dash.streak': 'Day Streak',
        'dash.words_today': 'Words Today',
        'dash.cards': 'cards',
        'dash.no_decks': 'No decks yet',
        'dash.create_first_deck': 'Create your first flashcard deck to start learning!',
        'dash.create_btn': 'Create New Deck',

        // Deck Detail
        'detail.study_now': 'Study Now',
        'detail.edit': 'Edit',
        'detail.delete': 'Delete',
        'detail.word_list': 'Word List',
        'detail.status_unlearned': 'Unlearned',
        'detail.status_learning': 'Learning',
        'detail.status_mastered': 'Mastered',
        'detail.synonyms': 'Synonyms:',
        'detail.ai_analysis': 'IELTS AI Analysis',
        'detail.ai_reading': 'Reading Context',
        'detail.ai_writing': 'Writing Task 2 Ideas',
        'detail.ai_grammar': 'Grammar & Collocations',

        // Create/Edit
        'edit.title_create': 'Create New Deck',
        'edit.title_edit': 'Edit Deck',
        'edit.valid_cards': 'valid cards',
        'edit.cancel': 'Cancel',
        'edit.save': 'Save',
        'edit.saving': 'Saving...',
        'edit.deck_info': 'Deck Information',
        'edit.deck_title': 'Title *',
        'edit.deck_desc': 'Description',
        'edit.add_card': 'Add New Card',
        'edit.import': 'Import from Word, Excel...',
        'edit.ai_autofill': 'AI Auto-fill',
        'edit.term': 'Term (English) *',
        'edit.definition': 'Definition (Native) *',
        'edit.pronunciation': 'Pronunciation',
        'edit.pos': 'Part of Speech',
        'edit.collocations': 'Collocations',
        'edit.word_family': 'Word Family',
        'edit.example': 'Example',
        'edit.add_image': 'Add Image',
        'edit.change_image': 'Change Image',
        'edit.uploading': 'Uploading...',

        // Study
        'study.progress': 'Progress',
        'study.cards_left': 'cards left',
        'study.tap_to_flip': 'Tap to flip',
        'study.def': 'Definition',
        'study.again': 'Again (1)',
        'study.good': 'Good (2)',
        'study.finish_title': '🎉 Congratulations!',
        'study.finish_desc': 'You have completed this study session.',
        'study.back': 'Go Back',
        'study.shortcut_hint': 'Hint: Use Space to flip, 1 and 2 to rate.',

        // Reading
        'read.title': 'IELTS Reading Practice',
        'read.subtitle': 'Improve reading skills with formatted exercises',
        'read.level': 'Level',
        'read.topic': 'Topic',
        'read.time': 'Time',
        'read.start': 'Start Reading',

        // User Tool
        'tool.settings': 'Settings',
        'tool.language': 'Language',
        'tool.theme': 'Theme',
        'tool.voice': 'AI Voice',
        'tool.font_size': 'Reading Font Size',
        'tool.focus_mode': 'Focus Mode',
        'tool.dark': 'Dark',
        'tool.light': 'Light',
        'tool.on': 'On',
        'tool.off': 'Off'
    }
};

export function t(key) {
    const lang = store?.settings?.language || 'vi';
    return translations[lang]?.[key] || key;
}
