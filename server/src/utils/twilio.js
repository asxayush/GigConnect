import twilio from "twilio";

const memoryOtps = new Map();

const getClient = () => {
    const missing = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"].filter((name) => !process.env[name]);
    if (missing.length) return null;
    if (!/^VA[a-f0-9]{32}$/i.test(process.env.TWILIO_VERIFY_SERVICE_SID)) return null;
    try {
        return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch {
        return null;
    }
};

const normalizePhone = (p) => (p || "").replace(/[\s()-]/g, "").replace(/^\+91/, "");

export const sendPhoneVerification = async (phone) => {
    const rawDigits = normalizePhone(phone);
    const formattedPhone = `+91${rawDigits}`;
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store under both raw digits and formatted phone
    const otpData = {
        code: generatedOtp,
        expiresAt: Date.now() + 15 * 60 * 1000 // 15 minutes
    };
    memoryOtps.set(rawDigits, otpData);
    memoryOtps.set(formattedPhone, otpData);

    const client = getClient();
    let isDeliveredViaTwilio = false;

    if (client) {
        try {
            const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: formattedPhone, channel: "sms" });
            if (verification.status === "pending" || verification.status === "approved") {
                isDeliveredViaTwilio = true;
            }
            return { status: verification.status || "pending", demoCode: generatedOtp, isDeliveredViaTwilio: true };
        } catch (error) {
            console.warn(`[Twilio Note] SMS not dispatched to ${formattedPhone} (Trial account only delivers to verified numbers): ${error.message}`);
            return { status: "pending", demoCode: generatedOtp, isDeliveredViaTwilio: false, reason: error.message };
        }
    }

    return { status: "pending", demoCode: generatedOtp, isDeliveredViaTwilio: false };
};

export const checkPhoneVerification = async (phone, code) => {
    const rawDigits = normalizePhone(phone);
    const formattedPhone = `+91${rawDigits}`;

    // 1. Universal demo/presentation sandbox bypass
    if (code === "123456") {
        return { status: "approved" };
    }

    // 2. Check stored in-memory OTP for raw digits or formatted phone
    const stored = memoryOtps.get(rawDigits) || memoryOtps.get(formattedPhone) || memoryOtps.get(phone);
    if (stored && stored.code === code && Date.now() < stored.expiresAt) {
        memoryOtps.delete(rawDigits);
        memoryOtps.delete(formattedPhone);
        return { status: "approved" };
    }

    // 3. Check with Twilio Verify service
    const client = getClient();
    if (client) {
        try {
            const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: formattedPhone, code });
            if (check.status === "approved") {
                memoryOtps.delete(rawDigits);
                memoryOtps.delete(formattedPhone);
                return { status: "approved" };
            }
        } catch (error) {
            console.warn("[Twilio Verify Check Note]:", error.message);
            if (stored && stored.code === code) {
                memoryOtps.delete(rawDigits);
                memoryOtps.delete(formattedPhone);
                return { status: "approved" };
            }
        }
    }

    return { status: "denied" };
};

