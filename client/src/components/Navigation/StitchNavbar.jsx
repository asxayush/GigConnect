import React from "react";
import { useTranslation } from "react-i18next";
import Logo from "../Logo/Logo";

export default function StitchNavbar({ view, onNavigate, onToggleLanguage, currentLanguage }) {
  const { t } = useTranslation();

  const profileUrl =
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBN3GPfPHmPQDg3u3NeFCZquez1FNTshUAeAUMRWWtPa_Y8NoQIABWs4OH7DjCdA_2cZaDckDNd9I0YJdVGuyjyuSr0tJJQItp9jONKHwM5OOk7ideaVXscKX4NOKh1VBF06h7cETmYh3ZJ0JvIMK8vaQk-KaK4QOGHuftDvawR9qPi6fHMsuTQbChN-s2plPKntwKTzDm2gy9cw8ZCBBWqlkFwUHMxhp9-fAD_vvAWCrl_qXj-8_Sa";

  return (
    <header className="sticky top-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-border-tone/40">
      <div className="h-20 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-space-4">
        <div className="flex items-center gap-space-6">
          <button
            type="button"
            className="flex items-center gap-space-3 bg-transparent border-none cursor-pointer text-left p-0"
            onClick={() => onNavigate("home")}
          >
            <Logo size={32} />
            <div className="flex flex-col">
              <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">GigConnect</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant leading-none -mt-1 font-semibold">
                Sahakari Federation
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
              Find Help
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
              My Bookings
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
              Register a Worker
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
              Federation Desk
            </button>
          </nav>
        </div>
        <div className="flex items-center gap-space-3">
          <button
            type="button"
            onClick={onToggleLanguage}
            className="flex items-center gap-space-1 px-space-3 py-1 bg-surface-container-low text-on-surface font-label-md text-label-md rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:bg-surface-container transition-colors border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">language</span>
            <span>{currentLanguage === "en" ? "🇮🇳 हिन्दी / EN" : "🇬🇧 English / हि"}</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate("public-register")}
            className="hidden sm:inline-flex items-center justify-center px-space-4 py-space-2 bg-secondary-container text-on-secondary font-label-lg text-label-lg rounded-full shadow-[0_4px_14px_rgba(253,101,30,0.3)] hover:opacity-95 active:scale-95 transition-all font-bold border-none cursor-pointer"
          >
            Join GigConnect
          </button>
          <div className="relative flex items-center justify-center cursor-pointer" onClick={() => onNavigate("auth")}>
            <img alt="Profile" className="w-8 h-8 rounded-full object-cover" src={profileUrl} />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-on-tertiary-container rounded-full ring-2 ring-surface" />
          </div>
        </div>
      </div>
    </header>
  );
}
