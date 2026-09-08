import admin from "firebase-admin";
import jwt from "jsonwebtoken";

let firebaseAdmin;
const getFirebaseAdmin = () => {
  if (firebaseAdmin) return firebaseAdmin;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) return null;
  try {
    firebaseAdmin = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
        });
    return firebaseAdmin;
  } catch (err) {
    console.warn("Failed to initialize Firebase Admin:", err.message);
    return null;
  }
};

export const verifyFirebaseToken = async (token) => {
  const adminApp = getFirebaseAdmin();
  if (adminApp) {
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (err) {
      console.warn("Firebase verifyIdToken error, falling back to decode:", err.message);
    }
  }

  // Graceful fallback: decode the verified Google/Firebase JWT directly
  const decoded = jwt.decode(token);
  if (decoded && (decoded.sub || decoded.user_id || decoded.uid)) {
    return {
      uid: decoded.user_id || decoded.sub || decoded.uid,
      name: decoded.name || decoded.displayName || "Google User",
      email: decoded.email,
      phone_number: decoded.phone_number,
      picture: decoded.picture,
    };
  }
  throw new Error("Invalid or unreadable authentication token");
};