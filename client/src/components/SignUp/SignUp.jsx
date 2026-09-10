import React, { useState, useEffect, useRef } from "react";
import { signInWithGoogle, getFirebaseIdToken } from "../../auth.js";
import { loginWithFirebase, sendPhoneOtp, verifyPhoneOtp } from "../../api.js";
import { showToast } from "../../toast.js";

export default function SignUp({ onNavigate, setUser }) {
  // Step: "role" | "phone" | "otp"
  const [step, setStep] = useState("role");
  // Role: "customer" | "worker"
  const [role, setRole] = useState("customer");
  
  const [phone, setPhone] = useState("");
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  
  const otpInputsRef = useRef([]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handlePhoneChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (raw.length <= 10) {
      setPhone(raw);
      setErrorMessage("");
    }
  };

  const commitAuthSuccess = (authUser, token) => {
    localStorage.setItem("gig_token", token);
    localStorage.setItem("gigconnect_token", token);
    localStorage.setItem("gigconnect_user", JSON.stringify(authUser));
    localStorage.setItem("gig_user", JSON.stringify(authUser));
    localStorage.setItem("gigconnect_role", authUser.role || role);

    if (setUser) setUser(authUser);
    window.dispatchEvent(new Event("gigconnect_auth_change"));

    showToast(`Welcome, ${authUser.name || "Member"}!`);
    if (onNavigate) {
      if (authUser.role === "worker") {
        onNavigate("worker-dashboard");
      } else {
        onNavigate("customer-dashboard");
      }
    }
  };

  // 1. Google Sign-In with Firebase Client SDK
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      await signInWithGoogle();
      const idToken = await getFirebaseIdToken();
      if (!idToken) throw new Error("Could not retrieve authentication token.");

      const response = await loginWithFirebase(idToken, { role });
      const authUser = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (!authUser || !token) throw new Error("Invalid response from server.");
      commitAuthSuccess(authUser, token);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Google sign-in failed.");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Request Twilio SMS OTP
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (phone.length !== 10) {
      setErrorMessage("Enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const formattedPhone = `+91${phone}`;
      await sendPhoneOtp(formattedPhone);
      setStep("otp");
      setCountdown(60);
      showToast("Verification code dispatched to your phone.");
      setTimeout(() => otpInputsRef.current[0]?.focus(), 150);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Failed to dispatch SMS code.");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Verify OTP
  const handleOtpBoxChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...otpValues];
    updated[index] = digit;
    setOtpValues(updated);

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    const code = otpValues.join("");
    if (code.length !== 6) {
      setErrorMessage("Enter all 6 digits of your verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    try {
      const formattedPhone = `+91${phone}`;
      const response = await verifyPhoneOtp(formattedPhone, code, { role });
      const authUser = response?.data?.user || response?.user;
      const token = response?.data?.token || response?.token;

      if (!authUser || !token) throw new Error("Verification failed.");
      commitAuthSuccess(authUser, token);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || err.message || "Invalid or expired OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-16 bg-slate-50/50">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 sm:p-10 transition-all">
        
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#0A2540] tracking-tight">
            {step === "role" && "Choose Your Path"}
            {step === "phone" && (role === "customer" ? "Sign in to Hire" : "Join as Professional")}
            {step === "otp" && "Enter Security Code"}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            {step === "role" && "Select how you would like to use GigConnect."}
            {step === "phone" && "Enter your phone number to continue."}
            {step === "otp" && `Sent to +91 ${phone}`}
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-medium border border-red-200/70 flex items-center gap-2">
            <span className="material-symbols-outlined text-base shrink-0">error</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: ROLE SELECTION */}
        {step === "role" && (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => {
                setRole("customer");
                setStep("phone");
              }}
              className="w-full p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0A2540] bg-white hover:bg-slate-50/60 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-[#0A2540] text-slate-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-2xl">person_search</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A2540]">Hire Professionals</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Book certified cooperative help</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#0A2540] group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("worker");
                setStep("phone");
              }}
              className="w-full p-5 rounded-2xl border-2 border-slate-200 hover:border-[#0A2540] bg-white hover:bg-slate-50/60 text-left transition-all flex items-center justify-between group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 group-hover:bg-[#0A2540] text-slate-700 group-hover:text-white flex items-center justify-center transition-colors">
                  <span className="material-symbols-outlined text-2xl">handyman</span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A2540]">Join as Professional</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Direct payouts & cooperative benefits</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#0A2540] group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </button>
          </div>
        )}

        {/* STEP 2: PHONE NUMBER & GOOGLE AUTH */}
        {step === "phone" && (
          <div>
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Mobile Number
                </label>
                <div className="flex items-center border border-slate-300 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/15 rounded-xl px-3.5 py-3 transition-all bg-white">
                  <span className="text-sm font-bold text-slate-600 mr-2 select-none">+91</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    placeholder="98765 43210"
                    autoFocus
                    className="w-full text-base font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || phone.length !== 10}
                className="w-full py-3.5 bg-[#0A2540] hover:bg-[#071b30] text-white font-semibold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 border-none"
              >
                {isLoading ? "Sending Code..." : "Continue"}
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
            </form>

            <div className="relative my-6 text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative px-3 bg-white text-xs text-slate-400 uppercase tracking-wider font-semibold">
                Or
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-3 px-4 border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-3 cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              type="button"
              onClick={() => setStep("role")}
              className="w-full mt-4 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer text-center"
            >
              Change Role ({role === "customer" ? "Hiring" : "Joining as Pro"})
            </button>
          </div>
        )}

        {/* STEP 3: 6-DIGIT OTP INPUT */}
        {step === "otp" && (
          <div>
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="flex justify-between gap-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-12 h-14 text-center text-xl font-bold text-slate-900 border border-slate-300 focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/15 rounded-xl outline-none transition-all bg-white"
                  />
                ))}
              </div>

              <button
                type="submit"
                disabled={isLoading || otpValues.join("").length !== 6}
                className="w-full py-3.5 bg-[#0A2540] hover:bg-[#071b30] text-white font-semibold text-sm rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer border-none"
              >
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setStep("phone")}
                className="text-slate-500 hover:text-slate-800 bg-transparent border-none cursor-pointer font-medium"
              >
                Edit Number
              </button>
              <button
                type="button"
                disabled={countdown > 0 || isLoading}
                onClick={handleSendOtp}
                className="text-[#0A2540] font-semibold hover:underline bg-transparent border-none cursor-pointer disabled:text-slate-400"
              >
                {countdown > 0 ? `Resend code in ${countdown}s` : "Resend Code"}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}