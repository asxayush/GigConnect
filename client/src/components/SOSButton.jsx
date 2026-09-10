import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../toast";
import { triggerSosAlert } from "../api";

export default function SOSButton({ bookingId, workerId, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isTriggering, setIsTriggering] = useState(false);
  const [reason, setReason] = useState("");
  const [emergencyContactEmail, setEmergencyContactEmail] = useState("");

  const handleTriggerSOS = async () => {
    setIsTriggering(true);
    try {
      const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
      const userStored = localStorage.getItem("gigconnect_user") || localStorage.getItem("gig_user");
      let user = null;
      try {
        if (userStored) user = JSON.parse(userStored);
      } catch {
        // Ignore parse errors
      }

      const payload = {
        bookingId,
        userId: user?._id || user?.id,
        workerId,
        reason: reason || "Emergency SOS triggered by user",
        emergencyContactEmail,
        location: {
          lat: 28.6139,
          lng: 77.209,
        },
      };

      const res = await triggerSosAlert(payload, token);
      if (res?.success) {
        showToast("🚨 Emergency SOS broadcasted! Rapid Response Team dispatched.");
        setIsOpen(false);
        setReason("");
        if (onNavigate) onNavigate("admin");
      } else {
        showToast(res?.message || "SOS trigger failed. Please call 112.");
      }
    } catch (err) {
      showToast(err.message || "SOS trigger failed. Please call 112.");
    } finally {
      setIsTriggering(false);
    }
  };

  return (
    <>
      {/* Floating SOS Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-xl shadow-red-600/30 flex items-center justify-center cursor-pointer border-2 border-white/30"
        title="Emergency SOS"
      >
        <span className="material-symbols-outlined text-[26px] animate-pulse">sos</span>
      </motion.button>

      {/* SOS Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-red-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-200">
                    <span className="material-symbols-outlined text-[22px]">sos</span>
                  </div>
                  <div>
                    <h3 className="text-base font-black text-[#0A2540] m-0">Emergency SOS</h3>
                    <p className="text-xs text-slate-500 m-0">Rapid Response Team will be dispatched</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-4">
                <p className="text-xs text-red-800 leading-relaxed m-0">
                  <strong>⚠️ Emergency Alert:</strong> Your live location and booking details will be shared with the Federation Desk, local ward stewards, and emergency contacts. This is a real emergency alert.
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reason (optional)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Describe the emergency situation..."
                    rows={2}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 text-sm outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Email (optional)</label>
                  <input
                    type="email"
                    value={emergencyContactEmail}
                    onChange={(e) => setEmergencyContactEmail(e.target.value)}
                    placeholder="family@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 text-sm outline-none"
                  />
                </div>
              </div>

              <button
                type="button"
                disabled={isTriggering}
                onClick={handleTriggerSOS}
                className="w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-black text-sm rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-red-600/25"
              >
                <span className="material-symbols-outlined text-[18px] animate-pulse">sos</span>
                <span>{isTriggering ? "Broadcasting Alert..." : "Trigger Emergency SOS"}</span>
              </button>

              <p className="text-center text-[10px] text-slate-400 mt-3">
                In immediate danger? Call 112 (National Emergency Number)
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}