import {
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth";
import { auth, googleProvider } from "./firebase";

export const signInWithGoogle = () => {
  return signInWithPopup(auth, googleProvider);
};

export const setupRecaptcha = () => {
  if (!window.recaptchaVerifier) {
    window.recaptchaVerifier = new RecaptchaVerifier(
      auth,
      "recaptcha-container",
      { size: "invisible" }
    );
  }

  return window.recaptchaVerifier;
};

export const sendPhoneOTP = async (phoneNumber) => {
  const verifier = setupRecaptcha();

  const confirmationResult = await signInWithPhoneNumber(
    auth,
    phoneNumber,
    verifier
  );

  window.confirmationResult = confirmationResult;
};

export const verifyPhoneOTP = (otp) => {
  return window.confirmationResult.confirm(otp);
};