/**
 * sendSms — fire-and-forget SMS notification via Twilio REST API.
 * Errors are logged but never rethrown, so SMS failures never break
 * booking creation or status update responses.
 */
export async function sendSms(to, body) {
  if (
    !to ||
    !process.env.TWILIO_ACCOUNT_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_FROM_NUMBER
  ) {
    return; // Twilio not configured — skip silently
  }

  try {
    const credentials = Buffer.from(
      `${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString("base64");

    const form = new URLSearchParams({
      To: to,
      From: process.env.TWILIO_FROM_NUMBER,
      Body: body,
    });

    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: form,
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[SMS] Failed to send to ${to}: ${res.status} ${text}`);
    }
  } catch (err) {
    // Network failure, Twilio outage, etc. — log and continue.
    console.warn(`[SMS] Error sending to ${to}:`, err.message);
  }
}
