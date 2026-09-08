import React from "react";
import { useTranslation } from "react-i18next";
export default function StitchNavbar({ view, onNavigate, onToggleLanguage, currentLanguage }) {
  const { t } = useTranslation();

  const userStr = typeof window !== "undefined" ? localStorage.getItem("gigconnect_user") : null;
  const user = userStr ? JSON.parse(userStr) : null;
  const profileUrl = user?.avatar || user?.photoURL ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80";

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-border-tone/40">
      <div className="h-20 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-space-4">
        <div className="flex items-center gap-space-6">
          {/* Logo integrated directly with name */}
          <button
            type="button"
            className="flex items-center bg-transparent border-none cursor-pointer text-left p-0 group"
            onClick={() => onNavigate("home")}
          >
            <div className="flex flex-col">
              <div className="flex items-center font-headline-sm text-headline-sm tracking-tight font-black leading-none select-none">
                <span className="text-secondary-container font-black text-2xl sm:text-[26px] tracking-tight">Gig</span>
                <span className="text-primary font-black text-2xl sm:text-[26px] tracking-tight">Connect</span>
                <span className="w-2.5 h-2.5 rounded-full bg-secondary-container inline-block ml-1 group-hover:scale-125 transition-transform" />
              </div>
              <span className="font-label-sm text-[11px] text-on-surface-variant font-bold tracking-wider uppercase mt-1">
                {t("nav.federationSub", "Sahakari Federation")}
              </span>
            </div>
          </button>
          <nav className="hidden lg:flex items-center gap-space-1">
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className={`px-space-3 py-space-2 font-label-lg text-label-lg transition-colors rounded-lg border-none cursor-pointer ${
                view === "find-help"
                  ? "bg-primary-container text-on-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container bg-transparent"
              }`}
            >
              {t("nav.findHelp", "Find Help")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("booking")}
              className={`px-space-3 py-space-2 font-label-lg text-label-lg transition-colors rounded-lg border-none cursor-pointer ${
                view === "booking" || view === "detail"
                  ? "bg-primary-container text-on-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container bg-transparent"
              }`}
            >
              {t("nav.myBookings", "My Bookings")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("messages")}
              className={`px-space-3 py-space-2 font-label-lg text-label-lg transition-colors rounded-lg border-none cursor-pointer flex items-center gap-1.5 ${
                view === "messages"
                  ? "bg-[#075e54] text-white font-bold shadow-xs"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container bg-transparent"
              }`}
            >
              <span className={`material-symbols-outlined text-[18px] ${view === "messages" ? "text-white" : "text-[#00a884]"}`}>
                chat
              </span>
              <span>Messages</span>
              <span className="w-2 h-2 rounded-full bg-[#00a884] animate-pulse ml-0.5" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("register")}
              className={`px-space-3 py-space-2 font-label-lg text-label-lg transition-colors rounded-lg border-none cursor-pointer ${
                view === "register"
                  ? "bg-primary-container text-on-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container bg-transparent"
              }`}
            >
              {t("nav.registerWorker", "Register a Worker")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className={`px-space-3 py-space-2 font-label-lg text-label-lg transition-colors rounded-lg border-none cursor-pointer ${
                view === "admin"
                  ? "bg-primary-container text-on-primary font-bold"
                  : "text-on-surface-variant hover:text-on-surface hover:bg-surface-container bg-transparent"
              }`}
            >
              {t("nav.federationDesk", "Federation Desk")}
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-space-2 sm:gap-space-3">
          {/* Quick Messages Icon Button -> opens WhatsApp chat */}
          <button
            type="button"
            onClick={() => onNavigate("messages")}
            title="Messages (WhatsApp Real-Time Worker Chat)"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border-none cursor-pointer relative ${
              view === "messages"
                ? "bg-[#00a884] text-white shadow-sm"
                : "bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-[#00a884]"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">chat</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00a884] rounded-full ring-2 ring-surface animate-ping" />
          </button>

          {/* Quick Saved/Bookmarks Icon Button */}
          <button
            type="button"
            onClick={() => onNavigate("booking")}
            title="Saved Workers"
            className="w-9 h-9 rounded-full bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-primary flex items-center justify-center transition-colors border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[19px]">bookmark_border</span>
          </button>

          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-space-1 px-space-3 py-1 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-surface-container transition-colors border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">language</span>
            <span className="hidden sm:inline">{t("nav.langToggle", currentLanguage === "en" ? "🇮🇳 हिन्दी / EN" : "🇬🇧 English / हि")}</span>
            <span className="sm:hidden">{currentLanguage === "en" ? "हि" : "EN"}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("public-register")}
            className="hidden md:inline-flex items-center justify-center px-space-4 py-space-2 bg-secondary-container text-on-secondary font-label-lg text-label-lg rounded-full shadow-[0_4px_14px_rgba(253,101,30,0.3)] hover:opacity-95 active:scale-95 transition-all font-bold border-none cursor-pointer"
          >
            {t("nav.joinGigConnect", "Join GigConnect")}
          </button>
          <div className="relative flex items-center justify-center cursor-pointer" onClick={() => onNavigate("auth")} title="Account & Profile">
            <img alt="Profile" className="w-8 h-8 rounded-full object-cover ring-2 ring-secondary-container/40" src={profileUrl} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-on-tertiary-container rounded-full ring-2 ring-surface" />
          </div>
        </div>
      </div>
    </header>
  );
}
