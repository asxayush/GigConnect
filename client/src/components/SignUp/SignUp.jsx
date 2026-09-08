import { useState } from "react";
import { firebaseConfigured, getFirebaseIdToken, signInWithGoogle } from "../../auth.js";
import { loginWithFirebase, sendPhoneOtp, verifyPhoneOtp } from "../../api";
import { showToast } from "../../toast";

function SignUp({ onNavigate }) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
    setBusy(true);
    try {
      await sendPhoneOtp(phone);
      setOtpSent(true);
      setMessage("OTP sent. Check your phone.");
    } catch (error) {
      showToast(error.message || "Unable to send OTP.");
      setMessage(error.message || "Unable to send OTP.");
    } finally { setBusy(false); }
  };

  const handleVerifyOtp = async () => {
    setBusy(true);
    try {
      const backend = await verifyPhoneOtp(phone, otp);
      localStorage.setItem("gigconnect_token", backend.data.token);
      localStorage.setItem("gigconnect_user", JSON.stringify(backend.data.user));
      setMessage(`Phone verified for ${phone}`);
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
          {firebaseConfigured ? "Google sign-in is configured" : "Google sign-in is unavailable"}
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
          <p>Twilio will send a one-time password by SMS.</p>
          <label className="public-field">Phone number<input type="tel" placeholder="+919876543210" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <button className="button button-secondary full-button" onClick={handleSendOtp} disabled={busy}>{busy ? "Sending..." : "Send OTP"}</button>
          {otpSent && <><label className="public-field">One-time password<input inputMode="numeric" maxLength="8" placeholder="Enter OTP" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} /></label><button className="button button-primary full-button" onClick={handleVerifyOtp} disabled={busy}>{busy ? "Verifying..." : "Verify phone"}</button></>}
        </div>
      </div>
      {message && <p className="registration-message" role="status">{message}</p>}
      <button className="text-button" onClick={() => onNavigate("auth")}>Use email and password instead</button>
    </section>
  );
}

export default SignUp;