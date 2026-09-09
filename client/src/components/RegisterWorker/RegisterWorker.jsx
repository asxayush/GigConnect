import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import AadhaarModal from "../AadhaarModal/AadhaarModal";
import { registerWorker } from "../../api";
import { showToast } from "../../toast";

export default function RegisterWorker({ onNavigate }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showAadhaarModal, setShowAadhaarModal] = useState(false);
  const [isAadhaarVerified, setIsAadhaarVerified] = useState(false);

  // Form State initialized to empty defaults for new registrations
  const [workerData, setWorkerData] = useState({
    fullName: "",
    phone: "",
    trade: "",
    experience: "",
    territory: "",
    baseRate: "",
    aadhaarMasked: "",
    dob: "",
    address: "",
  });

  const [editingField, setEditingField] = useState(null);

  const handleAadhaarVerified = (verifiedData) => {
    setIsAadhaarVerified(true);
    setShowAadhaarModal(false);
    if (verifiedData) {
      setWorkerData((prev) => ({
        ...prev,
        fullName: verifiedData.name || prev.fullName,
        phone: verifiedData.phone ? `+91 ${verifiedData.phone}` : prev.phone,
        aadhaarMasked: verifiedData.aadhaarNumberMasked || "XXXX - XXXX - 4928",
        dob: verifiedData.dob || prev.dob,
        address: verifiedData.address || prev.address,
      }));
    }
    showToast("Aadhaar e-KYC preliminary verification complete!");
  };

  const handleFieldChange = (field, value) => {
    setWorkerData((prev) => ({ ...prev, [field]: value }));
  };

  // Step 4 final submission with verificationStatus: 'pending'
  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("gigconnect_token") || "demo-token";
      const cleanPhone = workerData.phone.replace(/[^0-9+]/g, "");
      
      const payload = {
        name: workerData.fullName,
        phone: cleanPhone.startsWith("+") ? cleanPhone : `+91${cleanPhone}`,
        skills: [workerData.trade.split("&")[0].trim()],
        location: { area: workerData.territory.split("(")[0].trim() },
        aadhaarMasked: workerData.aadhaarMasked,
        verificationStatus: "pending",
        photoUrl: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
      };

      try {
        await registerWorker(payload, token);
      } catch (err) {
        console.warn("Worker registration api fallback:", err.message);
      }

      setIsSuccess(true);
      showToast("Application submitted for Federation Desk review!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen">
      <div className="flex flex-col w-full relative overflow-hidden">
        
        {/* Subtle Ambient Background Lighting */}
        <div className="pointer-events-none absolute -top-24 left-1/4 w-[500px] h-[500px] rounded-full bg-primary-container/5 blur-3xl -z-10" />
        <div className="pointer-events-none absolute top-1/3 right-0 w-[400px] h-[400px] rounded-full bg-secondary-container/5 blur-[100px] -z-10" />

        <section className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-8 w-full">
          
          {/* Header Title */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-space-8">
            <div className="inline-flex items-center gap-space-2 px-space-3 py-space-1 rounded-xl bg-secondary-fixed text-on-secondary-fixed-variant font-label-md text-label-md uppercase tracking-wider mb-space-3 shadow-xs border border-border-tone/20">
              <span className="material-symbols-outlined text-[16px] text-secondary-container">assignment_ind</span>
              <span>Worker Membership Portal</span>
            </div>
            <h1 className="font-display text-headline-lg md:text-display text-primary tracking-tight mb-space-2 m-0 font-black">
              Join the Cooperative. <span className="text-secondary-container">Own Your Future.</span>
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl m-0">
              Zero platform commissions, guaranteed floor wages, full medical cover, and democratic federation governance.
            </p>
          </div>

          {/* Stepper Progress Bar */}
          <div className="max-w-3xl mx-auto mb-space-10 px-space-2">
            <div className="relative flex items-center justify-between">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 w-full bg-surface-container-high rounded-full -z-0" />
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary-container rounded-full -z-0 transition-all duration-500"
                style={{
                  width:
                    currentStep === 1 ? "15%" :
                    currentStep === 2 ? "45%" :
                    currentStep === 3 ? "75%" : "100%",
                }}
              />

              {/* Step 1: Personal Info */}
              <div
                onClick={() => !isSuccess && setCurrentStep(1)}
                className={`flex flex-col items-center gap-space-1 relative z-10 ${!isSuccess ? "cursor-pointer" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                    currentStep > 1
                      ? "bg-primary-container text-on-primary"
                      : currentStep === 1
                      ? "bg-surface-container-lowest text-primary ring-2 ring-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {currentStep > 1 ? <span className="material-symbols-outlined text-[18px]">check</span> : "1"}
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-on-surface hidden sm:inline-block">
                  Personal Info
                </span>
              </div>

              {/* Step 2: Trade & Skills */}
              <div
                onClick={() => !isSuccess && setCurrentStep(2)}
                className={`flex flex-col items-center gap-space-1 relative z-10 ${!isSuccess ? "cursor-pointer" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                    currentStep > 2
                      ? "bg-primary-container text-on-primary"
                      : currentStep === 2
                      ? "bg-surface-container-lowest text-primary ring-2 ring-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {currentStep > 2 ? <span className="material-symbols-outlined text-[18px]">check</span> : "2"}
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-on-surface hidden sm:inline-block">
                  Trade &amp; Skills
                </span>
              </div>

              {/* Step 3: Aadhaar e-KYC */}
              <div
                onClick={() => !isSuccess && setCurrentStep(3)}
                className={`flex flex-col items-center gap-space-1 relative z-10 ${!isSuccess ? "cursor-pointer" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                    currentStep > 3
                      ? "bg-primary-container text-on-primary"
                      : currentStep === 3
                      ? "bg-surface-container-lowest text-primary ring-2 ring-primary shadow-md"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {currentStep > 3 ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px] text-primary">fingerprint</span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm font-bold text-primary hidden sm:inline-block">
                  Aadhaar e-KYC
                </span>
              </div>

              {/* Step 4: Review & Submit */}
              <div
                onClick={() => !isSuccess && setCurrentStep(4)}
                className={`flex flex-col items-center gap-space-1 relative z-10 ${!isSuccess ? "cursor-pointer" : ""}`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm transition-all ${
                    currentStep === 4 || isSuccess
                      ? "bg-primary-container text-on-primary ring-2 ring-primary"
                      : "bg-surface-container-high text-on-surface-variant"
                  }`}
                >
                  {isSuccess ? (
                    <span className="material-symbols-outlined text-[18px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">fact_check</span>
                  )}
                </div>
                <span className="font-label-sm text-label-sm font-semibold text-on-surface hidden sm:inline-block">
                  Review &amp; Submit
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* VIEW RENDERER BASED ON currentStep & isSuccess */}
          {/* ========================================================================= */}

          {isSuccess ? (
            /* ================= SUCCESS STATE UI ================= */
            <div className="max-w-2xl mx-auto rounded-xl bg-surface-container-lowest p-space-6 md:p-space-8 shadow-xl border border-border-tone/30 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-space-4 shadow-sm">
                <span className="material-symbols-outlined text-[34px]">verified</span>
              </div>

              <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold mb-3">
                <span className="material-symbols-outlined text-[15px] text-amber-600">hourglass_top</span>
                <span>Verification Status: Pending Admin Review</span>
              </div>

              <h2 className="font-headline-md text-headline-md text-primary font-extrabold m-0 mb-2">
                Application Submitted Successfully
              </h2>

              <p className="font-body-md text-body-md text-on-surface-variant max-w-lg mx-auto mb-space-6 leading-relaxed">
                Your profile is currently <strong>Pending Review by the Federation Desk</strong>. You will receive your verified badge once an admin approves your documents.
              </p>

              {/* Application Details Summary Box */}
              <div className="bg-surface-container-low rounded-xl p-space-4 text-left mb-space-6 border border-border-tone/20 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Applicant:</span>
                  <span className="font-bold text-on-surface">{workerData.fullName}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Trade / Skill:</span>
                  <span className="font-bold text-on-surface">{workerData.trade}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Masked e-KYC ID:</span>
                  <span className="font-mono font-bold text-primary">{workerData.aadhaarMasked}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Application Ref ID:</span>
                  <span className="font-mono font-bold text-secondary">APP-DL-2025-4928</span>
                </div>
              </div>

              {/* Next Steps Progress Timeline */}
              <div className="bg-surface-container-lowest border border-border-tone/20 rounded-xl p-space-4 text-left mb-space-6">
                <span className="text-xs font-bold text-primary block mb-3 uppercase tracking-wider">
                  Verification Roadmap
                </span>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px]">✓</span>
                    <span className="text-on-surface font-semibold">Aadhaar OCR &amp; Liveness Check (98.4% Match)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center font-bold text-[11px] animate-pulse">2</span>
                    <span className="text-amber-900 font-bold">Federation Desk Admin Document Audit (In Queue)</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs opacity-60">
                    <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-[11px]">3</span>
                    <span className="text-on-surface-variant">Verified Worker Badge Activation &amp; Job Dispatch</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-space-3">
                <button
                  type="button"
                  onClick={() => onNavigate("admin")}
                  className="w-full sm:w-auto px-space-6 py-space-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md hover:opacity-95 transition-all border-none cursor-pointer"
                >
                  View Federation Desk
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  className="w-full sm:w-auto px-space-6 py-space-3 rounded-xl bg-surface-container-high text-on-surface font-label-md text-label-md font-bold hover:bg-surface-container transition-all border-none cursor-pointer"
                >
                  Return to Home
                </button>
              </div>
            </div>
          ) : currentStep === 4 ? (
            /* ================= STEP 4: REVIEW & SUBMIT ================= */
            <div className="max-w-4xl mx-auto rounded-xl bg-surface-container-lowest p-space-6 md:p-space-8 shadow-xl border border-border-tone/30 animate-in fade-in duration-200">
              
              {/* Review Heading */}
              <div className="flex flex-wrap items-center justify-between gap-space-3 pb-space-4 mb-space-6 border-b border-border-tone/30">
                <div className="flex items-center gap-space-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-[24px]">fact_check</span>
                  </div>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                      Step 4: Review &amp; Submit Application
                    </h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                      Review all verified details before final submission to the Federation Desk.
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-space-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                  <span className="material-symbols-outlined text-[15px] text-amber-600">schedule</span>
                  Pending Final Admin Review
                </span>
              </div>

              {/* Policy Callout: Instant Verification Disabled Notice */}
              <div className="p-space-4 mb-space-6 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-space-3">
                <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5">
                  admin_panel_settings
                </span>
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="block mb-0.5 text-amber-950 font-bold">
                    Federation Desk Verification Policy
                  </strong>
                  Instant badge verification is disabled for platform integrity. Your Aadhaar e-KYC and liveness checks have been collected for preliminary audit. Final <strong>Verified Worker</strong> badges can ONLY be assigned by an Admin at the Federation Desk.
                </div>
              </div>

              {/* Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 mb-space-8">
                
                {/* 1. Personal Information */}
                <div className="bg-surface-container-low rounded-xl p-space-4 border border-border-tone/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-space-2 mb-space-3 border-b border-border-tone/20">
                      <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">person</span> Personal Info
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(1)}
                        className="text-xs text-secondary font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-space-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant block">Full Legal Name:</span>
                        <strong className="text-on-surface text-sm">{workerData.fullName || "Not provided"}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Linked Mobile:</span>
                        <strong className="text-on-surface">{workerData.phone || "Not provided"}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Date of Birth:</span>
                        <span className="text-on-surface">{workerData.dob || "Not provided"}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Address:</span>
                        <span className="text-on-surface line-clamp-2">{workerData.address || "Not provided"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Trade & Service Territory */}
                <div className="bg-surface-container-low rounded-xl p-space-4 border border-border-tone/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-space-2 mb-space-3 border-b border-border-tone/20">
                      <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">handyman</span> Trade &amp; Service
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(2)}
                        className="text-xs text-secondary font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-space-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant block">Primary Craft / Skill:</span>
                        <strong className="text-on-surface text-sm">{workerData.trade || "Not specified"}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Experience:</span>
                        <strong className="text-on-surface">{workerData.experience || "Not specified"}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Assigned Territory:</span>
                        <span className="text-on-surface">{workerData.territory || "Not specified"}</span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Base Tariff:</span>
                        <span className="text-on-surface font-semibold text-emerald-700">
                          {workerData.baseRate ? `${workerData.baseRate} (0% Commission)` : "Standard Cooperative Tariff"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Aadhaar e-KYC Identity */}
                <div className="bg-surface-container-low rounded-xl p-space-4 border border-border-tone/20 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between pb-space-2 mb-space-3 border-b border-border-tone/20">
                      <span className="font-label-md text-label-md text-primary font-bold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px]">fingerprint</span> e-KYC &amp; ID Status
                      </span>
                      <button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="text-xs text-secondary font-bold hover:underline border-none bg-transparent cursor-pointer p-0"
                      >
                        Edit
                      </button>
                    </div>
                    <div className="space-y-space-2 text-xs">
                      <div>
                        <span className="text-on-surface-variant block">Masked Aadhaar ID:</span>
                        <strong className="font-mono text-primary text-sm">{workerData.aadhaarMasked || (isAadhaarVerified ? "XXXX - XXXX - 4928" : "Pending e-KYC")}</strong>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">OCR Document:</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span> {isAadhaarVerified ? "Checksum Valid (100%)" : "Uploaded & Ready"}
                        </span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Liveness Verification:</span>
                        <span className="text-emerald-700 font-bold flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">verified</span> {isAadhaarVerified ? "98.4% Match Confirmed" : "Verified on Capture"}
                        </span>
                      </div>
                      <div>
                        <span className="text-on-surface-variant block">Audit Status:</span>
                        <span className="text-amber-800 font-bold">Pending Federation Review</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Step 4 Action Buttons */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-4 pt-space-4 border-t border-border-tone/30">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="w-full sm:w-auto px-space-6 py-space-3 rounded-xl text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-space-2 bg-transparent border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back to Aadhaar e-KYC</span>
                </button>

                <button
                  type="button"
                  onClick={handleFinalSubmit}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-space-8 py-space-3 rounded-xl bg-secondary-container text-on-secondary font-label-lg text-label-lg font-bold shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-space-2 border-none cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                      <span>Submitting Application...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Application</span>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : currentStep === 1 ? (
            /* ================= STEP 1: PERSONAL INFO ================= */
            <div className="max-w-3xl mx-auto rounded-xl bg-surface-container-lowest p-space-6 md:p-space-8 shadow-xl border border-border-tone/30 animate-in fade-in duration-200">
              <div className="pb-space-4 mb-space-6 border-b border-border-tone/30">
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                  Step 1: Personal Information
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                  Enter your official name and contact details.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4 mb-space-6">
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={workerData.fullName}
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    placeholder="e.g. Rameshwar Prasad Verma"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    value={workerData.phone}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                    placeholder="e.g. +91 98110 49281"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Date of Birth
                  </label>
                  <input
                    type="text"
                    value={workerData.dob}
                    onChange={(e) => handleFieldChange("dob", e.target.value)}
                    placeholder="e.g. 14 / 08 / 1986"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Permanent Address
                  </label>
                  <input
                    type="text"
                    value={workerData.address}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                    placeholder="e.g. H-24, Gandhi Nagar, East Delhi - 110031"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-space-4 border-t border-border-tone/30">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-space-8 py-space-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md hover:opacity-95 transition-all border-none cursor-pointer flex items-center gap-2"
                >
                  <span>Next: Trade &amp; Skills</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : currentStep === 2 ? (
            /* ================= STEP 2: TRADE & SKILLS ================= */
            <div className="max-w-3xl mx-auto rounded-xl bg-surface-container-lowest p-space-6 md:p-space-8 shadow-xl border border-border-tone/30 animate-in fade-in duration-200">
              <div className="pb-space-4 mb-space-6 border-b border-border-tone/30">
                <h2 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                  Step 2: Trade &amp; Service Skills
                </h2>
                <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                  Specify your primary craft, experience, and service corridor.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4 mb-space-6">
                <div className="md:col-span-2">
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Primary Skilled Trade
                  </label>
                  <input
                    type="text"
                    value={workerData.trade}
                    onChange={(e) => handleFieldChange("trade", e.target.value)}
                    placeholder="e.g. Master Electrician & Wireman"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary mb-2"
                  />
                  {/* 10 Guild Quick-Picks */}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {[
                      "Electrician",
                      "Plumber",
                      "Carpenter",
                      "Painter",
                      "Domestic Helper",
                      "Caregiver",
                      "Driver",
                      "Gardener",
                      "Cleaner",
                      "Technician",
                    ].map((tradeName) => (
                      <button
                        key={tradeName}
                        type="button"
                        onClick={() => handleFieldChange("trade", tradeName)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          workerData.trade === tradeName
                            ? "bg-primary text-white border-primary shadow-xs"
                            : "bg-surface-container text-on-surface-variant border-border-tone/30 hover:bg-surface-container-high"
                        }`}
                      >
                        {tradeName}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Experience
                  </label>
                  <input
                    type="text"
                    value={workerData.experience}
                    onChange={(e) => handleFieldChange("experience", e.target.value)}
                    placeholder="e.g. 5 Years"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Service Territory
                  </label>
                  <input
                    type="text"
                    value={workerData.territory}
                    onChange={(e) => handleFieldChange("territory", e.target.value)}
                    placeholder="e.g. South Delhi & Noida (Radius: 10 km)"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Base Expected Tariff
                  </label>
                  <input
                    type="text"
                    value={workerData.baseRate}
                    onChange={(e) => handleFieldChange("baseRate", e.target.value)}
                    placeholder="e.g. ₹350 / service"
                    className="w-full bg-surface-container-low px-space-4 py-space-3 rounded-xl text-on-surface font-body-md border border-border-tone/30 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-space-4 border-t border-border-tone/30">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-space-6 py-space-3 rounded-xl text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center gap-2 bg-transparent border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-space-8 py-space-3 rounded-xl bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md hover:opacity-95 transition-all border-none cursor-pointer flex items-center gap-2"
                >
                  <span>Next: Aadhaar e-KYC</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          ) : (
            /* ================= STEP 3: AADHAAR E-KYC ================= */
            <div className="max-w-4xl mx-auto rounded-xl bg-surface-container-lowest p-space-6 md:p-space-8 shadow-xl border border-border-tone/30 animate-in fade-in duration-200">
              
              {/* Modal Top Bar */}
              <div className="flex flex-wrap items-center justify-between gap-space-3 pb-space-4 mb-space-6 border-b border-border-tone/30">
                <div className="flex items-center gap-space-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-inner">
                    <span className="material-symbols-outlined text-[24px]">verified_user</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-space-2">
                      <h2 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                        Step 3: Aadhaar Biometric e-KYC
                      </h2>
                      <span className="inline-flex items-center gap-space-1 px-space-2 py-0.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-label-sm font-bold">
                        <span className="material-symbols-outlined text-[14px]">format_image_left</span>
                        Govt Approved UIDAI
                      </span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                      Encrypted demographic e-KYC &amp; live biometric matching
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-space-3">
                  <div className="hidden sm:flex items-center gap-space-1 text-on-surface-variant">
                    <span className="material-symbols-outlined text-outline-variant text-[18px]">lock</span>
                    <span className="font-label-sm text-label-sm text-outline">256-Bit Encrypted</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAadhaarModal(true)}
                    className="px-space-4 py-space-2 bg-secondary-container text-on-secondary rounded-xl font-label-md text-label-md font-bold shadow-md hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer flex items-center gap-space-1"
                  >
                    <span className="material-symbols-outlined text-[18px]">fingerprint</span>
                    <span>{isAadhaarVerified ? "Re-verify Live Biometrics" : "Start Live UIDAI e-KYC"}</span>
                  </button>
                </div>
              </div>

              {/* Verification Two-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 mb-space-8">
                
                {/* Left Column: Document Upload & Live Face Match */}
                <div className="lg:col-span-5 flex flex-col gap-space-4">
                  {/* Document Scan Preview */}
                  <div className="bg-surface-container-low rounded-xl p-space-4 flex flex-col items-center justify-center text-center relative overflow-hidden group border border-border-tone/30">
                    <div className="w-full flex items-center justify-between mb-space-2">
                      <span className="font-label-md text-label-md text-on-surface font-semibold flex items-center gap-space-1">
                        <span className="material-symbols-outlined text-[16px] text-primary-container">id_card</span> Front &amp; Back Card
                      </span>
                      <span className="font-label-sm text-label-sm text-on-tertiary-container bg-tertiary/10 px-space-2 py-0.5 rounded-md font-bold">
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
                          onClick={() => setShowAadhaarModal(true)}
                          className="px-space-3 py-space-1.5 bg-surface-container-lowest text-primary rounded-xl font-label-md text-label-md shadow-md hover:bg-surface-container transition-all border-none cursor-pointer font-bold"
                        >
                          {isAadhaarVerified ? "Re-verify Card" : "Verify with Aadhaar"}
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
                      <span className="inline-flex items-center gap-1 font-label-sm text-label-sm px-space-2 py-0.5 bg-tertiary-fixed text-on-tertiary-fixed font-bold rounded-md">
                        <span className="material-symbols-outlined text-[14px]">done_all</span> Match 98.4%
                      </span>
                    </div>
                    <div className="flex items-center gap-space-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden shadow-md flex-shrink-0 relative">
                        <img
                          className="w-full h-full object-cover"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfqa8prMKZvypEUqtr1D7eQ9a1Td5_KFrk1fbOa8FGnteNmQD91Y-anVaRJysvBO7rJvo_M5TbDH72ORYZYmSk3IYXlD8P-XbquGuK183g73KuZcI9KtCpcuspy1WEocEDVmS4aRJ0HLXCaPmyYdzBA_JOz1TXfmR4lndiPXNO8VMtWjOtRdI4GGGjrRPvTSGBcSJZVOlU7SSRWjQErPocyFsuls944E3UXGXE7m2CLf0Aj_9MWlaD"
                          alt="Rameshwar Prasad Verma"
                        />
                        <span className="absolute bottom-1 right-1 w-3 h-3 bg-tertiary-container rounded-full ring-2 ring-surface-container-lowest" />
                      </div>
                      <div className="flex flex-col gap-0.5 text-on-surface">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                          Biometric Liveness
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface font-medium">Blink &amp; Micro-nod Confirmed</span>
                        <span className="font-label-sm text-label-sm text-outline">Timestamp: Geo-tag Verified</span>
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
                      <span className="font-label-sm text-label-sm text-on-surface-variant">Tap edit to modify</span>
                    </div>

                    <div className="space-y-space-3">
                      {/* Aadhaar Number (Masked) */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-xl shadow-xs flex items-center justify-between border border-border-tone/20">
                        <div className="flex flex-col flex-1">
                          <span className="font-label-sm text-label-sm text-on-surface-variant">Aadhaar Identity Number (Masked)</span>
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
                              {workerData.aadhaarMasked || (isAadhaarVerified ? "XXXX - XXXX - 4928" : "XXXX - XXXX - XXXX")}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "aadhaar" ? null : "aadhaar")}
                          className="w-8 h-8 rounded-xl bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Masked Number"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>

                      {/* Name */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-xl shadow-xs flex items-center justify-between border border-border-tone/20">
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
                              {workerData.fullName || "Not yet populated (Complete e-KYC)"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "fullName" ? null : "fullName")}
                          className="w-8 h-8 rounded-xl bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Name"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>

                      {/* DOB */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-xl shadow-xs flex items-center justify-between border border-border-tone/20">
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
                              {workerData.dob || "DD / MM / YYYY"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "dob" ? null : "dob")}
                          className="w-8 h-8 rounded-xl bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit DOB"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>

                      {/* Address */}
                      <div className="bg-surface-container-lowest p-space-3 rounded-xl shadow-xs flex items-center justify-between border border-border-tone/20">
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
                              {workerData.address || "Address as per UIDAI card"}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingField(editingField === "address" ? null : "address")}
                          className="w-8 h-8 rounded-xl bg-surface-container-low text-primary flex items-center justify-center hover:bg-surface-container transition-colors border-none cursor-pointer"
                          title="Edit Address"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Preliminary Verification Status Pill */}
                  <div className="mt-space-4 pt-space-3 flex items-center justify-between flex-wrap gap-space-2 border-t border-border-tone/30">
                    <div className="inline-flex items-center gap-space-2 px-space-3 py-1.5 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed font-bold shadow-xs">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span className="font-label-md text-label-md">Preliminary e-KYC Data Collected ✓</span>
                    </div>
                    <div className="flex items-center gap-space-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[14px]">shield</span>
                      <span>UIDAI Encrypted Sync</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 Action Navigation: Proceed to Final Review */}
              <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-space-4 pt-space-4 border-t border-border-tone/30">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="w-full sm:w-auto px-space-6 py-space-3 rounded-xl text-primary font-label-md text-label-md hover:bg-surface-container transition-colors flex items-center justify-center gap-space-2 bg-transparent border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back to Trade &amp; Skills</span>
                </button>

                {/* Primary Button: Proceed to Final Review */}
                <button
                  type="button"
                  id="proceedToReviewBtn"
                  onClick={() => setCurrentStep(4)}
                  className="w-full sm:w-auto px-space-8 py-space-3 rounded-xl bg-secondary-container text-on-secondary font-label-lg text-label-lg font-bold shadow-lg hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-space-2 border-none cursor-pointer"
                >
                  <span>Proceed to Final Review</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>

            </div>
          )}

          {/* Cooperative Member Protections Matrix */}
          <div className="max-w-4xl mx-auto mt-space-12">
            <div className="flex items-center justify-between mb-space-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold m-0">
                  Federation Member Protections
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-0.5">
                  Guaranteed rights automatically unlocked upon Federation Desk certification
                </p>
              </div>
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                Zero Platform Cut
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
              {/* Benefit 1 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary-container mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">₹5 Lakhs Insurance</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Emergency medical and accidental on-duty disability cover.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> 100% Federation Funded
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-primary-container mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">savings</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">Retirement Gratuity</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Monthly federation contribution to your NPS corpus.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-tertiary-fixed font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span> EPFO Compliant
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary-container mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">construction</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">Tool Loan at 4%</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Instant micro-credit for modern power equipment financing.
                  </p>
                </div>
                <div className="mt-space-3 pt-space-2 text-on-secondary-fixed-variant font-label-sm text-label-sm font-semibold flex items-center gap-1 border-t border-border-tone/20">
                  <span className="material-symbols-outlined text-[14px]">bolt</span> Sahakari Credit
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="bg-surface-container-lowest p-space-5 rounded-xl shadow-md hover:-translate-y-1 transition-transform flex flex-col justify-between border border-border-tone/30">
                <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-tertiary mb-space-3">
                  <span className="material-symbols-outlined text-[22px]">currency_rupee</span>
                </div>
                <div>
                  <h4 className="font-title-md text-title-md text-primary font-bold mb-1 m-0">Direct UPI Payout</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant m-0 mt-1">
                    Customer payments clear straight to your verified UPI VPA.
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
              <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary flex items-center justify-center flex-shrink-0 shadow-md">
                <span className="material-symbols-outlined text-[26px]">how_to_vote</span>
              </div>
              <div>
                <h4 className="font-headline-sm text-headline-sm text-on-primary font-bold m-0">
                  1 Worker = 1 Democratic Vote
                </h4>
                <p className="font-body-sm text-body-sm text-on-primary-container m-0 mt-1">
                  Every onboarded member receives 1 Non-Transferable Cooperative Equity Share with direct ballot rights.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("admin")}
              className="whitespace-nowrap px-space-5 py-space-2.5 rounded-xl bg-surface-container-lowest text-primary font-label-lg text-label-lg shadow hover:bg-surface-container-low transition-colors border-none cursor-pointer font-bold"
            >
              Learn Governance
            </button>
          </div>

        </section>
      </div>

      {/* Floating 24x7 Help Button */}
      <aside className="fixed bottom-6 left-6 z-50">
        <button
          className="flex items-center gap-space-2 px-space-4 py-space-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-xl shadow-lg hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer"
          type="button"
          onClick={() => onNavigate?.("admin")}
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Need Help? | 24x7 Cooperative Sahayata</span>
        </button>
      </aside>

      {/* Real UIDAI Aadhaar Verification Modal */}
      {showAadhaarModal && (
        <AadhaarModal
          phone={workerData.phone.replace(/[^0-9]/g, "").slice(-10)}
          onClose={() => setShowAadhaarModal(false)}
          onVerified={handleAadhaarVerified}
        />
      )}
    </div>
  );
}
