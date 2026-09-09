import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function LegalModal({
  isOpen,
  onClose,
  onAgree,
  initialTab = "terms", // 'terms' | 'privacy'
}) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  const handleAgree = () => {
    if (onAgree) onAgree(activeTab);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[82vh] flex flex-col overflow-hidden border border-slate-200 text-slate-900"
        >
          {/* Header */}
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[18px]">verified_user</span>
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 m-0 leading-tight">
                  Cooperative Governance &amp; Compliance
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  Multi-State Co-operative Societies Act &amp; DPDP Act, 2023
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-200/70 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors border-none cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Document Tabs */}
          <div className="flex border-b border-slate-200 px-5 pt-2 bg-white gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("terms")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
                activeTab === "terms"
                  ? "border-slate-900 text-slate-900 font-black"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Terms &amp; Conditions (Cooperative Charter)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("privacy")}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer bg-transparent border-none ${
                activeTab === "privacy"
                  ? "border-slate-900 text-slate-900 font-black"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              Privacy Policy (DPDP Act, 2023)
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed font-sans scrollbar-thin">
            {activeTab === "terms" ? (
              <>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-medium">
                  <strong>🌿 Zero-Commission Charter:</strong> GigConnect is operated on behalf of registered gig workers under the Ministry of Cooperation. 95% of customer payments are disbursed directly to workers with 5% allocated to the Mutual Welfare &amp; Insurance Fund.
                </div>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    1. Direct Ownership &amp; Fair Floor Wages
                  </h4>
                  <p>
                    Every member worker admitted to the GigConnect Federation holds collective ownership privileges. Tariff rates are established transparently by regional guild councils with zero algorithmic wage suppression, zero surge deductions, and zero shadow penalties.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    2. Social Security &amp; Group Life Insurance
                  </h4>
                  <p>
                    To ensure dignified livelihood protection, all active members must be linked to statutory accidental/life protection under e-Shram / Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY) or opt into the Sahakari Mutual Life Endowment (₹436/year deducted in micro-installments from cooperative payouts).
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    3. Escrow Security &amp; Doorstep Handshake
                  </h4>
                  <p>
                    Customer fees are locked into Escrow Trust upon assignment. Work initiates only after the customer shares the 4-digit OTP at the doorstep. Completed gigs are settled instantly upon completion without payout holding periods.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    4. Democratic Peer Mediation (No Algorithmic Deactivations)
                  </h4>
                  <p>
                    Workers are never subject to automated algorithmic termination. Any client dispute is adjudicated by a 2-person Ward Mediation Bench comprising one consumer delegate and one veteran tradesperson steward.
                  </p>
                </section>
              </>
            ) : (
              <>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 font-medium">
                  <strong>🔒 Digital Personal Data Protection (DPDP) Act, 2023 Compliance:</strong> GigConnect maintains strict data fiduciary standards, local Indian server residency, biometric masking, and granular data principal consent.
                </div>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    1. Aadhaar Number Masking &amp; Minimal Retention
                  </h4>
                  <p>
                    In strict compliance with UIDAI circulars and the DPDP Act 2023, full 12-digit Aadhaar numbers are <strong>never stored</strong> in our persistent databases. Only masked strings displaying the last 4 digits (e.g. <code>XXXX-XXXX-4928</code>) are retained for identification.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    2. Strict Domestic Data Localization
                  </h4>
                  <p>
                    All identity artifacts, facial match confidence scores, and geolocation coordinate logs reside on secure server infrastructure located strictly within the territory of the Republic of India. No worker data is transferred across borders.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    3. Purpose Limitation &amp; Biometrics Security
                  </h4>
                  <p>
                    Live selfie biometrics are utilized solely for one-time face-match authentication against the submitted photo ID. Biometric vector data is purged immediately after credential evaluation and never monetized or shared with third-party advertising brokers.
                  </p>
                </section>

                <section>
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-1">
                    4. Right to Correction, Summary &amp; Erasure
                  </h4>
                  <p>
                    Under Section 12 of the DPDP Act 2023, every cooperative member possesses the statutory right to access, rectify, or request complete erasure (Right to Be Forgotten) of their profile data upon account closure, subject to statutory cooperative audit requirements.
                  </p>
                </section>
              </>
            )}
          </div>

          {/* Sticky Footer */}
          <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 font-medium">
              By clicking "I Agree", you confirm your digital signature and consent.
            </span>
            <button
              type="button"
              onClick={handleAgree}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-all border-none cursor-pointer active:scale-95 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">check_circle</span>
              <span>I Agree &amp; Accept</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
