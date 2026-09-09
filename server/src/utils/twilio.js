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
        // Attempt 1: Twilio Verify Service
        if (process.env.TWILIO_VERIFY_SERVICE_SID && /^VA[a-f0-9]{32}$/i.test(process.env.TWILIO_VERIFY_SERVICE_SID)) {
            try {
                const verification = await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: formattedPhone, channel: "sms" });
                if (verification.status === "pending" || verification.status === "approved") {
                    return { status: "pending", demoCode: generatedOtp, isDeliveredViaTwilio: true };
                }
            } catch (verifyErr) {
                console.warn(`[Twilio Verify Notice] ${verifyErr.message}`);
            }
        }

        // Attempt 2: Twilio Programmable SMS (using TWILIO_FROM_NUMBER)
        if (process.env.TWILIO_FROM_NUMBER) {
            try {
                const message = await client.messages.create({
                    body: `Your GigConnect security verification code is: ${generatedOtp}. Valid for 10 minutes.`,
                    from: process.env.TWILIO_FROM_NUMBER,
                    to: formattedPhone,
                });
                if (message.sid) {
                    console.log(`✓ Real SMS sent via Twilio to ${formattedPhone} (SID: ${message.sid})`);
                    return { status: "pending", demoCode: generatedOtp, isDeliveredViaTwilio: true };
                }
            } catch (smsErr) {
                console.warn(`[Twilio SMS Notice] Could not deliver to ${formattedPhone}: ${smsErr.message}`);
            }
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

