import React from "react";
import Logo from "../Logo/Logo";

export default function StitchFooter({ onNavigate }) {
  return (
    <footer className="w-full bg-inverse-surface text-inverse-on-surface pt-space-12 pb-space-8 mt-auto">
      <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="flex flex-wrap items-center justify-between gap-space-4 pb-space-8 mb-space-8 border-b border-surface-container-lowest/10">
          <div className="flex items-center gap-space-3">
            <Logo size={32} />
            <span className="font-headline-sm text-headline-sm text-inverse-on-surface font-bold">
              GigConnect Cooperative
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
            <span className="font-title-md text-title-md text-inverse-on-surface font-semibold">Discover</span>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Find Help
            </button>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Services by City
            </button>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              All Services
            </button>
            <button
              type="button"
              onClick={() => onNavigate("register")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Register as Worker
            </button>
            <button
              type="button"
              onClick={() => onNavigate("find-help")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Cost Guides
            </button>
          </div>

          {/* Col 2 */}
          <div className="flex flex-col gap-space-3">
            <span className="font-title-md text-title-md text-inverse-on-surface font-semibold">Company</span>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              About Us
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Federation Desk
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Cooperative Model
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Careers
            </button>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="text-left bg-transparent border-none p-0 font-body-md text-body-md text-inverse-on-surface/75 hover:text-inverse-on-surface transition-colors cursor-pointer"
            >
              Terms &amp; Privacy
            </button>
          </div>

          {/* Col 3 */}
          <div className="flex flex-col gap-space-4">
            <span className="font-title-md text-title-md text-inverse-on-surface font-semibold">Download our app</span>
            <p className="font-body-sm text-body-sm text-inverse-on-surface/70 m-0">
              Empowering domestic and household workers with democratic platform ownership and social security.
            </p>
            <div className="flex flex-wrap gap-space-3">
              <div className="flex items-center gap-space-2 px-space-3 py-space-2 bg-surface-container-lowest/10 rounded-xl hover:bg-surface-container-lowest/15 cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-[24px]">install_mobile</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-inverse-on-surface/60 leading-none">Download on</span>
                  <span className="font-label-md text-label-md text-inverse-on-surface font-bold leading-tight">Google Play</span>
                </div>
              </div>
              <div className="flex items-center gap-space-2 px-space-3 py-space-2 bg-surface-container-lowest/10 rounded-xl hover:bg-surface-container-lowest/15 cursor-pointer transition-colors">
                <span className="material-symbols-outlined text-[24px]">phone_iphone</span>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-inverse-on-surface/60 leading-none">Download on</span>
                  <span className="font-label-md text-label-md text-inverse-on-surface font-bold leading-tight">App Store</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-space-3 pt-space-2">
              <div className="p-space-2 bg-surface-container-lowest rounded-lg flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[32px]">qr_code_2</span>
              </div>
              <div className="flex items-center gap-space-2 text-on-tertiary-container">
                <span className="material-symbols-outlined text-[20px]">verified</span>
                <span className="font-label-sm text-label-sm text-inverse-on-surface font-medium leading-snug">
                  100% Aadhaar &amp; Cooperative Verified Guarantee
                </span>
              </div>
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
