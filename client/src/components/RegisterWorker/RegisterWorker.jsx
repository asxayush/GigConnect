import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function RegisterWorker({ onNavigate }) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(3);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("ocr");

  // Editable OCR extracted fields
  const [workerData, setWorkerData] = useState({
    fullName: "Rameshwar Prasad Verma",
    phone: "+91 98110 49281",
    trade: "Master Electrician & Wireman",
    territory: "South Delhi & Noida (Radius: 12 km)",
    aadhaarMasked: "XXXX - XXXX - 4928",
    dob: "14 / 08 / 1986 (39 Years)",
    address: "H-24, Gandhi Nagar, East Delhi, New Delhi - 110031",
  });

  const [editingField, setEditingField] = useState(null);

  const handleSaveAndContinue = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setCurrentStep(4);
    }, 1200);
  };

  const handleFieldChange = (field, value) => {
    setWorkerData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen">
      <div className="flex flex-col w-full relative overflow-hidden">
        {/* Ambient decorative background glows */}
        <div className="pointer-events-none absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl -z-10" />
        <div className="pointer-events-none absolute top-1/4 right-0 w-[500px] h-[500px] rounded-full bg-surface-container/60 blur-[100px] -z-10" />

        <section className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-8 w-full">
          {/* Header */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-space-8">
            <div className="inline-flex items-center gap-space-2 px-space-3 py-space-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md uppercase tracking-wider mb-space-3 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary-container">assignment_ind</span>
              <span>Worker Membership Portal</span>
            </div>
            <h1 className="font-display text-headline-lg md:text-display text-primary tracking-tight mb-space-3 m-0 font-extrabold">
              Join the Cooperative. <span className="text-secondary-container">Own Your Future.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl m-0">
              Zero commission, guaranteed fair minimum wages, comprehensive medical coverage, and equal democratic voting rights for every verified tradesperson.
            </p>
          </div>

          {/* Stepper Indicator */}
          <div className="max-w-3xl mx-auto mb-space-12 px-space-2">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-surface-container-high rounded-full -z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-container rounded-full -z-0 transition-all duration-500"
                style={{ width: currentStep === 4 ? "100%" : "66%" }}
              />

              {/* Step 1 */}
              <div className="flex flex-col items-center gap-space-2 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold hidden sm:inline-block">
                  Personal Info
                </span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center gap-space-2 relative z-10">
                <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shadow-md">
                  <span className="material-symbols-outlined text-[20px]">check</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold hidden sm:inline-block">
                  Trade &amp; Exp
                </span>
              </div>

              {/* Step 3 (Active) */}
              <div className="flex flex-col items-center gap-space-2 relative z-10">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest text-primary-container ring-4 ring-primary-container flex items-center justify-center relative shadow-lg">
                  <span className="material-symbols-outlined text-[20px] text-primary-container">fingerprint</span>
                  <span className="absolute top-0 right-0 w-3 h-3 bg-secondary-container rounded-full animate-ping" />
                  <span className="absolute top-0 right-0 w-3 h-3 bg-secondary-container rounded-full" />
                </div>
                <span className="font-label-md text-label-md text-secondary font-bold tracking-tight">
                  Aadhaar e-KYC
                </span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center gap-space-2 relative z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                    currentStep === 4
                      ? "bg-primary-container text-on-primary shadow-md"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface-variant hidden sm:inline-block">
                  Review &amp; Submit
                </span>
              </div>
            </div>
          </div>

          {/* Main Registration Shell Card */}
          <div className="relative max-w-4xl mx-auto rounded-xl bg-surface-container-lowest p-space-6 md:p-space-8 shadow-xl border border-border-tone/30">
            {/* Ambient underlying form showing completed entries */}
            <div className="opacity-40 pointer-events-none filter blur-[1px] select-none">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-space-4 font-bold">
                Membership Credentials Record
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block">Full Legal Name</label>
                  <input
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-lg text-on-surface font-body-md border-none"
                    readOnly
                    type="text"
                    value={workerData.fullName}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block">Mobile Number (Aadhaar Linked)</label>
                  <input
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-lg text-on-surface font-body-md border-none"
                    readOnly
                    type="text"
                    value={workerData.phone}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block">Primary Skilled Service</label>
                  <input
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-lg text-on-surface font-body-md border-none"
                    readOnly
                    type="text"
                    value={workerData.trade}
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block">Active Service Territory</label>
                  <input
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-lg text-on-surface font-body-md border-none"
                    readOnly
                    type="text"
                    value={workerData.territory}
                  />
                </div>
              </div>
            </div>

            {/* In-Page Aadhaar Biometric Modal Layer */}
            <div className="relative md:-mt-48 mt-space-4 z-20 rounded-xl bg-surface-container-lowest shadow-2xl p-space-6 md:p-space-8 border border-border-tone/40">
              {/* Modal Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-space-3 pb-space-4 mb-space-6 bg-surface-container-low/50 -mx-space-6 md:-mx-space-8 -mt-space-6 md:-mt-space-8 p-space-6 rounded-t-xl border-b border-border-tone/30">
                <div className="flex items-center gap-space-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-2">
                      <h2 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                        Aadhaar Biometric Verification
                      </h2>
                      <span className="inline-flex items-center gap-space-1 px-space-2 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm font-bold">
                        <span className="material-symbols-outlined text-[14px]">format_image_left</span>
                        Govt Approved UIDAI
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                      Instant encrypted demographic e-KYC sync via National Data Exchange
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-space-2">
                  <span className="material-symbols-outlined text-outline-variant">lock</span>
                  <span className="font-label-sm text-label-sm text-outline">256-Bit Encrypted</span>
                </div>
              </div>

              {/* Verification Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 mb-space-8">
                {/* Left Column: Document Upload & Live Face Match */}
                <div className="lg:col-span-5 flex flex-col gap-space-4">
                  {/* Document Scan Drop Area */}
                  <div className="bg-surface-container-low rounded-xl p-space-4 flex flex-col items-center justify-center text-center relative overflow-hidden group border border-border-tone/30">
                    <div className="w-full flex items-center justify-between mb-space-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px] text-primary-container">id_card</span> Front &amp; Back Card
                      </span>
                      <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary/10 px-space-2 py-0.5 rounded font-bold">
                        Scanned 100%
                      </span>
                    </div>
                    <div className="w-full aspect-[16/9] rounded-lg overflow-hidden relative shadow-inner bg-surface-dim/40">
                      <img
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUL5v-yUIlb0Rlz0bJI6kMuECyBeAG2a84Z93BpYPV_J7A2t94YUcdWzUdbq4eE9h1PVh3ocq21W1x0gp81aAIB4AXF0TpIYbBKnPOFt0iNM7c4MwUD_yYqvnJ0A-HQyC74aR4vAuONyN1ngTrxORW1j9O8x01LhOgqF_REzwShlMJArS4NfnouPXmOzSH0U5QRoWp7RwNzVUkWIBSVuYPrL2H_PFr5LJnxg_OuowkcZVcv-Jw1xtd"
                        alt="Aadhaar Card"
                      />
                      <div className="absolute inset-0 bg-primary/20 backdrop-blur-[0.5px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="px-space-3 py-space-1.5 bg-surface-container-lowest text-primary rounded-full font-label-md text-label-md shadow-md hover:bg-surface-container transition-all border-none cursor-pointer font-bold"
                        >
                          Replace Card
                        </button>
                      </div>
                    </div>
                    <div className="w-full flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm mt-space-2">
                      <span>UIDAI_EKYC_20250492.pdf</span>
                      <span className="text-tertiary-container font-semibold">Checksum Valid</span>
                    </div>
                  </div>

                  {/* Face Match Live Feed Preview */}
                  <div className="bg-surface-container-low rounded-xl p-space-4 flex flex-col gap-space-3 border border-border-tone/30">
                    <div className="flex items-center justify-between">
                      <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px] text-primary-container">camera_front</span> Live Liveness Check
                      </span>
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-space-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-full">
                        <span className="material-symbols-outlined text-[14px]">done_all</span> Match 98.4%
                      </span>
                    </div>
                    <div className="flex items-center gap-space-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden shadow-md flex-shrink-0 relative">
                        <img
                          className="w-full h-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfqa8prMKZvypEUqtr1D7eQ9a1Td5_KFrk1fbOa8FGnteNmQD91Y-anVaRJysvBO7rJvo_M5TbDH72ORYZYmSk3IYXlD8P-XbquGuK183g73KuZcI9KtCpcuspy1WEocEDVmS4aRJ0HLXCaPmyYdzBA_JOz1TXfmR4lndiPXNO8VMtWjOtRdI4GGGjrRPvTSGBcSJZVOlU7SSRWjQErPocyFsuls944E3UXGXE7m2CLf0Aj_9MWlaD"
                          alt="Rameshwar Prasad Verma"
                        />
                        <span className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-tertiary-container rounded-full ring-2 ring-surface-container-lowest" />
                      </div>
                      <div className="flex flex-col gap-1 text-on-surface">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                          Biometric Liveness
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium">Blink &amp; Micro-nod Confirmed</span>
                        <span className="font-label-sm text-label-sm text-outline">Timestamp: Just now via Geo-tag</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: OCR Auto-Populated Data */}
                <div className="lg:col-span-7 flex flex-col justify-between bg-surface-container-low rounded-xl p-space-5 border border-border-tone/30">
                  <div>
                    <div className="flex items-center justify-between pb-space-3 mb-space-3 border-b border-border-tone/30">
                      <div className="flex items-center gap-space-2">
                        <span className="material-symbols-outlined text-secondary text-[20px]">document_scanner</span>
                        <span className="font-title-md text-title-md text-primary font-bold">OCR Auto-Extracted Data</span>
                      </div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Tap field to edit</span>
                    </div>

                    <div className="space-y-space-3">
                      {/* Aadhaar Number */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-lg shadow-sm flex items-center justify-between border border-border-tone/20">
                        <div className="flex flex-col flex-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Aadhaar Identity Number</span>
                          {editingField === "aadhaar" ? (
                            <input
                              type="text"
                              className="font-headline-sm text-headline-sm text-primary tracking-widest font-mono bg-transparent border-b border-primary focus:outline-none"
                              value={workerData.aadhaarMasked}
                              onChange={(e) => handleFieldChange("aadhaarMasked", e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className="font-headline-sm text-headline-sm text-primary tracking-widest font-mono font-bold">
                              {workerData.aadhaarMasked}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "aadhaar" ? null : "aadhaar")}
                          className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Aadhaar Number"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>

                      {/* Name */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-lg shadow-sm flex items-center justify-between border border-border-tone/20">
                        <div className="flex flex-col flex-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Legal Full Name (as per UIDAI)</span>
                          {editingField === "fullName" ? (
                            <input
                              type="text"
                              className="font-body-lg text-body-lg text-on-surface font-semibold bg-transparent border-b border-primary focus:outline-none"
                              value={workerData.fullName}
                              onChange={(e) => handleFieldChange("fullName", e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className="font-body-lg text-body-lg text-on-surface font-semibold">
                              {workerData.fullName}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "fullName" ? null : "fullName")}
                          className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Full Name"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>

                      {/* DOB */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-lg shadow-sm flex items-center justify-between border border-border-tone/20">
                        <div className="flex flex-col flex-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Date of Birth / Age</span>
                          {editingField === "dob" ? (
                            <input
                              type="text"
                              className="font-body-md text-body-md text-on-surface font-medium bg-transparent border-b border-primary focus:outline-none"
                              value={workerData.dob}
                              onChange={(e) => handleFieldChange("dob", e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className="font-body-md text-body-md text-on-surface font-medium">
                              {workerData.dob}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "dob" ? null : "dob")}
                          className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Date of Birth"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>

                      {/* Address */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-lg shadow-sm flex items-center justify-between border border-border-tone/20">
                        <div className="flex flex-col flex-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Permanent Registered Address</span>
                          {editingField === "address" ? (
                            <input
                              type="text"
                              className="font-body-md text-body-md text-on-surface font-medium bg-transparent border-b border-primary focus:outline-none"
                              value={workerData.address}
                              onChange={(e) => handleFieldChange("address", e.target.value)}
                              onBlur={() => setEditingField(null)}
                              autoFocus
                            />
                          ) : (
                            <span className="font-body-md text-body-md text-on-surface font-medium">
                              {workerData.address}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "address" ? null : "address")}
                          className="w-8 h-8 rounded-full bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Address"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Prominent Verification Status Pill */}
                  <div className="mt-space-4 pt-space-3 flex items-center justify-between flex-wrap gap-space-2 border-t border-border-tone/30">
                    <div className="inline-flex items-center gap-space-2 px-space-4 py-space-2 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-bold shadow-sm">
                      <span className="material-symbols-outlined text-[20px]">verified</span>
                      <span className="font-label-lg text-label-lg">Verified ✓ UIDAI e-Sign Ready</span>
                    </div>
                    <div className="flex items-center gap-space-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[14px]">info</span>
                      <span>Cooperative Unit #DL-204</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Action Footer Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-4 pt-space-4 border-t border-border-tone/30">
                <button
                  type="button"
                  onClick={() => {
                    setIsSuccess(false);
                    setCurrentStep(3);
                  }}
                  className="w-full sm:w-auto px-space-6 py-space-3 rounded-full text-primary-container font-label-lg text-label-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-space-2 bg-transparent border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">restart_alt</span>
                  <span>Cancel / Re-upload Docs</span>
                </button>
                <div className="flex items-center gap-space-3 w-full sm:w-auto">
                  <button
                    type="button"
                    id="saveStepBtn"
                    onClick={handleSaveAndContinue}
                    disabled={isSubmitting}
                    className={`w-full sm:w-auto px-space-8 py-space-3 rounded-full font-label-lg text-label-lg shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-space-2 border-none cursor-pointer font-bold ${
                      isSuccess
                        ? "bg-tertiary-container text-on-tertiary"
                        : "bg-secondary-container text-on-secondary"
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        <span>Validating UIDAI OTP...</span>
                      </>
                    ) : isSuccess ? (
                      <>
                        <span className="material-symbols-outlined text-[18px]">done</span>
                        <span>KYC Certified! Loading Step 4...</span>
                      </>
                    ) : (
                      <>
                        <span>Save &amp; Continue to Step 4</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Cooperative Worker Benefits Matrix */}
          <div className="max-w-4xl mx-auto mt-space-12">
            <div className="flex items-center justify-between mb-space-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                  Federation Member Protections
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                  Guaranteed rights automatically unlocked upon e-KYC certification
                </p>
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                Zero Platform Cut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
              {/* Benefit 1 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">₹5 Lakhs Insurance</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Full emergency health and accidental on-duty disability cover for you and spouse.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> 100% Federation Funded
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-primary-container mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">savings</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">Retirement Gratuity</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Monthly federation co-contribution into your National Pension Scheme (NPS) corpus.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> EPFO Compliant
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-secondary-container mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">construction</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">Tool Loan at 4%</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Instant micro-credit for modern power equipment and electric two-wheeler financing.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">bolt</span> Sahakari Bank Credit
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center text-tertiary mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">currency_rupee</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">Direct UPI Settlement</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Customer payments clear straight to your verified UPI VPA the moment job OTP matches.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">speed</span> 0-Second Hold
                </div>
              </div>
            </div>
          </div>

          {/* Cooperative Ownership Banner */}
          <div className="max-w-4xl mx-auto mt-space-8 rounded-xl bg-primary-container text-on-primary p-space-6 flex flex-col sm:flex-row items-center justify-between gap-space-4 shadow-xl">
            <div className="flex items-center gap-space-4">
              <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[26px]">how_to_vote</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-primary font-bold m-0">
                  1 Worker = 1 Equal Vote
                </h4>
                <p className="font-body-sm text-body-sm text-on-primary-container m-0 mt-1">
                  Every onboarded member receives 1 Non-Transferable Cooperative Equity Share with direct ballot rights on tariffs and policy.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="whitespace-nowrap px-space-5 py-space-2.5 rounded-full bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow hover:bg-surface-container-low transition-colors border-none cursor-pointer font-bold"
            >
              Learn Governance
            </button>
          </div>
        </section>
      </div>

      {/* Floating 24x7 Help Button */}
      <aside className="fixed bottom-6 left-6 z-50">
        <button
          className="flex items-center gap-space-2 px-space-4 py-space-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-full shadow-lg hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer"
          type="button"
          onClick={() => onNavigate?.("admin")}
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Need Help? | 24x7 Cooperative Sahayata</span>
        </button>
      </aside>
    </div>
  );
}
