import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { showToast } from "../../toast";

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

// Alert tone generator
const playAlertSound = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.28);
    osc.start();
    osc.stop(ctx.currentTime + 0.28);
  } catch (e) {}
};

const INITIAL_DEMO_TICKETS = [
  {
    _id: "tkt_66d901",
    userName: "Meera Sen",
    userPhone: "9811099234",
    issueDescription: "AC technician arrived 45 minutes late and requested ₹200 extra cash above cooperative app tariff.",
    category: "Payment",
    status: "escalated",
    escalatedAt: new Date(Date.now() - 18 * 60000),
    formattedTime: "10:14 AM",
    messages: [
      { sender: "user", text: "Bhaiya is asking for ₹500 when standard cooperative fee was ₹300." },
      { sender: "ai", text: "Cooperative tariffs are locked with 0% extra surge. Escalating to desk steward." },
    ],
  },
  {
    _id: "tkt_66d902",
    userName: "Rajesh Varma",
    userPhone: "9811088412",
    issueDescription: "Short circuit repair in bedroom MCB incomplete; worker left without testing inverter line.",
    category: "Dispute",
    status: "in-progress",
    assignedAdmin: "Kavita S. Murthy (Trustee)",
    escalatedAt: new Date(Date.now() - 55 * 60000),
    formattedTime: "09:35 AM",
    messages: [],
  },
];

export default function LiveGrievanceQueue() {
  const [tickets, setTickets] = useState(INITIAL_DEMO_TICKETS);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminResponseText, setAdminResponseText] = useState("");
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);

  // Connect to Socket.io and join 'admin_room'
  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      socket.emit("join_admin_room");
      console.log("[Admin] Joined 'admin_room' for live grievance triage");
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // ================= PART 3: LISTEN FOR NEW_ADMIN_ALERT =================
    socket.on("new_admin_alert", (alertData) => {
      playAlertSound();

      // High-priority red-tinted real-time toast notification
      showToast(alertData.title || "🚨 Urgent: New Support Escalation from AI Triage");

      if (alertData.ticket) {
        setTickets((prev) => {
          // Avoid duplicates
          const exists = prev.some((t) => t._id === alertData.ticket._id);
          if (exists) return prev;
          return [alertData.ticket, ...prev];
        });
      }
    });

    // Listen for ticket updates across admins
    socket.on("ticket_updated", (updateData) => {
      setTickets((prev) =>
        prev.map((t) =>
          t._id === updateData.ticketId
            ? {
                ...t,
                status: updateData.status,
                assignedAdmin: updateData.assignedAdmin || t.assignedAdmin,
                resolutionNotes: updateData.resolutionNotes || t.resolutionNotes,
              }
            : t
        )
      );

      if (selectedTicket && selectedTicket._id === updateData.ticketId) {
        setSelectedTicket((prev) => ({
          ...prev,
          status: updateData.status,
          assignedAdmin: updateData.assignedAdmin || prev?.assignedAdmin,
        }));
      }
    });

    // Fetch any tickets stored in DB
    fetch(`${BACKEND_URL}/api/admin/tickets`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data) && res.data.length > 0) {
          setTickets((prev) => {
            const combined = [...res.data, ...prev];
            const unique = [];
            const seen = new Set();
            for (const item of combined) {
              if (!seen.has(item._id)) {
                seen.add(item._id);
                unique.push(item);
              }
            }
            return unique;
          });
        }
      })
      .catch(() => {});

    return () => {
      socket.disconnect();
    };
  }, []);

  // Admin takes over chat
  const handleTakeOver = (ticket) => {
    const adminName = "Ward Steward (Desk Admin)";
    if (socketRef.current) {
      socketRef.current.emit("admin_take_over", {
        ticketId: ticket._id,
        adminName,
      });
    }

    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticket._id ? { ...t, status: "in-progress", assignedAdmin: adminName } : t
      )
    );

    setSelectedTicket({ ...ticket, status: "in-progress", assignedAdmin: adminName });
    showToast(`👤 Taken over Ticket #${ticket._id.slice(-6)}. Escrow freeze & direct line active.`);
  };

  // Admin resolves ticket
  const handleResolve = (ticketId) => {
    const notes = adminResponseText || "Resolved via federation mediation protocol.";
    if (socketRef.current) {
      socketRef.current.emit("resolve_ticket", {
        ticketId,
        resolutionNotes: notes,
      });
    }

    setTickets((prev) =>
      prev.map((t) =>
        t._id === ticketId ? { ...t, status: "resolved", resolutionNotes: notes } : t
      )
    );

    setSelectedTicket(null);
    setAdminResponseText("");
    showToast(`✓ Ticket #${ticketId.slice(-6)} marked as Resolved.`);
  };

  const escalatedCount = tickets.filter((t) => t.status === "escalated").length;

  return (
    <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 border border-slate-800 shadow-xl mt-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-[22px]">emergency_home</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black tracking-tight text-white m-0">
                Live Grievances &amp; AI Support Escalations
              </h3>
              {escalatedCount > 0 && (
                <span className="px-2 py-0.5 bg-red-600/90 text-white font-extrabold text-[10px] rounded-full animate-pulse">
                  {escalatedCount} Urgent
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 m-0">
              Real-time multi-channel triage escalated from the 24x7 Sahakari AI widget
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-slate-800 rounded-xl text-xs font-bold text-slate-300 border border-slate-700 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            {isConnected ? "Admin Live Stream Active" : "Connecting..."}
          </span>
        </div>
      </div>

      {/* Ticket List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-4">
        
        {/* Left Column: Live Tickets List */}
        <div className="lg:col-span-7 space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {tickets.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800">
              <span className="material-symbols-outlined text-4xl text-slate-600 mb-2">check_circle</span>
              <p className="text-xs text-slate-400 m-0">No active grievance escalations in queue. All clear!</p>
            </div>
          ) : (
            <AnimatePresence>
              {tickets.map((t) => {
                const isEscalated = t.status === "escalated";
                const isInProgress = t.status === "in-progress";
                const isResolved = t.status === "resolved";
                const isSelected = selectedTicket?._id === t._id;

                return (
                  <motion.div
                    key={t._id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`p-4 rounded-xl transition-all border cursor-pointer ${
                      isSelected
                        ? "bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/40"
                        : isEscalated
                        ? "bg-gradient-to-r from-red-950/40 via-slate-900 to-slate-900 border-red-700/60 hover:border-red-500"
                        : isInProgress
                        ? "bg-slate-950/80 border-amber-600/50 hover:border-amber-500"
                        : "bg-slate-950/40 border-slate-800 opacity-70"
                    }`}
                    onClick={() => setSelectedTicket(t)}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            isEscalated
                              ? "bg-red-600 text-white animate-pulse"
                              : isInProgress
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {isEscalated ? "🚨 Escalated" : isInProgress ? "⚙️ In Progress" : "✓ Resolved"}
                        </span>
                        <span className="text-xs font-extrabold text-slate-200">
                          {t.category || "Grievance"}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          #{t._id.slice(-6)}
                        </span>
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {t.formattedTime || (t.createdAt ? new Date(t.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Recent")}
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium m-0 mb-3 leading-relaxed">
                      "{t.issueDescription}"
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-slate-400">person</span>
                        <span className="font-bold text-slate-300">{t.userName}</span>
                        <span>•</span>
                        <span>{t.userPhone}</span>
                      </div>

                      {isInProgress && (
                        <span className="text-amber-400 font-semibold">
                          Assigned: {t.assignedAdmin || "Desk Steward"}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Right Column: Active Ticket Detail & Takeover Console */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          {selectedTicket ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300 m-0">
                    Ticket #{selectedTicket._id.slice(-6)} Triage Console
                  </h4>
                  <span className="text-[11px] text-slate-500">{selectedTicket.category} • {selectedTicket.userName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="text-slate-400 hover:text-slate-200 text-xs border-none bg-transparent cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Detail Info */}
              <div className="bg-slate-900/90 rounded-lg p-3 border border-slate-800 space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Reported Issue</span>
                  <p className="text-slate-200 m-0 font-medium mt-0.5">{selectedTicket.issueDescription}</p>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800 text-[11px]">
                  <span className="text-slate-400">Member Phone:</span>
                  <span className="font-bold text-slate-200">{selectedTicket.userPhone}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Escalation Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">{selectedTicket.status}</span>
                </div>
              </div>

              {/* Chat Transcript preview */}
              {selectedTicket.messages?.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">
                    AI Chat Transcript ({selectedTicket.messages.length} msgs)
                  </span>
                  <div className="max-h-28 overflow-y-auto space-y-1 bg-slate-900/50 p-2 rounded-lg border border-slate-800 text-[11px]">
                    {selectedTicket.messages.map((msg, idx) => (
                      <div key={idx} className="text-slate-300">
                        <strong className={msg.sender === "user" ? "text-emerald-400" : "text-slate-400"}>
                          {msg.sender === "user" ? "Member: " : "AI: "}
                        </strong>
                        <span>{msg.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Action Input */}
              {selectedTicket.status !== "resolved" && (
                <div className="pt-2 space-y-2">
                  <textarea
                    rows={2}
                    value={adminResponseText}
                    onChange={(e) => setAdminResponseText(e.target.value)}
                    placeholder="Enter federation resolution notes (e.g., escrow refund dispatched, worker re-instructed)..."
                    className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />

                  <div className="flex items-center gap-2">
                    {selectedTicket.status === "escalated" ? (
                      <button
                        type="button"
                        onClick={() => handleTakeOver(selectedTicket)}
                        className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md border-none cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">headset_mic</span>
                        <span>Take Over Chat</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleResolve(selectedTicket._id)}
                        className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md border-none cursor-pointer active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Mark as Resolved</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <span className="material-symbols-outlined text-4xl mb-2 text-slate-600">contact_support</span>
              <p className="text-xs m-0">Select any grievance ticket to review details, take over live conversation, or issue escrow resolution.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
