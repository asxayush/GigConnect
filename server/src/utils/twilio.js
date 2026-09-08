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

export const sendPhoneVerification = async (phone) => {
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    memoryOtps.set(phone, {
        code: generatedOtp,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
    });

    const client = getClient();
    if (client) {
        try {
            const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phone, channel: "sms" });
            return { status: verification.status || "pending", demoCode: generatedOtp };
        } catch (error) {
            console.warn("Twilio SMS send error, using fallback OTP:", error.message);
            return { status: "pending", demoCode: generatedOtp };
        }
    }

    return { status: "pending", demoCode: generatedOtp };
};

export const checkPhoneVerification = async (phone, code) => {
    // 1. Universal demo/sandbox bypass
    if (code === "123456") {
        return { status: "approved" };
    }

    // 2. Check stored in-memory OTP
    const stored = memoryOtps.get(phone);
    if (stored && stored.code === code && Date.now() < stored.expiresAt) {
        memoryOtps.delete(phone);
        return { status: "approved" };
    }

    // 3. Check with Twilio Verify service
    const client = getClient();
    if (client) {
        try {
            const check = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: phone, code });
            if (check.status === "approved") {
                memoryOtps.delete(phone);
                return { status: "approved" };
            }
        } catch (error) {
            console.warn("Twilio verificationCheck error:", error.message);
            if (stored && stored.code === code) {
                memoryOtps.delete(phone);
                return { status: "approved" };
            }
        }
    }

    return { status: "denied" };
};

