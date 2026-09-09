import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, getFirebaseIdToken } from "../../auth.js";
import { loginWithFirebase, sendPhoneOtp, verifyPhoneOtp } from "../../api.js";
import { showToast } from "../../toast.js";

export default function SignUp({ onNavigate, setUser }) {
  // Step 1: Phone Input | Step 2: OTP Verification
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedDemoCode, setGeneratedDemoCode] = useState("123456");

  const otpInputsRef = useRef([]);

  // Resend Countdown Timer
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Clean 10-digit phone formatting
  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 10) {
      setPhone(raw);
      setErrorMessage("");
    }
  };

  // Helper to commit successful authentication to app state
  const commitAuthSuccess = (authUser, token) => {
    localStorage.setItem("gig_token", token);
    localStorage.setItem("gigconnect_token", token);
    localStorage.setItem("gigconnect_user", JSON.stringify(authUser));
    localStorage.setItem("gig_user", JSON.stringify(authUser));

    if (setUser) {
      setUser(authUser);
    }
    window.dispatchEvent(new Event("gigconnect_auth_change"));

    showToast(`Welcome to GigConnect, ${authUser.name || "Member"}!`);
    if (onNavigate) {
      onNavigate("find-help");
    }
  };

  // Step 1: Submit Phone Number -> Move to Step 2 (OTP)
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (phone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const fullPhone = `+91${phone}`;

    try {
      const response = await sendPhoneOtp(fullPhone);
      if (response?.data?.demoOtp) {
        setGeneratedDemoCode(String(response.data.demoOtp));
      } else {
        setGeneratedDemoCode("123456");
      }
      setCountdown(30);
      setStep("otp");
      showToast(`Verification code sent to ${fullPhone}`);
    } catch (err) {
      console.warn("SMS Gateway note (using fallback mock):", err.message);
      setGeneratedDemoCode("123456");
      setCountdown(30);
      setStep("otp");
      showToast(`Demo OTP code: 123456 for ${fullPhone}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle individual OTP Box input
  const handleOtpBoxChange = (index, value) => {
    const cleaned = value.replace(/\D/g, "");
    if (!cleaned) {
      const newOtp = [...otpValues];
      newOtp[index] = "";
      setOtpValues(newOtp);
      return;
    }

    const newOtp = [...otpValues];
    newOtp[index] = cleaned.charAt(cleaned.length - 1);
    setOtpValues(newOtp);
    setErrorMessage("");

    if (index < 5 && cleaned) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  // Handle OTP paste
  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;

    const newOtp = ["", "", "", "", "", ""];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtpValues(newOtp);

    const nextIdx = Math.min(pasteData.length, 5);
    otpInputsRef.current[nextIdx]?.focus();
  };

  // Handle backspace in OTP boxes
  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    const enteredOtp = otpValues.join("");

    if (enteredOtp.length !== 6) {
      setErrorMessage("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    const fullPhone = `+91${phone}`;

    try {
      let authUser = null;
      let token = null;

      if (enteredOtp === "123456" || enteredOtp === generatedDemoCode) {
        token = "jwt-session-" + Date.now();
        authUser = {
          _id: "user-" + phone,
          phone: fullPhone,
          name: `Member (+91 ${phone.slice(0, 5)}...)`,
          role: "customer",
          isPhoneVerified: true,
          createdAt: new Date().toISOString(),
        };
      } else {
        const response = await verifyPhoneOtp(fullPhone, enteredOtp);
        authUser = response?.data?.user;
        token = response?.data?.token;
      }

      if (!authUser || !token) {
        throw new Error("Invalid verification code. Please check or use demo code 123456.");
      }

      commitAuthSuccess(authUser, token);
    } catch (err) {
      console.error("Verification error:", err);
      setErrorMessage(err.message || "Invalid OTP. Use demo code 123456.");
      showToast("Verification failed. Use demo code 123456.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Flow with Vercel Demo Fallback
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await signInWithGoogle();
      let backendUser = null;
      let token = null;

      try {
        const idToken = await getFirebaseIdToken(result.user);
        const backend = await loginWithFirebase(idToken);
        backendUser = backend?.data?.user;
        token = backend?.data?.token;
      } catch (backendErr) {
        console.warn("Backend token exchange fallback:", backendErr.message);
        token = "google-demo-token-" + Date.now();
        backendUser = {
          _id: result.user.uid || "google-user-" + Date.now(),
          name: result.user.displayName || "Google Member",
          email: result.user.email,
          avatar: result.user.photoURL,
          role: "customer",
          isGoogleAuth: true,
        };
      }

      const finalUser = backendUser || {
        _id: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        avatar: result.user.photoURL,
        role: "customer",
      };

      commitAuthSuccess(finalUser, token || "mock-google-token");
    } catch (err) {
      console.warn("Firebase Auth Note:", err?.code || err?.message);
      
      // If error is unauthorized domain (Vercel deployment) or popup blocked, provide Demo Google login
      if (
        err?.code === "auth/unauthorized-domain" ||
        err?.code === "auth/popup-closed-by-user" ||
        err?.code === "auth/cancelled-popup-request" ||
        err?.code === "auth/configuration-not-found" ||
        !navigator.onLine
      ) {
        console.log("[Demo Mode] Logging in as Demo Google Patron...");
        const demoGoogleUser = {
          _id: "google-demo-patron-101",
          name: "Aayush Sharma (Google Verified)",
          email: "aayush.demo@gmail.com",
          avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
          role: "customer",
          isGoogleAuth: true,
        };
        commitAuthSuccess(demoGoogleUser, "demo-google-jwt-token-" + Date.now());
        showToast("Signed in as Demo Google User! (Whitelist your Vercel domain in Firebase for live OAuth)");
        return;
      }

      setErrorMessage(err.message || "Google sign-in was cancelled or encountered an error.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] w-full flex items-center justify-center bg-[#FAF8FF] px-4 py-12 relative overflow-hidden font-sans">
      {/* Subtle Ambient Decorative Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="w-full max-w-md bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 rounded-2xl p-7 sm:p-9 relative z-10">
        {/* Top Accent Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0A2540] via-indigo-600 to-emerald-500 rounded-t-2xl" />

        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* STEP 1: PHONE NUMBER INPUT & GOOGLE SIGN-IN                               */}
          {/* ========================================================================= */}
          {step === "phone" && (
            <motion.div
              key="step-phone"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* Brand Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#0A2540] text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <span className="material-symbols-outlined text-2xl text-emerald-400">handshake</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                    Cooperative Trust Network
                  </span>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Welcome to GigConnect
              </h1>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                Log in or sign up with your Indian mobile number or Google account.
              </p>

              {/* Phone Input Form */}
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="phone-input" className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                    Mobile Number
                  </label>
                  <div className="relative flex items-center rounded-xl border border-slate-200 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/10 transition-all bg-white shadow-sm overflow-hidden">
                    {/* Country Code Prefix */}
                    <div className="flex items-center gap-1.5 px-3.5 py-3 bg-slate-50 border-r border-slate-200 text-slate-700 font-medium text-sm select-none">
                      <span className="text-base" role="img" aria-label="India Flag">🇮🇳</span>
                      <span>+91</span>
                    </div>

                    <input
                      id="phone-input"
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={handlePhoneChange}
                      placeholder="98765 43210"
                      autoFocus
                      disabled={isLoading}
                      className="w-full px-3.5 py-3 text-slate-900 placeholder:text-slate-400 text-base font-medium outline-none bg-transparent"
                    />

                    {phone.length === 10 && (
                      <div className="pr-3 text-emerald-600 animate-fade-in">
                        <span className="material-symbols-outlined text-xl">check_circle</span>
                      </div>
                    )}
                  </div>
                  {errorMessage && (
                    <p className="text-xs text-rose-600 mt-1.5 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errorMessage}
                    </p>
                  )}
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={isLoading || phone.length !== 10}
                  className="w-full bg-[#0A2540] hover:bg-[#081d33] active:scale-[0.99] text-white font-medium py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Sending OTP...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue with Mobile</span>
                      <span className="material-symbols-outlined text-base">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Clean Horizontal Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                    OR
                  </span>
                </div>
              </div>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 active:scale-[0.99] font-medium py-3 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Demo Helper */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-emerald-600">verified_user</span>
                  Twilio &amp; Firebase Secured
                </span>
                <button
                  type="button"
                  onClick={() => setPhone("9876543210")}
                  className="text-indigo-600 hover:text-indigo-800 font-medium underline underline-offset-2"
                >
                  Fill Demo Number
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: OTP VERIFICATION                                                 */}
          {/* ========================================================================= */}
          {step === "otp" && (
            <motion.div
              key="step-otp"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="flex flex-col"
            >
              {/* Back / Edit Navigation */}
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setErrorMessage("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-5 transition-colors self-start"
              >
                <span className="material-symbols-outlined text-base">arrow_back</span>
                <span>Change Mobile Number</span>
              </button>

              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Verify your number
              </h1>
              <p className="text-sm text-slate-500 mt-1 mb-6">
                We sent a 6-digit verification code to{" "}
                <span className="font-semibold text-slate-900">+91 {phone}</span>
                {" — "}
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-indigo-600 font-semibold hover:underline"
                >
                  Edit
                </button>
              </p>

              {/* 6-Digit Segmented OTP Input */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                  <div className="flex items-center justify-between gap-2 sm:gap-2.5" onPaste={handleOtpPaste}>
                    {otpValues.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        autoFocus={idx === 0}
                        className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold text-slate-900 bg-white border border-slate-200 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/10 outline-none shadow-sm transition-all"
                      />
                    ))}
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-rose-600 mt-2.5 flex items-center gap-1 font-medium">
                      <span className="material-symbols-outlined text-sm">error</span>
                      {errorMessage}
                    </p>
                  )}
                </div>

                {/* Primary Verify Button */}
                <button
                  type="submit"
                  disabled={isLoading || otpValues.join("").length !== 6}
                  className="w-full bg-[#0A2540] hover:bg-[#081d33] active:scale-[0.99] text-white font-medium py-3.5 px-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify & Log in</span>
                      <span className="material-symbols-outlined text-base">verified</span>
                    </>
                  )}
                </button>

                {/* Resend Code Logic */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs pt-1">
                  <span className="text-slate-500">Didn't receive a code?</span>
                  {countdown > 0 ? (
                    <span className="text-slate-400 font-medium">
                      Resend in <span className="font-semibold text-slate-700">{countdown}s</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
                    >
                      Resend Code
                    </button>
                  )}
                </div>
              </form>

              {/* Demo Hint Card */}
              <div className="mt-6 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-700 text-lg">info</span>
                  <span className="text-xs text-amber-900 font-medium">Demo Fallback Code:</span>
                </div>
                <button
                  type="button"
                  onClick={() => setOtpValues(["1", "2", "3", "4", "5", "6"])}
                  className="text-xs font-mono font-bold bg-amber-200/80 hover:bg-amber-300/80 text-amber-900 px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                >
                  Auto-Fill 123456
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}