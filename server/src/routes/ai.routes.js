import { Router } from "express";
import { GoogleGenAI } from "@google/genai";

const router = Router();

// Initialize Gemini AI client
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

// POST /api/ai/sahakari — Gemini-powered cooperative support triage assistant
router.post("/sahakari", async (req, res, next) => {
  try {
    const { prompt, category = "General", history = [] } = req.body || {};

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required",
      });
    }

    // Build conversation context from history
    const conversationContext = history
      .slice(-8) // Keep last 8 messages for context
      .map((m) => `${m.sender === "user" ? "User" : "AI"}: ${m.text}`)
      .join("\n");

    const systemPrompt = `You are Sahakari AI, the 24x7 cooperative support triage assistant for GigConnect — a cooperative work platform for tradespeople in India.

Your role:
- Help customers and workers resolve issues related to bookings, payments, escrow, worker delays, service quality, and safety.
- Be empathetic, concise, and practical. Respond in simple English or Hinglish.
- If the issue is about safety (Sakhi Trust Mode / Emergency), immediately advise the user to use the Emergency SOS button and escalate to the Federation Desk.
- If the issue is about payment disputes, explain that payments are held in cooperative escrow and 92% goes directly to the worker.
- If the issue is about worker delay/absence, suggest contacting the worker via the app, checking the booking status, and escalating if needed.
- Always offer to escalate to a human Federation Desk steward when the issue is complex or urgent.

Current issue category: ${category}

Conversation history:
${conversationContext}

User's latest message: ${prompt}

Respond with a helpful, empathetic, and actionable reply (max 200 words).`;

    let reply = "";
    let source = "gemini";

    try {
      if (process.env.GEMINI_API_KEY) {
        const result = await genAI.models.generateContent({
          model: "gemini-2.0-flash",
          contents: systemPrompt,
        });
        reply = result?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } catch (geminiErr) {
      console.warn("[Gemini AI Error]:", geminiErr.message);
    }

    // Fallback if Gemini fails or no API key
    if (!reply) {
      source = "fallback";
      reply = getFallbackReply(prompt, category);
    }

    // Determine if escalation button should be shown
    const showEscalateButton = shouldEscalate(prompt, category);

    res.json({
      success: true,
      reply,
      source,
      showEscalateButton,
      category,
    });
  } catch (err) {
    next(err);
  }
});

function getFallbackReply(prompt, category) {
  const lower = prompt.toLowerCase();

  if (lower.includes("safety") || lower.includes("emergency") || lower.includes("sakhi") || lower.includes("sos")) {
    return "🚨 Your safety is our top priority. Please use the Emergency SOS button immediately — our Rapid Response Team will be dispatched to your location right away. Your live coordinates and booking details will be shared with the Federation Desk and local ward stewards. Stay safe, we are here for you.";
  }

  if (lower.includes("payment") || lower.includes("refund") || lower.includes("money") || lower.includes("charge")) {
    return "I understand your concern about payment. All GigConnect payments are held in cooperative escrow — 92% goes directly to the worker, 5% to the Mutual Welfare Fund, and 3% covers platform operations. If you believe there's an error, I can escalate this to our Federation Desk for immediate review.";
  }

  if (lower.includes("delay") || lower.includes("absent") || lower.includes("late") || lower.includes("no show")) {
    return "I'm sorry your worker hasn't arrived on time. You can check the live booking status in 'My Bookings'. If the worker is significantly delayed, I recommend escalating to the Federation Desk so we can dispatch a backup certified professional or process a fair resolution.";
  }

  if (lower.includes("quality") || lower.includes("substandard") || lower.includes("incomplete") || lower.includes("bad")) {
    return "I understand the work quality isn't meeting expectations. GigConnect has a peer-reviewed quality mediation bench — 50% master tradespeople + 50% customer council. I can escalate this to the Federation Desk to initiate a fair quality review and resolution.";
  }

  return "Thank you for reaching out to Sahakari AI. I've noted your concern and can help you with booking issues, payment disputes, worker delays, or safety concerns. If you need immediate human assistance, please use the escalation button below and a Federation Desk steward will take over.";
}

function shouldEscalate(prompt, category) {
  const lower = prompt.toLowerCase();
  const urgentKeywords = [
    "emergency", "sos", "safety", "danger", "urgent", "refund", "scam",
    "fraud", "harassment", "abuse", "accident", "injury", "police",
    "complaint", "escalate", "human", "manager", "supervisor",
  ];
  return urgentKeywords.some((kw) => lower.includes(kw)) || category === "Safety" || category === "Dispute";
}

export default router;