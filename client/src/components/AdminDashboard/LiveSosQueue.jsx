import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../../toast";
import { API_URL } from "../../api";

const BACKEND_URL = API_URL;

export default function LiveSosQueue() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = () => {
    fetch(`${BACKEND_URL}/api/sos/active`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAlerts(data.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (id) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sos/${id}/resolve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolutionNotes: "Rapid response coordinator verified safe on site" }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("✓ SOS incident resolved and logged in Federation audit records");
        fetchAlerts();
      }
    } catch (err) {
      showToast("Failed to resolve SOS alert: " + err.message);
    }
  };

  const activeAlerts = alerts.filter((a) => a.status === "active");

  return (
    <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-red-950/40 via-red-900/20 to-slate-900 border-2 border-red-500/50 shadow-2xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-black animate-pulse shadow-lg shadow-red-600/50">
            <span className="material-symbols-outlined text-[22px]">emergency</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-red-100 m-0 tracking-tight">
                Live Emergency SOS Rapid Dispatch Ticker
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                activeAlerts.length > 0
                  ? "bg-red-500 text-white animate-bounce"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
              }`}>
                {activeAlerts.length > 0 ? `🚨 ${activeAlerts.length} Active Emergency` : "✓ All Zones Secure"}
              </span>
            </div>
            <p className="text-xs text-red-200/70 m-0 mt-0.5">
              Real-time rapid response coordinator desk for women safety &amp; in-job distress escalations.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAlerts}
          className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-red-200 text-xs font-bold border border-red-500/30 cursor-pointer transition-all shrink-0"
        >
          Refresh Feed
        </button>
      </div>

      <AnimatePresence>
        {activeAlerts.length === 0 ? (
          <div className="py-6 text-center rounded-xl bg-black/20 border border-white/5">
            <span className="material-symbols-outlined text-3xl text-emerald-400 mb-1">verified_user</span>
            <p className="text-xs font-bold text-slate-300 m-0">No active distress calls across Delhi NCR cooperative wards.</p>
            <span className="text-[11px] text-slate-500">All emergency SOS dispatches and email alerts are tracked with 2dsphere GPS precision.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const coords = alert.location?.coordinates || [77.209, 28.6139];
              const mapUrl = `https://www.google.com/maps?q=${coords[1]},${coords[0]}`;
              return (
                <motion.div
                  key={alert._id || alert.sosCode}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-xl bg-red-950/80 border border-red-500/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-red-600 text-white rounded-md text-[10px] font-black uppercase">
                        Incident: {alert.sosCode || "SOS-ALERT"}
                      </span>
                      <span className="text-xs font-bold text-red-200">
                        {alert.reason || "🚨 Distress SOS Triggered on Active Booking"}
                      </span>
                      <span className="text-[11px] text-red-300/80">
                        • {new Date(alert.createdAt || Date.now()).toLocaleTimeString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-300 mt-2">
                      <div>
                        <strong className="text-red-300">Caller:</strong>{" "}
                        {alert.userId?.name || "Customer"} ({alert.userId?.phone || "Phone on file"})
                      </div>
                      <div>
                        <strong className="text-red-300">Assigned Karigar:</strong>{" "}
                        {alert.workerId?.name || "Assigned Worker"} ({alert.workerId?.phone || "Phone on file"})
                      </div>
                      <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                        <span className="text-red-300 font-bold">GPS Coordinates:</span>
                        <a
                          href={mapUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-400 hover:text-amber-300 underline font-mono text-[11px] flex items-center gap-1"
                        >
                          <span>{coords[1]?.toFixed(5)}, {coords[0]?.toFixed(5)}</span>
                          <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                        </a>
                        {alert.emailNotificationSent && (
                          <span className="px-2 py-0.2 bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold">
                            ✓ Nodemailer Dispatched
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
                    <button
                      type="button"
                      onClick={() => handleResolve(alert._id)}
                      className="w-full md:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl border-none cursor-pointer transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      <span>Resolve &amp; Dispatch Done</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
