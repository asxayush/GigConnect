import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ProfileDrawer from "../ProfileDrawer";

export default function StitchNavbar({
  view,
  onNavigate,
  onToggleLanguage,
  currentLanguage,
  user,
  onLogout,
}) {
  const { t } = useTranslation();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fallback avatar resolution
  const profileUrl =
    user?.avatar ||
    user?.photoURL ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";

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

          {/* ================= CENTER: NAVIGATION LINKS (Find Help, My Bookings, Tool Bank) ================= */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-2">
            {/* 1. Find Help */}
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

            {/* 2. My Bookings */}
            <button
              type="button"
              onClick={() => onNavigate("booking")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                view === "booking" || view === "active-booking" || view === "detail"
                  ? "bg-[#0A2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 bg-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>{t("nav.myBookings", "My Bookings")}</span>
            </button>

            {/* 3. Tool Bank */}
            <button
              type="button"
              onClick={() => onNavigate("tool-bank")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                view === "tool-bank"
                  ? "bg-[#0A2540] text-white shadow-xs"
                  : "text-slate-600 hover:text-[#0A2540] hover:bg-slate-100 bg-transparent"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">construction</span>
              <span>Tool Bank</span>
              <span className="px-1.5 py-0.5 bg-orange-100 text-[#ea580c] text-[10px] font-extrabold rounded-md ml-0.5">
                0% Fee
              </span>
            </button>
          </nav>

          {/* ================= RIGHT: AUTH STATE (Join Button vs Avatar Only) ================= */}
          <div className="flex items-center gap-3">
            
            {!user ? (
              /* Logged Out State: Prominent Join Button */
              <button
                type="button"
                onClick={() => onNavigate("auth")}
                className="inline-flex items-center justify-center px-5 py-2.5 bg-[#0A2540] hover:bg-[#081d33] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition-all border-none cursor-pointer active:scale-95 gap-1.5"
              >
                <span>{t("nav.joinGigConnect", "Join GigConnect")}</span>
                <span className="material-symbols-outlined text-base">login</span>
              </button>
            ) : (
              /* Logged In State: ONLY User's Profile Avatar (Opens Profile Drawer) */
              <div
                onClick={() => setIsDrawerOpen(true)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50/80 hover:bg-slate-100 cursor-pointer transition-all shadow-2xs group select-none"
                title="Open Profile Menu & Preferences"
              >
                <div className="relative flex-shrink-0">
                  <img
                    alt={user?.name || "Profile"}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-200"
                    src={profileUrl}
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";
                    }}
                  />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-1.5 ring-white" />
                </div>

                <div className="hidden lg:flex flex-col text-left pr-1">
                  <span className="text-[11px] font-bold text-[#0A2540] leading-none truncate max-w-[100px]">
                    {user?.name || "Member"}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                    {user?.role || "Customer"}
                  </span>
                </div>

                <span className="material-symbols-outlined text-[18px] text-slate-400 group-hover:text-slate-700 transition-colors">
                  expand_more
                </span>
              </div>
            )}

          </div>

        </div>
      </header>

      {/* ================= PROFILE DRAWER MODAL ================= */}
      <ProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        view={view}
        onNavigate={onNavigate}
        onToggleLanguage={onToggleLanguage}
        currentLanguage={currentLanguage}
        user={user}
        onLogout={() => {
          setIsDrawerOpen(false);
          if (onLogout) onLogout();
        }}
      />
    </>
  );
}
