import admin from "firebase-admin";

let firebaseAdmin;
const getFirebaseAdmin = () => {
  if (firebaseAdmin) return firebaseAdmin;
  if (!process.env.FIREBASE_SERVICE_ACCOUNT_JSON) throw new Error("Firebase Admin is not configured on the server");
  firebaseAdmin = admin.apps.length ? admin.app() : admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
  return firebaseAdmin;
};

export const verifyFirebaseToken = async (token) => {
  getFirebaseAdmin();
  return admin.auth().verifyIdToken(token);
};