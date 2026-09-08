import twilio from "twilio";

const getClient = () => {
    const missing = ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_VERIFY_SERVICE_SID"].filter((name) => !process.env[name]);
    if (missing.length) { const error = new Error(`Twilio Verify is not configured. Missing: ${missing.join(", ")}`); error.statusCode = 503; throw error; }
    if (!/^VA[a-f0-9]{32}$/i.test(process.env.TWILIO_VERIFY_SERVICE_SID)) { const error = new Error("TWILIO_VERIFY_SERVICE_SID must be a Twilio Verify Service SID beginning with VA."); error.statusCode = 503; throw error; }
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

const twilioError = (error) => {
    const wrapped = new Error(error?.message || "Twilio Verify request failed");
    wrapped.statusCode = error?.status || 502;
    return wrapped;
};

export const sendPhoneVerification = async (phone) => {
    try { return await getClient().verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verifications.create({ to: phone, channel: "sms" }); }
    catch (error) { throw twilioError(error); }
};

export const checkPhoneVerification = async (phone, code) => {
    try { return await getClient().verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID).verificationChecks.create({ to: phone, code }); }
    catch (error) { throw twilioError(error); }
};
