import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { showToast } from "../../toast";
import { API_URL } from "../../api";

const BACKEND_URL = API_URL;

// Web Audio tone feedback
const playSound = (type = "msg") => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === "escalate") {
      osc.frequency.setValueAtTime(350, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else {
      osc.frequency.setValueAtTime(560, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {}
};

const INITIAL_MESSAGES = [
  {
    id: "ai_init",
    sender: "ai",
    text: "Namaste! I am the Sahakari AI, your 24x7 cooperative grievance & support triage assistant. How can I help you today?",
    time: "Just now",
  },
];

const QUICK_CHIPS = [
  { label: "⚡ Worker Delayed / Absent", category: "Service Quality" },
  { label: "💳 Payment & Tariff Dispute", category: "Payment" },
  { label: "♀ Sakhi Safety / Emergency", category: "Safety" },
  { label: "🛠️ Incomplete / Substandard Job", category: "Dispute" },
  { label: "🧑‍💼 Escalate to Human Admin", category: "General" },
];

export default function SahayataFAB({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [ticketStatus, setTicketStatus] = useState("idle"); // 'idle' | 'escalated' | 'resolved'
  const [ticketId, setTicketId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("General");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  // Socket connection — created once on mount, never torn down on ticketId change.
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("ticket_escalated_ack", (data) => {
      setTicketId(data.ticketId);
      setTicketStatus("escalated");
      playSound("escalate");
      showToast("🚨 Escalated to Federation Desk. A steward is reviewing!");
    });

    return () => {
      socket.disconnect();
    };
  }, []); // ← empty dep array: connect exactly once

  // Re-register ticket_updated whenever ticketId changes so the handler
  // always compares against the latest ticketId without reconnecting.
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleTicketUpdated = (data) => {
      if (data.ticketId !== ticketId) return;

      if (data.status === "in-progress") {
        setMessages((prev) => [
          ...prev,
          {
            id: "adm_" + Date.now(),
            sender: "admin",
            text: `👤 ${data.assignedAdmin || "Federation Steward"} has taken over this ticket. They are reviewing your case details right now.`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else if (data.status === "resolved") {
        setTicketStatus("resolved");
        setMessages((prev) => [
          ...prev,
          {
            id: "adm_res_" + Date.now(),
            sender: "admin",
            text: `✓ This support grievance has been marked as resolved by the Federation Desk. Thank you for being part of our cooperative.`,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    };

    socket.on("ticket_updated", handleTicketUpdated);

    // Clean up old listener before next ticketId value is registered.
    return () => {
      socket.off("ticket_updated", handleTicketUpdated);
    };
  }, [ticketId]);

  // Send message in AI triage chat via Gemini Backend
  const handleSend = async (textToSend, categoryOverride) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    playSound("msg");
    const nowTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const userMsg = {
      id: "u_" + Date.now(),
      sender: "user",
      text,
      time: nowTime,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputText("");
    const cat = categoryOverride || selectedCategory;
    if (categoryOverride) setSelectedCategory(categoryOverride);

    setIsTyping(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/sahakari`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: text,
          category: cat,
          history: updatedMessages.map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const data = await response.json();
      playSound("msg");
      setIsTyping(false);

      if (data && data.success) {
        const aiReply = {
          id: "ai_" + Date.now(),
          sender: "ai",
          text: data.reply || "Namaste! I am here to help you resolve any issues with your booking or payments.",
          showEscalateButton: data.showEscalateButton !== false,
          category: cat,
          problemSummary: text,
          source: data.source || "gemini",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => [...prev, aiReply]);
      } else {
        throw new Error(data?.message || "Failed to fetch response");
      }
    } catch (err) {
      console.warn("Sahakari AI fetch error, using client fallback:", err);
      setIsTyping(false);
      playSound("msg");

      const fallbackReply = {
        id: "ai_" + Date.now(),
        sender: "ai",
        text: "I understand your concern. Your booking payment remains secure under cooperative Escrow. If you need human intervention immediately, please use the escalation button below.",
        showEscalateButton: true,
        category: cat,
        problemSummary: text,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackReply]);
    }
  };

  // Escalate to Federation Desk
  const handleEscalateToAdmin = (category, summary) => {
    playSound("escalate");
    const userStored = localStorage.getItem("gigconnect_user");
    let parsedUser = null;
    try {
      if (userStored) parsedUser = JSON.parse(userStored);
    } catch (e) {}

    const issueText = summary || messages.filter((m) => m.sender === "user").map((m) => m.text).join(" | ") || "Customer requested direct human escalation from AI chat.";

    const payload = {
      userId: parsedUser?._id || null,
      userName: parsedUser?.name || "Customer (Delhi NCR)",
      userPhone: parsedUser?.phone || "9811012345",
      issueDescription: issueText,
      category: category || selectedCategory || "General",
      messages: messages.map((m) => ({
        sender: m.sender,
        text: m.text,
        createdAt: new Date(),
      })),
    };

    if (socketRef.current) {
      socketRef.current.emit("escalate_ticket", payload);
    }

    setTicketStatus("escalated");

    // Push local system notification inside chat
    setMessages((prev) => [
      ...prev,
      {
        id: "esc_" + Date.now(),
        sender: "system",
        text: `🚨 Urgent: Grievance escalated to Federation Desk Admin under Category: [${payload.category}]. Live alert dispatched to Ward Stewards.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <>
      {/* ================= FLOATING ACTION BUTTON (LIGHT/MATTE-NAVY STRIPE AESTHETIC) ================= */}
      <aside className="fixed bottom-6 left-6 z-40 font-sans">
        <motion.button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="flex items-center gap-2.5 px-4 py-3 bg-[#0A2540] hover:bg-slate-800 text-white rounded-xl shadow-xl border border-slate-700/60 cursor-pointer font-bold transition-all group backdrop-blur-md"
        >
          {/* Pulsing emerald indicator ring */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>

          {/* Icon always visible */}
          <span className="material-symbols-outlined text-[20px] text-emerald-400 group-hover:rotate-12 transition-transform">
            support_agent
          </span>

          {/* Desktop Text */}
          <span className="hidden sm:inline text-xs font-black tracking-tight text-white">
            Need Help? | 24x7 Cooperative Sahayata
          </span>
        </motion.button>
      </aside>

      {/* ================= AI CHAT MODAL (LIGHT SAAS / STRIPE THEME) ================= */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed bottom-20 left-6 z-40 w-[92vw] sm:w-[420px] max-h-[620px] h-[540px] bg-white border border-slate-200/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#0A2540] font-sans"
          >
            {/* Modal Header (Clean Light Theme) */}
            <div className="px-4 py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ea580c] to-amber-500 flex items-center justify-center text-white shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs font-black tracking-tight text-[#0A2540] m-0">
                      Sahakari AI Triage
                    </h3>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-extrabold">
                      24x7 Live
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 m-0">
                    Instant Grievance &amp; Escrow Support
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setMessages(INITIAL_MESSAGES);
                    setTicketStatus("idle");
                  }}
                  title="Reset Chat"
                  className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">restart_alt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                  className="w-7 h-7 rounded-lg hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center border-none bg-transparent cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            </div>

            {/* Status Strip if Escalated */}
            {ticketStatus === "escalated" && (
              <div className="px-3.5 py-2 bg-gradient-to-r from-red-50 to-amber-50 border-b border-red-200 flex items-center justify-between text-xs text-red-900 flex-shrink-0 animate-in fade-in">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-red-600 animate-pulse">campaign</span>
                  <span className="font-black text-[11px]">Ticket #{ticketId ? ticketId.slice(-6) : "ACTIVE"} Routed to Admin</span>
                </div>
                <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded-full border border-red-300 font-extrabold">
                  Priority 1
                </span>
              </div>
            )}

            {/* Chat Body (Soft Light Canvas) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#faf8ff] scrollbar-thin">
              {messages.map((m) => {
                const isUser = m.sender === "user";
                const isSystem = m.sender === "system";
                const isAdmin = m.sender === "admin";

                if (isSystem) {
                  return (
                    <div key={m.id} className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-center text-xs text-red-900 shadow-2xs">
                      <p className="m-0 font-medium leading-relaxed">{m.text}</p>
                      <span className="text-[10px] text-red-600 block mt-0.5">{m.time}</span>
                    </div>
                  );
                }

                if (isAdmin) {
                  return (
                    <div key={m.id} className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-950 shadow-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-800 mb-1">
                        <span className="material-symbols-outlined text-[16px]">verified_user</span>
                        <span>Federation Desk Human Admin</span>
                      </div>
                      <p className="m-0 leading-relaxed">{m.text}</p>
                      <span className="text-[10px] text-emerald-600 block mt-1 text-right">{m.time}</span>
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                        isUser
                          ? "bg-[#0A2540] text-white rounded-tr-none"
                          : "bg-white text-[#0A2540] rounded-tl-none border border-slate-200/90"
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap">{m.text}</p>
                      <span className={`text-[10px] block mt-1 ${isUser ? "text-slate-300 text-right" : "text-slate-400"}`}>
                        {m.time}
                      </span>
                    </div>

                    {/* Escalate Action Button inside AI Message */}
                    {m.showEscalateButton && ticketStatus !== "escalated" && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2.5 w-full max-w-[90%] p-3.5 bg-white border-2 border-orange-200 rounded-xl shadow-sm"
                      >
                        <div className="flex items-center gap-1.5 text-[#ea580c] text-xs font-black mb-1">
                          <span className="material-symbols-outlined text-[16px]">gavel</span>
                          <span>Human Intervention Required?</span>
                        </div>
                        <p className="text-[11px] text-slate-600 m-0 mb-2.5 leading-snug font-medium">
                          Cooperative Ward Stewards can override rates, freeze escrow, or reassign a certified backup pro.
                        </p>
                        <button
                          type="button"
                          onClick={() => handleEscalateToAdmin(m.category, m.problemSummary)}
                          className="w-full py-2 px-3 bg-gradient-to-r from-red-600 to-[#ea580c] hover:opacity-95 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-sm border-none cursor-pointer active:scale-95"
                        >
                          <span className="material-symbols-outlined text-[16px]">campaign</span>
                          <span>Escalate to Federation Desk</span>
                        </button>
                      </motion.div>
                    )}
                  </div>
                );
              })}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex items-center gap-1.5 bg-white px-3.5 py-2.5 rounded-2xl rounded-tl-none w-fit border border-slate-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Chips Row */}
            <div className="px-3 py-2.5 bg-white border-t border-slate-200/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0">
              {QUICK_CHIPS.map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(chip.label, chip.category)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-orange-50 hover:text-[#ea580c] text-slate-700 border border-slate-200 hover:border-orange-200 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors border-none cursor-pointer flex-shrink-0 active:scale-95"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Chat Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 bg-white border-t border-slate-200/80 flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Describe issue (e.g. overcharging, worker delay)..."
                className="flex-1 px-3.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#ea580c] rounded-xl text-xs text-[#0A2540] placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#ea580c] transition-all"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="w-9 h-9 rounded-xl bg-[#ea580c] hover:bg-[#c2410c] disabled:opacity-40 text-white flex items-center justify-center transition-all border-none cursor-pointer flex-shrink-0 active:scale-95 shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
