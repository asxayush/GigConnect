import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    signInWithPopup,
    getIdToken,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const getFirebaseIdToken = (user) => getIdToken(user);

export const createPhoneVerifier = (container) => new RecaptchaVerifier(auth, container, { size: "invisible" });

export const sendPhoneOTP = (phoneNumber, verifier) => {
    const normalizedPhone = phoneNumber?.replace(/[\s()-]/g, "");
    if (!normalizedPhone || !/^\+[1-9]\d{7,14}$/.test(normalizedPhone)) {
        throw new Error("Enter a phone number with country code, for example +919876543210");
    }
    return signInWithPhoneNumber(auth, normalizedPhone, verifier);
};

export const verifyPhoneOTP = (confirmationResult, otp) => {
    if (!confirmationResult) throw new Error("Request an OTP first");
    if (!/^\d{6}$/.test(otp?.trim())) throw new Error("Enter the 6-digit OTP");
    return confirmationResult.confirm(otp.trim());
};
