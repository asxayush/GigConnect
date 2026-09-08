import { useState } from "react";
import { useTranslation } from "react-i18next";
import { firebaseConfigured, getFirebaseIdToken, signInWithGoogle } from "../../auth.js";
import { loginWithFirebase, sendPhoneOtp, verifyPhoneOtp } from "../../api";
import { showToast } from "../../toast";

function SignUp({ onNavigate }) {
  const { t } = useTranslation();
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
      setMessage(t("signup.otpSent"));
    } catch (error) {
      showToast(error.message || t("common.error"));
      setMessage(error.message || t("common.error"));
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
      showToast(error.message || t("common.error"));
      setMessage(error.message || t("common.error"));
    } finally { setBusy(false); }
  };

  return (
    <section className="content-section page-section public-registration">
      <div className="registration-intro">
        <p className="section-kicker">{t("signup.kicker")}</p>
        <h2>{t("signup.heading")}</h2>
        <p className="lead-copy">{t("signup.body")}</p>
        <div className={`firebase-status ${firebaseConfigured ? "is-ready" : "is-missing"}`}>
          <span aria-hidden="true">{firebaseConfigured ? "✓" : "!"}</span>
          {firebaseConfigured ? t("signup.googleReady") : t("signup.googleMissing")}
        </div>
      </div>
      <div className="registration-options">
        <div className="registration-panel">
          <h3>{t("signup.useGoogle")}</h3>
          <p>{t("signup.googleBody")}</p>
          <button className="button button-primary full-button" onClick={handleGoogle}>{t("signup.continueGoogle")}</button>
        </div>
        <div className="registration-panel">
          <h3>{t("signup.usePhone")}</h3>
          <p>{t("signup.phoneBody")}</p>
          <label className="public-field">{t("signup.phoneLabel")}<input type="tel" placeholder="+919876543210" value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
          <button className="button button-secondary full-button" onClick={handleSendOtp} disabled={busy}>{busy ? t("signup.sending") : t("signup.sendOtp")}</button>
          {otpSent && (
            <>
              <label className="public-field">{t("signup.otpLabel")}<input inputMode="numeric" maxLength="8" placeholder={t("signup.otpPlaceholder")} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))} /></label>
              <button className="button button-primary full-button" onClick={handleVerifyOtp} disabled={busy}>{busy ? t("signup.verifying") : t("signup.verifyPhone")}</button>
            </>
          )}
        </div>
      </div>
      {message && <p className="registration-message" role="status">{message}</p>}
      <button className="text-button" onClick={() => onNavigate("auth")}>{t("signup.useEmail")}</button>
    </section>
  );
}

export default SignUp;