import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signInWithGoogle, getFirebaseIdToken } from "../../auth.js";
import { loginWithFirebase, sendPhoneOtp, verifyPhoneOtp, login } from "../../api.js";
import { showToast } from "../../toast.js";
import { DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR } from "../../assets/avatars.js";

// Demo Workers and Customer for One-Click Presentation Login
const DEMO_PRESET_ACCOUNTS = [
  {
    name: "Ramesh Kumar",
    phone: "9811000001",
    role: "worker",
    trade: "Electrician",
    sakhi: false,
    rate: "₹250/hr",
    avatar: DEFAULT_MALE_AVATAR,
  },
  {
    name: "Sunita Devi",
    phone: "9811000002",
    role: "worker",
    trade: "Beautician",
    sakhi: true,
    rate: "₹400/hr",
    avatar: DEFAULT_FEMALE_AVATAR,
  },
  {
    name: "Priya Sharma",
    phone: "9811000003",
    role: "worker",
    trade: "Plumber",
    sakhi: true,
    rate: "₹300/hr",
    avatar: DEFAULT_FEMALE_AVATAR,
  },
  {
    name: "Kavita Rao",
    phone: "9811000004",
    role: "worker",
    trade: "Domestic Help",
    sakhi: true,
    rate: "₹200/hr",
    avatar: DEFAULT_FEMALE_AVATAR,
  },
  {
    name: "Meenakshi",
    phone: "9811000005",
    role: "worker",
    trade: "Carpenter",
    sakhi: true,
    rate: "₹350/hr",
    avatar: DEFAULT_FEMALE_AVATAR,
  },
  {
    name: "Vikram Singh",
    phone: "9811000006",
    role: "worker",
    trade: "Painter",
    sakhi: false,
    rate: "₹200/hr",
    avatar: DEFAULT_MALE_AVATAR,
  },
  {
    name: "Ayush Sharma",
    phone: "9876543210",
    role: "customer",
    trade: "Patron / Customer",
    sakhi: false,
    rate: "Customer",
    avatar: DEFAULT_MALE_AVATAR,
  },
];

export default function SignUp({ onNavigate, setUser }) {
  // Mode: "customer" | "worker"
  const [authRole, setAuthRole] = useState("customer");
  // Auth Method: "otp" | "password"
  const [authMethod, setAuthMethod] = useState("otp");

  // Step 1: Phone Input | Step 2: OTP Verification
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("Demo@123");
  const [showPassword, setShowPassword] = useState(false);
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [generatedDemoCode, setGeneratedDemoCode] = useState("123456");
  const [isRealSmsDelivered, setIsRealSmsDelivered] = useState(false);
  const [showQuickLogin, setShowQuickLogin] = useState(true);

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

    showToast(`Welcome ${authUser.name || "Member"}! Logged in as ${authUser.role?.toUpperCase() || "USER"}`);
    
    if (onNavigate) {
      if (authUser.role === "worker") {
        onNavigate("messages");
      } else {
        onNavigate("find-help");
      }
    }
  };

  // One-Click Fast Login for Live Demos
  const handleQuickDemoLogin = async (account) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      // Try backend /api/auth/login with Demo@123
      try {
        const response = await login({
          phone: account.phone,
          password: "Demo@123",
        });
        if (response?.data?.user && response?.data?.token) {
          commitAuthSuccess(response.data.user, response.data.token);
          return;
        }
      } catch (backendErr) {
        console.warn("Backend auth fallback to local token:", backendErr.message);
      }

      // Offline / Local Demo Token Fallback
      const demoUser = {
        _id: `demo-${account.role}-${account.phone}`,
        name: account.name,
        phone: account.phone,
        role: account.role,
        trade: account.trade,
        sakhiVerified: account.sakhi,
        avatar: account.avatar,
      };
      commitAuthSuccess(demoUser, `demo-token-${account.phone}-${Date.now()}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Submit Password Login
  const handlePasswordLogin = async (e) => {
    e?.preventDefault();
    if (!phone || phone.length !== 10) {
      setErrorMessage("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await login({
        phone: phone,
        password: password,
      });

      if (response?.data?.user && response?.data?.token) {
        commitAuthSuccess(response.data.user, response.data.token);
      } else {
        throw new Error(response?.message || "Invalid credentials.");
      }
    } catch (err) {
      console.warn("Password login error:", err.message);
      // Fallback for presentations if backend is rebooting
      const matchingPreset = DEMO_PRESET_ACCOUNTS.find((a) => a.phone === phone);
      if (matchingPreset && password === "Demo@123") {
        handleQuickDemoLogin(matchingPreset);
      } else {
        setErrorMessage(err.message || "Invalid mobile number or password (Default Demo: Demo@123)");
        showToast(err.message || "Invalid credentials. Use demo password 'Demo@123'");
      }
    } finally {
      setIsLoading(false);
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
      const code = response?.data?.demoOtp || "123456";
      const delivered = Boolean(response?.data?.isDeliveredViaTwilio);
      setGeneratedDemoCode(String(code));
      setIsRealSmsDelivered(delivered);
      setCountdown(30);
      setStep("otp");
      showToast(
        delivered
          ? `SMS verification code sent to ${fullPhone}`
          : `Twilio Trial Mode: Verification code generated`
      );
    } catch (err) {
      console.warn("SMS Gateway note (using fallback mock):", err.message);
      setGeneratedDemoCode("123456");
      setIsRealSmsDelivered(false);
      setCountdown(30);
      setStep("otp");
      showToast(`Sandbox code: 123456`);
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

      try {
        const response = await verifyPhoneOtp(fullPhone, enteredOtp);
        authUser = response?.data?.user;
        token = response?.data?.token;
      } catch (apiErr) {
        console.warn("Backend phone verify note:", apiErr.message);
      }

      // Check if phone matches any seeded worker or customer
      if (!authUser) {
        const matchingPreset = DEMO_PRESET_ACCOUNTS.find((a) => a.phone === phone);
        if (matchingPreset) {
          authUser = {
            _id: `user-${matchingPreset.phone}`,
            name: matchingPreset.name,
            phone: matchingPreset.phone,
            role: matchingPreset.role,
            trade: matchingPreset.trade,
            sakhiVerified: matchingPreset.sakhi,
            avatar: matchingPreset.avatar,
          };
          token = "jwt-session-" + Date.now();
        } else if (enteredOtp === "123456" || enteredOtp === generatedDemoCode) {
          token = "jwt-session-" + Date.now();
          authUser = {
            _id: "user-" + phone,
            phone: fullPhone,
            name: authRole === "worker" ? `Karigar (+91 ${phone.slice(0, 5)}...)` : `Customer (+91 ${phone.slice(0, 5)}...)`,
            role: authRole,
            isPhoneVerified: true,
            createdAt: new Date().toISOString(),
          };
        }
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
          avatar: result.user.photoURL || DEFAULT_MALE_AVATAR,
          role: authRole,
          isGoogleAuth: true,
        };
      }

      const finalUser = backendUser || {
        _id: result.user.uid,
        name: result.user.displayName,
        email: result.user.email,
        avatar: result.user.photoURL || DEFAULT_MALE_AVATAR,
        role: authRole,
      };

      commitAuthSuccess(finalUser, token || "mock-google-token");
    } catch (err) {
      console.warn("Firebase Auth Note:", err?.code || err?.message);
      
      const demoGoogleUser = {
        _id: "google-demo-patron-101",
        name: "Ayush Sharma (Google Verified)",
        email: "ayush.demo@gmail.com",
        avatar: DEFAULT_MALE_AVATAR,
        role: authRole,
        isGoogleAuth: true,
      };
      commitAuthSuccess(demoGoogleUser, "demo-google-jwt-token-" + Date.now());
      showToast("Signed in as Demo Google Account!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[88vh] w-full flex flex-col items-center justify-center bg-[#FAF8FF] px-4 py-8 relative overflow-hidden font-sans">
      {/* Subtle Ambient Decorative Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-xl flex flex-col gap-5 z-10">

        {/* Persona Switcher Tabs */}
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setAuthRole("customer");
              setErrorMessage("");
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${
              authRole === "customer"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">person</span>
            <span>Customer Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAuthRole("worker");
              setErrorMessage("");
            }}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center justify-center gap-2 ${
              authRole === "worker"
                ? "bg-emerald-700 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 bg-transparent"
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">engineering</span>
            <span>Worker / Karigar Login</span>
            <span className="px-1.5 py-0.2 bg-white/20 text-white text-[10px] rounded">
              95% Payout
            </span>
          </button>
        </div>

        {/* Main Auth Card */}
        <div className="w-full bg-white border border-slate-200/90 shadow-xl shadow-slate-200/60 rounded-2xl p-6 sm:p-8 relative">
          {/* Top Accent Stripe */}
          <div
            className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-2xl transition-all ${
              authRole === "worker"
                ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-500"
                : "bg-gradient-to-r from-[#0A2540] via-indigo-600 to-emerald-500"
            }`}
          />

          <AnimatePresence mode="wait">
            {/* ========================================================================= */}
            {/* STEP 1: PHONE / PASSWORD / GOOGLE LOGIN                                   */}
            {/* ========================================================================= */}
            {step === "phone" && (
              <motion.div
                key="step-phone"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex flex-col"
              >
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold shadow-sm ${
                        authRole === "worker" ? "bg-emerald-700" : "bg-[#0A2540]"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">
                        {authRole === "worker" ? "construction" : "handshake"}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                          authRole === "worker"
                            ? "text-emerald-800 bg-emerald-50 border-emerald-200"
                            : "text-indigo-800 bg-indigo-50 border-indigo-200"
                        }`}
                      >
                        {authRole === "worker" ? "Co-op Tradesperson Portal" : "Customer Portal"}
                      </span>
                    </div>
                  </div>

                  {/* Auth Method Switcher (OTP vs Password) */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setAuthMethod("otp")}
                      className={`px-2.5 py-1 rounded-md border-none cursor-pointer transition-all ${
                        authMethod === "otp"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "text-slate-500 bg-transparent hover:text-slate-800"
                      }`}
                    >
                      Mobile OTP
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthMethod("password")}
                      className={`px-2.5 py-1 rounded-md border-none cursor-pointer transition-all ${
                        authMethod === "password"
                          ? "bg-white text-slate-900 shadow-2xs font-extrabold"
                          : "text-slate-500 bg-transparent hover:text-slate-800"
                      }`}
                    >
                      Password
                    </button>
                  </div>
                </div>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {authRole === "worker" ? "Worker Portal Sign In" : "Welcome to GigConnect"}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
                  {authRole === "worker"
                    ? "Log in to view incoming customer requests, accept jobs, and receive 95% payouts."
                    : "Log in with your mobile number to book trusted cooperative artisans."}
                </p>

                {/* Main Form (OTP or Password) */}
                {authMethod === "otp" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="phone-input" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        10-Digit Mobile Number
                      </label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/10 transition-all bg-white shadow-2xs overflow-hidden">
                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-slate-700 font-semibold text-sm select-none">
                          <span className="text-base" role="img" aria-label="India Flag">🇮🇳</span>
                          <span>+91</span>
                        </div>

                        <input
                          id="phone-input"
                          type="tel"
                          inputMode="numeric"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={authRole === "worker" ? "9811000001 (Ramesh Kumar)" : "9876543210"}
                          autoFocus
                          disabled={isLoading}
                          className="w-full px-3 py-2.5 text-slate-900 placeholder:text-slate-400 text-sm font-semibold outline-none bg-transparent"
                        />

                        {phone.length === 10 && (
                          <div className="pr-3 text-emerald-600">
                            <span className="material-symbols-outlined text-lg">check_circle</span>
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

                    <button
                      type="submit"
                      disabled={isLoading || phone.length !== 10}
                      className={`w-full text-white font-extrabold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border-none cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        authRole === "worker"
                          ? "bg-emerald-700 hover:bg-emerald-800"
                          : "bg-[#0A2540] hover:bg-[#081d33]"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Sending Code...</span>
                        </>
                      ) : (
                        <>
                          <span>Send Mobile OTP</span>
                          <span className="material-symbols-outlined text-base">arrow_forward</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* Password Sign In Form */
                  <form onSubmit={handlePasswordLogin} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Mobile Number
                      </label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/10 transition-all bg-white shadow-2xs overflow-hidden">
                        <div className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-50 border-r border-slate-200 text-slate-700 font-semibold text-sm select-none">
                          <span className="text-base" role="img" aria-label="India Flag">🇮🇳</span>
                          <span>+91</span>
                        </div>
                        <input
                          type="tel"
                          value={phone}
                          onChange={handlePhoneChange}
                          placeholder={authRole === "worker" ? "9811000001" : "9876543210"}
                          className="w-full px-3 py-2.5 text-slate-900 text-sm font-semibold outline-none bg-transparent"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Password (Demo: <code className="text-indigo-600 lowercase font-mono">Demo@123</code>)
                      </label>
                      <div className="relative flex items-center rounded-xl border border-slate-200 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/10 transition-all bg-white shadow-2xs overflow-hidden">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Demo@123"
                          className="w-full px-3.5 py-2.5 text-slate-900 text-sm font-semibold outline-none bg-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="pr-3 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">
                            {showPassword ? "visibility_off" : "visibility"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {errorMessage && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium">
                        <span className="material-symbols-outlined text-sm">error</span>
                        {errorMessage}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isLoading || phone.length !== 10}
                      className={`w-full text-white font-extrabold py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border-none cursor-pointer text-sm disabled:opacity-50 ${
                        authRole === "worker"
                          ? "bg-emerald-700 hover:bg-emerald-800"
                          : "bg-[#0A2540] hover:bg-[#081d33]"
                      }`}
                    >
                      {isLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Signing in...</span>
                        </>
                      ) : (
                        <>
                          <span>Sign In with Password</span>
                          <span className="material-symbols-outlined text-base">login</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* Google Sign-in */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">
                      OR
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold py-2.5 px-4 rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2.5 text-xs sm:text-sm cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Continue with Google</span>
                </button>

                {/* Worker Registration Link */}
                <div className="mt-4 pt-3 border-t border-slate-100 text-center">
                  <span className="text-xs text-slate-500">
                    {authRole === "worker" ? "Want to join as a new worker? " : "Are you a skilled tradesperson? "}
                  </span>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate("register")}
                    className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline border-none bg-transparent cursor-pointer ml-1"
                  >
                    Register Worker with Aadhaar e-KYC →
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
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="flex flex-col"
              >
                <button
                  type="button"
                  onClick={() => {
                    setStep("phone");
                    setErrorMessage("");
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 mb-4 transition-colors self-start border-none bg-transparent cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">arrow_back</span>
                  <span>Change Number</span>
                </button>

                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Enter 6-Digit OTP
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-3">
                  Verification for <strong className="text-slate-900">+91 {phone}</strong>
                </p>

                {/* Conditional Banner: Real SMS Dispatched vs Twilio Trial Fallback */}
                {isRealSmsDelivered ? (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200/90 rounded-xl flex items-center gap-2.5 shadow-2xs">
                    <span className="material-symbols-outlined text-blue-600 text-xl flex-shrink-0">
                      sms
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold text-blue-950 block">
                        Real SMS Dispatched via Twilio
                      </span>
                      <span className="text-[11px] text-blue-700 block truncate">
                        Please check your cellular SMS messages on +91 {phone}.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200/90 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-emerald-950 block">
                        Twilio Trial Mode: <span className="font-mono text-emerald-700 font-extrabold text-sm tracking-wider">{generatedDemoCode}</span>
                      </span>
                      <span className="text-[10px] text-emerald-700 block truncate">
                        Unverified trial number. Click auto-fill or use <code className="font-mono">123456</code>.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = (generatedDemoCode || "123456").split("");
                        while (chars.length < 6) chars.push("0");
                        setOtpValues(chars.slice(0, 6));
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-extrabold border-none cursor-pointer flex-shrink-0 flex items-center gap-1 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-sm">bolt</span>
                      <span>Auto-fill</span>
                    </button>
                  </div>
                )}

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2">
                    {otpValues.map((val, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="tel"
                        maxLength={1}
                        value={val}
                        onChange={(e) => handleOtpBoxChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={idx === 0 ? handleOtpPaste : undefined}
                        className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg sm:text-xl font-extrabold text-slate-900 border border-slate-300 rounded-xl focus:border-[#0A2540] focus:ring-2 focus:ring-[#0A2540]/20 outline-none transition-all shadow-2xs"
                      />
                    ))}
                  </div>

                  {errorMessage && (
                    <p className="text-xs text-rose-600 text-center font-medium">
                      {errorMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpValues.join("").length !== 6}
                    className="w-full bg-[#0A2540] hover:bg-[#081d33] text-white font-extrabold py-3.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 border-none cursor-pointer text-sm disabled:opacity-50"
                  >
                    {isLoading ? "Verifying..." : "Verify & Sign In"}
                  </button>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <button
                      type="button"
                      onClick={() => setOtpValues(["1", "2", "3", "4", "5", "6"])}
                      className="text-indigo-600 font-bold hover:underline border-none bg-transparent cursor-pointer"
                    >
                      ⚡ Fill 123456
                    </button>

                    {countdown > 0 ? (
                      <span className="text-slate-400">Resend in {countdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#0A2540] font-bold hover:underline border-none bg-transparent cursor-pointer"
                      >
                        Resend Code
                      </button>
                    )}
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* PRESENTATION / TEAMMATE ONE-CLICK LOGIN DRAWER                           */}
        {/* ========================================================================= */}
        <div className="w-full bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-500 text-lg">bolt</span>
              <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                Teammate &amp; Presentation Quick Login (1-Click)
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickLogin(!showQuickLogin)}
              className="text-xs text-indigo-600 font-bold border-none bg-transparent cursor-pointer hover:underline"
            >
              {showQuickLogin ? "Hide" : "Show All (7 Accounts)"}
            </button>
          </div>

          {showQuickLogin && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_PRESET_ACCOUNTS.map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc)}
                  disabled={isLoading}
                  className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200 hover:border-indigo-300 bg-slate-50/70 hover:bg-indigo-50/50 text-left transition-all cursor-pointer group"
                >
                  <img
                    src={acc.avatar}
                    alt={acc.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-950 truncate">
                        {acc.name}
                      </span>
                      {acc.sakhi && (
                        <span className="text-[9px] px-1 bg-pink-100 text-pink-700 rounded font-bold flex-shrink-0">
                          ♀ Sakhi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className="truncate">{acc.trade}</span>
                      <span className="font-mono text-slate-400">{acc.phone}</span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[16px] text-slate-400 group-hover:text-indigo-600">
                    login
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}