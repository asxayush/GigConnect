import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    getIdToken,
} from "firebase/auth";

const env = import.meta.env;

// Vite only exposes VITE_-prefixed vars to the browser bundle.
// We check the VITE_ variant first, then fall back to the bare name (for
// non-Vite environments such as Jest or SSR where the full process.env is
// available).
const firebaseConfig = {
    apiKey:            env.VITE_FIREBASE_API_KEY            || env.FIREBASE_API_KEY,
    authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN        || env.FIREBASE_AUTH_DOMAIN,
    projectId:         env.VITE_FIREBASE_PROJECT_ID         || env.FIREBASE_PROJECT_ID,
    storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET     || env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || env.FIREBASE_MESSAGING_SENDER_ID,
    appId:             env.VITE_FIREBASE_APP_ID             || env.FIREBASE_APP_ID,
};

export const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);

// Only initialise Firebase when all required config values are present.
// Without this guard, Firebase throws a noisy console error when the app
// runs without credentials (e.g. in CI or before .env is populated).
let auth;
let googleProvider;

if (firebaseConfigured) {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
} else {
    console.warn(
        "[GigConnect] Firebase credentials not found in environment. " +
        "Ensure VITE_FIREBASE_* variables are set in client/.env. " +
        "Google Sign-In will fall back to demo mode."
    );
    auth = null;
    googleProvider = null;
}

export { auth };

export const signInWithGoogle = () => {
    if (!auth || !googleProvider) {
        return Promise.reject(new Error("Firebase is not configured. Set VITE_FIREBASE_* env vars."));
    }
    return signInWithPopup(auth, googleProvider);
};

export const getFirebaseIdToken = (user) => getIdToken(user);

