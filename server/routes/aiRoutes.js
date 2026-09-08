import { Router } from "express";

const router = Router();

const SAHAKARI_SYSTEM_PROMPT = `
You are "Sahakari AI" (सहकारी AI), the 24x7 cooperative assistant for "GigConnect" (a democratic, 100% worker-owned gig platform in Delhi NCR registered under the Multi-State Co-operative Societies Act).

Your core duties and platform knowledge:
1. Cooperative Fair-Pay Guarantee: 92% of payments go directly to workers with 0% platform middleman extraction (unlike commercial aggregators that take 25-35%).
2. Fair-Bid Tariff: Workers and customers can negotiate fair transparent prices directly in chat.
3. ♀ Sakhi Trust: Dedicated safety mode verifying background-checked women workers for secure in-home domestic services.
4. Sahakari Tool Bank: Verified members can reserve expensive heavy tools (e.g. Bosch Rotary Drills, DeWalt Saws, Fluke Multimeters) with 0% cash deposit. Unverified workers must complete Aadhaar e-KYC first.
5. Dispute & Grievance: All payments are protected by Escrow. No arbitrary star-rating blocks. Peer review tribunals handle disputes within 24 hours.

Tone & Style:
- Warm, polite, empathetic, and professional.
- Support both English and conversational Hindi / Hinglish.
- Keep responses concise (2 to 4 sentences) and actionable.
- If the issue requires human action (payment dispute, worker delay, physical emergency, or refund), explicitly suggest escalating to the Federation Desk Ward Steward.
`;

// Helper for calling Google Gemini API
const callGemini = async (prompt, history = []) => {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    "";

  if (!apiKey) {
    return null;
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

  // Build conversational contents
  const contents = [
    {
      role: "user",
      parts: [{ text: `System Instructions: ${SAHAKARI_SYSTEM_PROMPT}` }],
    },
    ...history
      .filter((m) => m.text && (m.sender === "user" || m.sender === "ai"))
      .slice(-6)
      .map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      })),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 350,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn("[Gemini API Warning]:", errText);
    return null;
  }

  const data = await response.json();
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return candidate ? candidate.trim() : null;
};

// Cooperative Smart Fallback rules
const generateCooperativeFallback = (prompt) => {
  const lower = prompt.toLowerCase();

  if (lower.includes("price") || lower.includes("rate") || lower.includes("charge") || lower.includes("tariff") || lower.includes("paisa") || lower.includes("kitna")) {
    return "GigConnect operates on a zero-surge cooperative tariff. 92% of the payment goes directly to the karigar with 0% middleman cut. You can also use the 'Bargain / Propose Fare' feature in chat for direct fair-bidding!";
  }

  if (lower.includes("tool") || lower.includes("drill") || lower.includes("saw") || lower.includes("welder") || lower.includes("equipment")) {
    return "Our Sahakari Tool Bank provides heavy equipment (Bosch drills, DeWalt saws, welders) at 0% deposit across 4 Delhi NCR depots for verified workers. Unverified profiles can complete Aadhaar e-KYC to unlock access.";
  }

  if (lower.includes("sakhi") || lower.includes("woman") || lower.includes("women") || lower.includes("safety") || lower.includes("female")) {
    return "♀ Sakhi Trust is our verified women-to-women safety feature. Toggle 'Sakhi Mode' in the Find Help directory to view certified female professionals for secure in-home services.";
  }

  if (lower.includes("delay") || lower.includes("late") || lower.includes("absent") || lower.includes("not arrived") || lower.includes("nahi aaya") || lower.includes("cancel")) {
    return "I see the worker has not arrived on schedule. Your booking payment is safe in cooperative Escrow. If you need immediate assistance or a backup replacement pro, click the 'Escalate to Federation Desk' button below.";
  }

  if (lower.includes("admin") || lower.includes("human") || lower.includes("escalat") || lower.includes("complain") || lower.includes("steward") || lower.includes("dispute")) {
    return "I am routing your grievance to the Federation Desk Ward Steward. Please click 'Escalate to Federation Desk' below to immediately alert our live operations bench.";
  }

  return "Namaste! I am the Sahakari AI powered by cooperative triage intelligence. I can assist you with fair pricing, verified bookings, Tool Bank access, and dispute resolution. If you need human intervention, please click 'Escalate to Federation Desk'.";
};

/**
 * POST /api/ai/sahakari
 * AI Chat Assistant endpoint for Sahakari AI
 */
router.post("/sahakari", async (req, res) => {
  const { prompt, history = [], category = "General" } = req.body;

  if (!prompt || !prompt.trim()) {
    return res.status(400).json({
      success: false,
      message: "Prompt is required.",
    });
  }

  try {
    let reply = await callGemini(prompt.trim(), history);

    if (!reply) {
      reply = generateCooperativeFallback(prompt.trim());
    }

    // Determine if escalation button should be shown
    const lower = (prompt + " " + reply).toLowerCase();
    const shouldShowEscalate =
      category !== "General" ||
      lower.includes("escalat") ||
      lower.includes("delay") ||
      lower.includes("dispute") ||
      lower.includes("admin") ||
      lower.includes("complain") ||
      lower.includes("overcharg") ||
      lower.includes("refund") ||
      lower.includes("emergency");

    res.json({
      success: true,
      reply,
      showEscalateButton: shouldShowEscalate,
      source: process.env.GEMINI_API_KEY ? "gemini-1.5-flash" : "sahakari-coop-ai",
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("[Sahakari AI Route Error]:", error);
    res.json({
      success: true,
      reply: generateCooperativeFallback(prompt),
      showEscalateButton: true,
      source: "sahakari-fallback",
    });
  }
});

export default router;
