import React from "react";
import { useTranslation } from "react-i18next";
import Logo from "../Logo/Logo";

export default function StitchFooter({ onNavigate }) {
  const { t } = useTranslation();
  return (
    <footer className="w-full bg-inverse-surface text-inverse-on-surface pt-space-12 pb-space-8 mt-auto">
      <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-wrap items-center justify-between gap-space-4 pb-space-8 mb-space-8 border-b border-surface-container-lowest/10">
          <div className="flex items-center gap-space-3">
            <Logo size={32} />
            <span className="font-headline-sm text-headline-sm text-inverse-on-surface font-bold">
              {t("footer.brand", "GigConnect Cooperative")}
            </span>
          </div>
          <div className="flex items-center gap-space-4">
            {["share", "public", "campaign", "forum"].map((icon) => (
              <button
                key={icon}
                type="button"
                className="w-10 h-10 rounded-full bg-surface-container-lowest/10 flex items-center justify-center text-secondary-container hover:bg-secondary-container hover:text-on-secondary transition-all border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-8 pb-space-12">
          {/* Col 1 */}
          <div className="flex flex-col gap-space-3">
            <span className="font-title-md text-title-md text-inverse-on-surface font-semibold">{t("footer.discover", "Discover")}</span>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("nav.findHelp", "Find Help")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("footer.servicesByCity", "Services by City")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("footer.allServices", "All Services")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("register")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("nav.registerWorker", "Register a Worker")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("footer.costGuides", "Cost Guides")}
            </button>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-space-3">
            <span className="font-title-md text-title-md text-inverse-on-surface font-semibold">{t("footer.company", "Company")}</span>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("footer.aboutUs", "About Us")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("nav.federationDesk", "Federation Desk")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("footer.cooperativeModel", "Cooperative Model")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              {t("footer.careers", "Careers")}
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Terms &amp; Privacy
            </button>
          </div>

          {/* Col 3: Cooperative Web Guarantee */}
          <div className="flex flex-col gap-space-4">
            <span className="font-title-md text-title-md text-inverse-on-surface font-semibold">Web-First Cooperative Federation</span>
            <p className="font-body-sm text-body-sm text-inverse-on-surface/70 m-0">
              Access trusted cooperative household services instantly on any mobile or desktop browser. No app install required.
            </p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2.5 text-xs text-inverse-on-surface/80 bg-surface-container-lowest/10 p-3 rounded-xl">
                <span className="material-symbols-outlined text-[20px] text-green-400 flex-shrink-0">verified</span>
                <span>100% Aadhaar &amp; Biometric Verified Guild Members</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-inverse-on-surface/80 bg-surface-container-lowest/10 p-3 rounded-xl">
                <span className="material-symbols-outlined text-[20px] text-amber-400 flex-shrink-0">savings</span>
                <span>Direct UPI / Jan Dhan payouts — 0% unfair middleman cuts</span>
              </div>
            </div>
            <div className="flex items-center gap-space-2 text-on-tertiary-container pt-1">
              <span className="material-symbols-outlined text-[18px] text-tertiary-fixed-dim">support_agent</span>
              <span className="font-label-sm text-label-sm text-inverse-on-surface/80">
                24x7 Sahayata Helpline: 1800-GIG-COOP
              </span>
            </div>
          </div>
        </div>

        <div className="pt-space-6 flex flex-col md:flex-row items-center justify-between gap-space-4 border-t border-surface-container-lowest/10">
          <p className="font-body-sm text-body-sm text-inverse-on-surface/60 text-center md:text-left m-0">
            © 2025 GigConnect Cooperative Federation of India. All rights reserved. Registered under the Multi-State Co-operative Societies Act.
          </p>
          <div className="flex items-center gap-space-4 font-label-sm text-label-sm text-inverse-on-surface/60">
            <span className="flex items-center gap-space-1">
              <span className="material-symbols-outlined text-[14px] text-tertiary-fixed-dim">shield</span>
              Sahakari Samiti Certified
            </span>
            <span>Govt. Reg #MSCS/CR/2024</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
