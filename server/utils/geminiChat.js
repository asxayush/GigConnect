import { GoogleGenAI } from "@google/genai";

/**
 * Generate 3 short contextual smart replies using Gemini API
 * @param {Array} chatHistory - Recent messages array [{ sender: 'customer'|'worker', text: '...' }]
 * @param {string} latestMessage - The message just sent
 * @param {string} receiverRole - Role of the receiver ('worker' | 'customer')
 * @returns {Promise<Array<string>>} 3 short contextual replies
 */
export const generateSmartReplies = async (chatHistory = [], latestMessage = "", receiverRole = "worker") => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    "";

  // Fallback defaults if Gemini is not reachable or apiKey is missing
  const fallbackReplies = receiverRole === "worker"
    ? ["I am 5 mins away", "Just reached your location", "Stuck in traffic, reaching shortly"]
    : ["Thank you, please come in", "Take your time", "Please call when you reach"];

  if (!apiKey || !latestMessage?.trim()) {
    return fallbackReplies;
  }

  try {
    // 1. Try with GoogleGenAI SDK
    let responseText = "";
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a real-time smart assistant for GigConnect, an on-demand cooperative home services platform in Delhi NCR, India.
The recent conversation context is:
${chatHistory.slice(-4).map((m) => `${m.sender || "User"}: ${m.text}`).join("\n")}
Latest incoming message: "${latestMessage}"
The recipient who will reply is a: ${receiverRole}.

Generate exactly 3 short, polite, highly contextual, one-tap quick replies for the ${receiverRole} to choose from.
Rules:
- Keep each reply between 2 and 6 words.
- Natural Indian English or friendly professional phrasing (e.g. "I am 5 mins away", "Just reached the gate", "Share flat number please").
- Return ONLY the 3 replies separated by newlines. Do not include numbers, bullets, or quotes.`;

      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });

      responseText = response.text || "";
    } catch (sdkErr) {
      // 2. Direct REST fallback
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const restRes = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate 3 short contextual smart replies (2-6 words each) for a ${receiverRole} replying to: "${latestMessage}". Return strictly 3 lines, no bullets, no numbers.`,
                },
              ],
            },
          ],
        }),
      });
      const data = await restRes.json();
      responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }

    if (responseText) {
      const lines = responseText
        .split("\n")
        .map((l) => l.replace(/^[-*•\d.)\s"']+/g, "").trim())
        .filter((l) => l.length > 0 && l.length < 50)
        .slice(0, 3);

      if (lines.length >= 2) {
        return lines;
      }
    }
  } catch (error) {
    console.warn("[Gemini Smart Reply]: Fallback used due to:", error.message);
  }

  return fallbackReplies;
};
