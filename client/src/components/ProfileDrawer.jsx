import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { auth } from "../auth";
import { getAvatar } from "../assets/avatars";

export default function ProfileDrawer({
  isOpen,
  onClose,
  view,
  onNavigate,
  onToggleLanguage,
  currentLanguage,
  user,
  onLogout,
}) {
  const { t } = useTranslation();

  const activeUser = user || (() => {
    try {
      const saved = localStorage.getItem("gigconnect_user") || localStorage.getItem("gig_user");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  })();

  if (!activeUser) {
    return null;
  }

  const userName = activeUser.name || "Member Customer";
  const userPhone = activeUser.phone || "";
  const userRole = activeUser.role || "customer";
  const avatarUrl = getAvatar(activeUser);

  const handleNav = (targetView) => {
    onNavigate(targetView);
    onClose();
  };

  // State Management Bug Fix 2: Full session wipe & redirect
  const handlePerformLogout = () => {
    localStorage.removeItem("gig_token");
    localStorage.removeItem("gigconnect_token");
    localStorage.removeItem("gigconnect_user");
    localStorage.removeItem("gig_user");
    localStorage.removeItem("gigconnect_role");
    localStorage.removeItem("gigconnect_worker_status");
    sessionStorage.clear();

    try {
      auth?.signOut().catch(() => {});
    } catch (e) {}

    // Dispatch global event so all components react
    window.dispatchEvent(new Event("gigconnect_auth_change"));

    if (onLogout) {
      onLogout();
    }
    onClose();
    onNavigate("home");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] overflow-hidden font-sans">
          
          {/* Dark Backdrop with Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs cursor-pointer z-[99998]"
          />

          {/* Slide-out Drawer */}
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none z-[99999]">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 26, stiffness: 280 }}
              className="w-80 sm:w-96 h-screen bg-white shadow-2xl rounded-l-2xl border-l border-slate-200 flex flex-col pointer-events-auto overflow-hidden text-[#0A2540] relative z-[99999]"
            >
              
              {/* Drawer Header: User Avatar, Name, Phone Number, Role Badge */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60 flex-shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex-shrink-0">
                    <img
                      src={avatarUrl}
                      alt={userName}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs"
                      onError={(e) => {
                        e.target.src = DEFAULT_MALE_AVATAR;
                      }}
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full ring-2 ring-white" />
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-[#0A2540] truncate m-0 leading-tight">
                      {userName}
                    </h3>
                    <p className="text-[11px] text-slate-500 truncate m-0 mt-0.5 font-mono">
                      {userPhone}
                    </p>
                    <div className="mt-1">
                      {userRole === "worker" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          <span>Verified Worker</span>
                        </span>
                      ) : userRole === "admin" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-md text-[10px] font-extrabold">
                          <span className="material-symbols-outlined text-[12px]">admin_panel_settings</span>
                          <span>Federation Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[10px] font-bold">
                          <span>Member Customer</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl hover:bg-slate-200/70 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-colors border-none bg-transparent cursor-pointer flex-shrink-0"
                  title="Close Menu"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Drawer Scrollable Links */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 divide-y divide-slate-100 scrollbar-thin">
                
                {/* Section 1: Messages / Chat (Moved into Sidebar) */}
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-1.5">
                    Communications
                  </span>
                  
                  <button
                    type="button"
                    onClick={() => handleNav("messages")}
                    className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all border-none cursor-pointer ${
                      view === "messages"
                        ? "bg-[#075e54] text-white shadow-xs font-bold"
                        : "hover:bg-slate-50 text-[#0A2540] bg-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                        view === "messages" ? "bg-white/20 text-white" : "bg-emerald-50 text-[#00a884]"
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">Messages / Chat</span>
                        <span className={`text-[11px] block ${view === "messages" ? "text-slate-100" : "text-slate-400"}`}>
                          Direct real-time worker chats
                        </span>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse" />
                  </button>
                </div>

                {/* Section 2: Federation & Worker Links */}
                <div className="pt-4 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-1.5">
                    Cooperative Actions
                  </span>

                  {/* Register a Worker */}
                  <button
                    type="button"
                    onClick={() => handleNav("register")}
                    className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all border-none cursor-pointer ${
                      view === "register"
                        ? "bg-[#0A2540] text-white shadow-xs font-bold"
                        : "hover:bg-slate-50 text-[#0A2540] bg-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">Register a Worker</span>
                        <span className={`text-[11px] block ${view === "register" ? "text-slate-200" : "text-slate-400"}`}>
                          Aadhaar e-KYC Onboarding
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  </button>

                  {/* Federation Desk */}
                  <button
                    type="button"
                    onClick={() => handleNav("admin")}
                    className={`w-full px-3 py-2.5 rounded-xl text-left flex items-center justify-between transition-all border-none cursor-pointer ${
                      view === "admin"
                        ? "bg-[#0A2540] text-white shadow-xs font-bold"
                        : "hover:bg-slate-50 text-[#0A2540] bg-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[18px]">gavel</span>
                      </div>
                      <div>
                        <span className="text-xs font-extrabold block">Federation Desk</span>
                        <span className={`text-[11px] block ${view === "admin" ? "text-slate-200" : "text-slate-400"}`}>
                          Governance &amp; Live Operations
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[16px] text-slate-400">chevron_right</span>
                  </button>
                </div>

                {/* Section 3: Platform Preferences */}
                <div className="pt-4 space-y-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-3 block mb-1.5">
                    Preferences
                  </span>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-slate-600">language</span>
                      <div>
                        <span className="text-xs font-bold text-[#0A2540] block">Language / भाषा</span>
                        <span className="text-[11px] text-slate-400 block">Select interface language</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onToggleLanguage}
                      className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 text-xs font-black rounded-lg border border-slate-200 shadow-2xs cursor-pointer transition-colors"
                    >
                      {currentLanguage === "en" ? "🇮🇳 हिन्दी" : "🇬🇧 English"}
                    </button>
                  </div>
                </div>

              </div>

              {/* Drawer Footer: Working Log Out Button */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handlePerformLogout}
                  className="w-full py-2.5 px-3 rounded-xl text-left flex items-center gap-2 text-slate-600 hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors border-none bg-transparent cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-red-500">
                    logout
                  </span>
                  <span>Log Out</span>
                </button>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                  <span>Registered Cooperative MSCS #701</span>
                  <span>v2.4.0</span>
                </div>
              </div>

            </motion.div>
          </div>

        </div>
      )}
    </AnimatePresence>
  );
}
