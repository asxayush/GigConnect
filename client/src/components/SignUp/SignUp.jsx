import { useState } from "react";
import { signInWithGoogle, sendPhoneOTP, verifyPhoneOTP } from "../../auth.js";

function SignUp() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");

  return (
    <>
      <button onClick={signInWithGoogle}>
        Continue with Google
      </button>

      <input
        placeholder="+919876543210"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />

      <button onClick={() => sendPhoneOTP(phone)}>
        Send OTP
      </button>

      <input
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
      />

      <button onClick={() => verifyPhoneOTP(otp)}>
        Verify OTP
      </button>

      <div id="recaptcha-container" />
    </>
  );
}

export default SignUp;