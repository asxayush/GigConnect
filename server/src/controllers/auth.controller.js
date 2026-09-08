/**
 * auth.controller.js
 *
 * NOTE: GigConnect's authentication is handled directly in the route files:
 *   - Phone OTP (send/verify): server/src/routes/auth.routes.js
 *   - Firebase Google token exchange: server/src/routes/auth.routes.js
 *   - JWT signing helper: signToken() in auth.routes.js
 *   - Firebase Admin SDK wrapper: server/src/firebase.js
 *   - Twilio OTP utility: server/src/utils/twilio.js
 *
 * The original version of this file incorrectly contained browser-side Firebase SDK
 * calls (signInWithPopup, RecaptchaVerifier, window.confirmationResult) which are
 * client-only APIs that throw ReferenceError in Node.js. Those belong in the
 * frontend client (client/src/auth.js).
 *
 * This file is kept as a reference stub. Add server-side auth helpers here
 * if the route files grow too large to remain readable.
 */

export {};
