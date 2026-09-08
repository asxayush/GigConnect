import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ProfileDrawer from "../ProfileDrawer";

export default function StitchNavbar({
  view,
  onNavigate,
  onToggleLanguage,
  currentLanguage,
}) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const userStr = typeof window !== "undefined" ? localStorage.getItem("gigconnect_user") : null;
  let user = null;
  try {
    if (userStr) user = JSON.parse(userStr);
  } catch (e) {}

  const profileUrl =
    user?.avatar ||
    user?.photoURL ||
    "/illustrations/electrician.jpg";

  return (
    <>
      <header className="sticky top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-xs border-b border-slate-200/80 font-sans">
        <div className="h-18 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* ================= LEFT: GIGCONNECT LOGO ================= */}
          <div className="flex items-center">
            <button
              type="button"
              className="flex items-center bg-transparent border-none cursor-pointer text-left p-0 group"
              onClick={() => onNavigate("home")}
            >
              <div className="flex flex-col">
                <div className="flex items-center tracking-tight font-black leading-none select-none">
                  <span className="text-[#ea580c] font-black text-2xl sm:text-[26px] tracking-tight">
                    Gig
                  </span>
                  <span className="text-[#0A2540] font-black text-2xl sm:text-[26px] tracking-tight">
                    Connect
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c] inline-block ml-1 group-hover:scale-125 transition-transform" />
                </div>
                <span className="text-[10px] text-slate-400 font-extrabold tracking-wider uppercase mt-1">
                  Sahakari Federation • Delhi NCR
                </span>
              </div>
            </button>
          </div>

          {/* ================= CENTER: ESSENTIALS ONLY (Find Help & Messages) ================= */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                view === "find-help"
                  ? "bg-[#0A2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 bg-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">search</span>
              <span>{t("nav.findHelp", "Find Help")}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("messages")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 relative ${
                view === "messages"
                  ? "bg-[#075e54] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 bg-transparent"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${view === "messages" ? "text-white" : "text-[#00a884]"}`}>
                chat
              </span>
              <span>Messages</span>
              {/* Active notification pulse dot */}
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse ml-0.5" />
            </button>
          </nav>

          {/* ================= RIGHT: JOIN BUTTON & PROFILE AVATAR ================= */}
          <div className="flex items-center gap-3">
            
            {/* Quick Messages button on mobile */}
            <button
              type="button"
              onClick={() => onNavigate("messages")}
              title="Messages"
              className={`md:hidden w-10 h-10 rounded-xl flex items-center justify-center transition-colors border border-slate-200 cursor-pointer relative ${
                view === "messages" ? "bg-[#075e54] text-white" : "bg-slate-50 text-slate-700"
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">chat</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#00a884] rounded-full ring-2 ring-white animate-pulse" />
            </button>

            {/* Join GigConnect CTA */}
            <button
              type="button"
              onClick={() => onNavigate("public-register")}
              className="hidden sm:inline-flex items-center justify-center px-4 py-2 bg-[#ea580c] hover:bg-[#c2410c] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all border-none cursor-pointer active:scale-95"
            >
              {t("nav.joinGigConnect", "Join GigConnect")}
            </button>

            {/* Profile Avatar Trigger (Opens Slide-out Drawer) */}
            <div
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs group"
              title="Open Account Menu & Guild Hub"
            >
              <div className="relative flex-shrink-0">
                <img
                  alt="Profile"
                  className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                  src={profileUrl}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
                  }}
                />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1.5 ring-white" />
              </div>

              <div className="hidden lg:flex flex-col text-left">
                <span className="text-[11px] font-bold text-[#0A2540] leading-none">
                  {user?.name || "Ramesh K."}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  Menu &amp; Hub
                </span>
              </div>

              <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-slate-700 transition-colors">
                menu
              </span>
            </div>

          </div>

        </div>
      </header>

      {/* ================= PART 2: PROFILE DRAWER MODAL ================= */}
      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        view={view}
        onNavigate={onNavigate}
        onToggleLanguage={onToggleLanguage}
        currentLanguage={currentLanguage}
      />
    </>
  );
}
