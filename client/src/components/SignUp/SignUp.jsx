import { useEffect, useRef, useState } from "react";
import { createPhoneVerifier, firebaseConfigured, getFirebaseIdToken, sendPhoneOTP, signInWithGoogle, verifyPhoneOTP } from "../../auth.js";
import { loginWithFirebase } from "../../api";
import { showToast } from "../../toast";

function SignUp({ onNavigate }) {
  const recaptchaRef = useRef(null);
  const verifierRef = useRef(null);
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => () => verifierRef.current?.clear(), []);

  const handleGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      const backend = await loginWithFirebase(await getFirebaseIdToken(result.user));
      localStorage.setItem("gigconnect_token", backend.data.token);
      localStorage.setItem("gigconnect_user", JSON.stringify(backend.data.user));
      setMessage(`Welcome, ${result.user.displayName || "GigConnect member"}`);
    } catch (error) {
      showToast(error.message);
      setMessage(error.message);
    }
  };

  const handleSendOtp = async () => {
    if (!firebaseConfigured) { showToast("Firebase configuration is incomplete."); setMessage("Firebase configuration is incomplete."); return; }
    setBusy(true);
    try {
      verifierRef.current ||= createPhoneVerifier(recaptchaRef.current);
      setConfirmationResult(await sendPhoneOTP(phone, verifierRef.current));
      setMessage("OTP sent. Check your phone.");
    } catch (error) {
      showToast(error.message || "Unable to send OTP.");
      verifierRef.current?.clear();
      verifierRef.current = null;
      setMessage(error.message || "Unable to send OTP.");
    } finally { setBusy(false); }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    try {
      const result = await verifyPhoneOTP(confirmationResult, otp);
      const backend = await loginWithFirebase(await getFirebaseIdToken(result.user));
      localStorage.setItem("gigconnect_token", backend.data.token);
      localStorage.setItem("gigconnect_user", JSON.stringify(backend.data.user));
      setMessage(`Phone verified for ${result.user.phoneNumber}`);
    } catch (error) {
      showToast(error.message || "Unable to verify OTP.");
      setMessage(error.message || "Unable to verify OTP.");
    } finally { setBusy(false); }
  };

  return (
    <section className="content-section page-section public-registration">
      <div className="registration-intro">
        <p className="section-kicker">Public registration</p>
        <h2>Join GigConnect</h2>
        <p className="lead-copy">Create a trusted account to book cooperative workers or register your own skills with the network.</p>
        <div className={`firebase-status ${firebaseConfigured ? "is-ready" : "is-missing"}`}>
          <span aria-hidden="true">{firebaseConfigured ? "✓" : "!"}</span>
          {firebaseConfigured ? "Firebase sign-in is configured" : "Firebase configuration is incomplete"}
        </div>
      </div>
      <div className="registration-options">
        <div className="registration-panel">
          <h3>Use Google</h3>
          <p>Register or sign in with your Google account.</p>
          <button className="button button-primary full-button" onClick={handleGoogle}>Continue with Google</button>
        </div>
        <div className="registration-panel">
          <h3>Use phone number</h3>
          <p>Firebase uses an invisible security check before sending your one-time password.</p>
          <label className="public-field">Phone number<input type="tel" placeholder="+919876543210" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <button className="button button-secondary full-button" onClick={handleSendOtp} disabled={busy || !firebaseConfigured}>{busy ? "Sending..." : "Send OTP"}</button>
          {confirmationResult && <><label className="public-field">One-time password<input inputMode="numeric" maxLength="6" placeholder="Enter 6-digit OTP" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} /></label><button className="button button-primary full-button" onClick={handleVerifyOtp} disabled={busy}>{busy ? "Verifying..." : "Verify phone"}</button></>}
          <div ref={recaptchaRef} className="recaptcha-container" aria-hidden="true" />
        </div>
      </div>
      {message && <p className="registration-message" role="status">{message}</p>}
      <button className="text-button" onClick={() => onNavigate("auth")}>Use email and password instead</button>
    </section>
  );
}

export default SignUp;