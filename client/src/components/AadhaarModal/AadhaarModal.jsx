import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Webcam from "react-webcam";
import { useTranslation } from "react-i18next";
import { extractAadhaar, verifyWorkerFace } from "../../api";
import { showToast } from "../../toast";
import "./AadhaarModal.css";

const VIDEO_CONSTRAINTS = { width: 640, height: 480, facingMode: "user" };

const STEPS = [
    { num: 1, key: "step1Label" },
    { num: 2, key: "step2Label" },
    { num: 3, key: "step3Label" },
];

/**
 * AadhaarModal — Portal-based 3-step Aadhaar verification modal.
 * Uses only existing App.css design tokens (--navy, --accent, --green, --alert, etc.)
 * and site button/form styles (.button, .button-primary, .button-secondary, .status-tracker).
 */
export default function AadhaarModal({ phone: initialPhone, onClose, onVerified }) {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);

    // Step 1 state
    const [phone, setPhone] = useState(initialPhone || "");
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [aadhaarPreview, setAadhaarPreview] = useState(null);
    const [aadhaarUrl, setAadhaarUrl] = useState("");
    const [isDragging, setIsDragging] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);

    // Step 2 state
    const [ocrData, setOcrData] = useState({ name: "", dob: "", address: "", aadhaarNumberMasked: "" });

    // Step 3 state
    const webcamRef = useRef(null);
    const [selfie, setSelfie] = useState(null);
    const [isVerifying, setIsVerifying] = useState(false);

    // Result state (step 4 scanning / step 5 result)
    const [result, setResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState("");

    // File handling
    const handleFile = (file) => {
        if (!file) return;
        if (!["image/jpeg", "image/png", "image/jpg"].includes(file.type)) {
            showToast(t("common.error")); return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showToast("Image file size exceeds 5MB limit."); return;
        }
        setAadhaarFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setAadhaarPreview(e.target.result);
        reader.readAsDataURL(file);
        setErrorMsg("");
    };

    // Step 1: OCR extraction
    const handleExtract = async () => {
        if (!aadhaarFile) { showToast("Please upload Aadhaar image."); return; }
        if (!phone || phone.trim().length < 10) { showToast("Enter a valid 10-digit phone number."); return; }
        setIsExtracting(true); setErrorMsg("");
        try {
            const fd = new FormData();
            fd.append("aadhaarCard", aadhaarFile);
            fd.append("phone", phone);
            const res = await extractAadhaar(fd);
            if (res.success && res.data) {
                setAadhaarUrl(res.data.aadhaarCardImageUrl);
                setOcrData({
                    name: res.data.name || "",
                    dob: res.data.dob || "",
                    address: res.data.address || "",
                    aadhaarNumberMasked: res.data.aadhaarNumberMasked || "•••• •••• 0000",
                });
                setStep(2);
            } else {
                throw new Error(res.message || "OCR extraction failed.");
            }
        } catch (err) {
            setErrorMsg(err.message || "Extraction failed. Please try again.");
            showToast(err.message || "Extraction failed.");
        } finally { setIsExtracting(false); }
    };

    // Step 2: Confirm OCR
    const handleConfirm = () => {
        if (!ocrData.name.trim()) { showToast("Please confirm your full name."); return; }
        setStep(3);
    };

    // Step 3: Capture selfie
    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const img = webcamRef.current.getScreenshot();
            if (img) setSelfie(img);
        }
    }, []);

    // Step 3 → verify
    const handleVerify = async () => {
        if (!selfie) { showToast("Please capture a selfie first."); return; }
        setStep(4); setIsVerifying(true); setErrorMsg("");
        try {
            const res = await verifyWorkerFace({
                phone,
                name: ocrData.name,
                aadhaarNumberMasked: ocrData.aadhaarNumberMasked,
                aadhaarCardImageUrl: aadhaarUrl,
                selfieBase64: selfie,
                dob: ocrData.dob,
                address: ocrData.address,
            });
            setResult({
                status: res.verificationStatus,
                score: res.faceMatchScore,
                message: res.message,
                worker: res.data,
            });
            setStep(5);
            if (res.verificationStatus === "auto_verified" || res.verificationStatus === "manually_verified") {
                if (onVerified) onVerified(res.data);
            }
        } catch (err) {
            setResult({ status: "rejected", score: 0, message: err.message });
            setStep(5);
        } finally { setIsVerifying(false); }
    };

    const handleRetry = () => {
        setSelfie(null); setResult(null); setErrorMsg(""); setStep(1);
    };

    // Close on overlay click
    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Stepper using site's status-tracker pattern
    const Stepper = () => (
        <div className="aadhaar-stepper">
            <div className="status-tracker" style={{ flex: 1 }}>
                {STEPS.map((s) => {
                    const done = step > s.num;
                    const active = step === s.num;
                    return (
                        <div key={s.num} className={`status-step ${active || done ? "is-active" : ""}`}>
                            <div className="status-marker">{done ? "✓" : s.num}</div>
                            {t(`aadhaar.${s.key}`)}
                        </div>
                    );
                })}
            </div>
        </div>
    );

    const modal = (
        <div className="aadhaar-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-labelledby="aadhaar-modal-heading">
            <div className="aadhaar-modal">
                {/* Header */}
                <div className="aadhaar-modal-header">
                    <p className="section-kicker">{t("aadhaar.kicker")}</p>
                    <h2 id="aadhaar-modal-heading">{t("aadhaar.heading")}</h2>
                    <p className="lead-copy">{t("aadhaar.subtitle")}</p>
                </div>
                <button className="aadhaar-modal-close" onClick={onClose} aria-label={t("common.close")}>✕</button>

                {/* Stepper (steps 1-3 only) */}
                {step <= 3 && <Stepper />}

                {/* Step 1: Upload */}
                {step === 1 && (
                    <div className="aadhaar-step-body">
                        <h3>{t("aadhaar.step1Title")}</h3>
                        <p className="lead-copy">{t("aadhaar.step1Body")}</p>

                        <label className="aadhaar-field">
                            {t("aadhaar.phoneLabel")}
                            <input
                                type="tel"
                                placeholder={t("aadhaar.phonePlaceholder")}
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                required
                            />
                        </label>

                        {!aadhaarPreview ? (
                            <div
                                className={`aadhaar-dropzone${isDragging ? " dragover" : ""}`}
                                onClick={() => document.getElementById("aadhaar-modal-file").click()}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); }}
                            >
                                <span className="aadhaar-dropzone-icon">📄</span>
                                <p className="aadhaar-dropzone-prompt">{t("aadhaar.dragDrop")}</p>
                                <p className="aadhaar-dropzone-note">{t("aadhaar.orBrowse")}</p>
                                <input
                                    id="aadhaar-modal-file"
                                    type="file"
                                    accept="image/jpeg,image/png"
                                    style={{ display: "none" }}
                                    onChange={(e) => handleFile(e.target.files[0])}
                                />
                            </div>
                        ) : (
                            <div className="aadhaar-preview">
                                <img src={aadhaarPreview} alt="Aadhaar Card" />
                                <button
                                    type="button"
                                    className="aadhaar-remove-btn"
                                    onClick={() => { setAadhaarFile(null); setAadhaarPreview(null); }}
                                    aria-label="Remove image"
                                >✕</button>
                            </div>
                        )}

                        {errorMsg && <p className="error-message" role="alert">{errorMsg}</p>}

                        <div className="aadhaar-btn-row">
                            <button type="button" className="button button-secondary" onClick={onClose}>
                                {t("aadhaar.cancel")}
                            </button>
                            <button
                                type="button"
                                className="button button-primary"
                                disabled={!aadhaarFile || isExtracting || phone.trim().length < 10}
                                onClick={handleExtract}
                            >
                                {isExtracting ? t("aadhaar.extracting") : t("aadhaar.extract")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Confirm OCR */}
                {step === 2 && (
                    <div className="aadhaar-step-body">
                        <h3>{t("aadhaar.step2Title")}</h3>
                        <p className="lead-copy">{t("aadhaar.step2Body")}</p>

                        <div className="aadhaar-two-col">
                            <label className="aadhaar-field">
                                {t("aadhaar.nameLabel")}
                                <input
                                    type="text"
                                    value={ocrData.name}
                                    placeholder={t("aadhaar.namePlaceholder")}
                                    onChange={(e) => setOcrData(p => ({ ...p, name: e.target.value }))}
                                />
                            </label>
                            <label className="aadhaar-field">
                                {t("aadhaar.dobLabel")}
                                <input
                                    type="text"
                                    value={ocrData.dob}
                                    placeholder={t("aadhaar.dobPlaceholder")}
                                    onChange={(e) => setOcrData(p => ({ ...p, dob: e.target.value }))}
                                />
                            </label>
                        </div>

                        <label className="aadhaar-field">
                            {t("aadhaar.aadhaarMasked")}
                            <input type="text" value={ocrData.aadhaarNumberMasked} readOnly />
                        </label>

                        <label className="aadhaar-field">
                            {t("aadhaar.addressLabel")}
                            <input
                                type="text"
                                value={ocrData.address}
                                placeholder={t("aadhaar.addressPlaceholder")}
                                onChange={(e) => setOcrData(p => ({ ...p, address: e.target.value }))}
                            />
                        </label>

                        <div className="aadhaar-privacy">
                            <span>🔒</span>
                            <span>{t("aadhaar.privacyNote")}</span>
                        </div>

                        <div className="aadhaar-btn-row">
                            <button type="button" className="button button-secondary" onClick={() => setStep(1)}>
                                {t("aadhaar.back")}
                            </button>
                            <button type="button" className="button button-primary" onClick={handleConfirm}>
                                {t("aadhaar.confirm")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3: Selfie */}
                {step === 3 && (
                    <div className="aadhaar-step-body">
                        <h3>{t("aadhaar.step3Title")}</h3>
                        <p className="lead-copy">{t("aadhaar.step3Body")}</p>

                        <div className="aadhaar-webcam-wrap">
                            {!selfie ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={VIDEO_CONSTRAINTS}
                                    />
                                    <div className="aadhaar-face-oval" aria-hidden="true" />
                                    <span className="aadhaar-face-hint">{t("aadhaar.alignFace")}</span>
                                </>
                            ) : (
                                <img src={selfie} alt="Live Selfie" />
                            )}
                        </div>

                        <div className="aadhaar-selfie-actions">
                            {!selfie ? (
                                <button type="button" className="button button-primary" onClick={captureSelfie}>
                                    {t("aadhaar.captureSelfie")}
                                </button>
                            ) : (
                                <button type="button" className="button button-secondary" onClick={() => setSelfie(null)}>
                                    {t("aadhaar.retakeSelfie")}
                                </button>
                            )}
                        </div>

                        <div className="aadhaar-btn-row">
                            <button type="button" className="button button-secondary" onClick={() => setStep(2)}>
                                {t("aadhaar.back")}
                            </button>
                            <button
                                type="button"
                                className="button button-primary"
                                disabled={!selfie}
                                onClick={handleVerify}
                            >
                                {t("aadhaar.verify")}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 4: Scanning */}
                {step === 4 && (
                    <div className="aadhaar-scanner">
                        <div className="aadhaar-scanner-ring" aria-hidden="true" />
                        <h3 style={{ color: "var(--navy)" }}>{t("aadhaar.scanning")}</h3>
                        <p className="lead-copy">{t("aadhaar.scanningBody")}</p>
                    </div>
                )}

                {/* Step 5: Result */}
                {step === 5 && result && (
                    <div className="aadhaar-step-body">
                        {result.status === "auto_verified" && (
                            <div className="aadhaar-result">
                                <div className="aadhaar-result-icon">✓</div>
                                <h3>{t("aadhaar.successTitle")}</h3>
                                <span className="aadhaar-score-tag">{t("aadhaar.score")}: {result.score}%</span>
                                <p className="lead-copy">{t("aadhaar.successBody")}</p>
                                <div className="aadhaar-btn-row" style={{ justifyContent: "center" }}>
                                    <button type="button" className="button button-primary" onClick={onClose}>
                                        {t("aadhaar.proceed")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {result.status === "pending" && (
                            <div className="aadhaar-result aadhaar-result-pending">
                                <div className="aadhaar-result-icon">⏳</div>
                                <h3>{t("aadhaar.pendingTitle")}</h3>
                                <span className="aadhaar-score-tag">{t("aadhaar.score")}: {result.score}% — {t("aadhaar.manualReview")}</span>
                                <p className="lead-copy">{t("aadhaar.pendingBody")}</p>
                                <div className="aadhaar-btn-row" style={{ justifyContent: "center" }}>
                                    <button type="button" className="button button-secondary" onClick={onClose}>
                                        {t("aadhaar.checkLater")}
                                    </button>
                                </div>
                            </div>
                        )}

                        {result.status === "rejected" && (
                            <div className="aadhaar-result aadhaar-result-rejected">
                                <div className="aadhaar-result-icon">✕</div>
                                <h3>{t("aadhaar.rejectedTitle")}</h3>
                                <span className="aadhaar-score-tag">{t("aadhaar.score")}: {result.score}%</span>
                                <p className="lead-copy">{result.message || t("aadhaar.rejectedBody")}</p>
                                <div className="aadhaar-btn-row" style={{ justifyContent: "center" }}>
                                    <button type="button" className="button button-primary" onClick={handleRetry}>
                                        {t("aadhaar.retry")}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );

    return createPortal(modal, document.body);
}
