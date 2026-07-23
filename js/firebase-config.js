import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from "firebase/app-check";

/* Cấu hình Firebase - Điền thông tin của bạn vào đây */
export const firebaseConfig = {
    apiKey: "AIzaSyAYtMfxabXpnPhZ8w46iwd0pudrx_VyHdc",
    authDomain: "flashcard-for-my-self.firebaseapp.com",
    projectId: "flashcard-for-my-self",
    storageBucket: "flashcard-for-my-self.firebasestorage.app",
    messagingSenderId: "980660980786",
    appId: "1:980660980786:web:df7142e96f02da3ab2402b"
};

let app, auth, db, storage, appCheck;

// Chỉ khởi tạo nếu đã thay thế thông tin cấu hình
if (firebaseConfig.apiKey !== "ĐIỀN_API_KEY_CỦA_BẠN_VÀO_ĐÂY") {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Khởi tạo App Check (Thay RECAPTCHA_SITE_KEY bằng key thật của bạn từ Google Cloud Console)
    // Tạm thời comment lại để không chặn trong lúc phát triển ở localhost
    /*
    if (typeof window !== "undefined") {
        appCheck = initializeAppCheck(app, {
            provider: new ReCaptchaEnterpriseProvider('RECAPTCHA_SITE_KEY'),
            isTokenAutoRefreshEnabled: true
        });
    }
    */
}

export { app, auth, db, storage, appCheck };
