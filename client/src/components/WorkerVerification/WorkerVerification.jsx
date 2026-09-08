import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { extractAadhaar, verifyWorkerFace } from "../../api";
import { showToast } from "../../toast";
import "./WorkerVerification.css";

const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
};

export default function WorkerVerification({ onVerificationComplete, onCancel }) {
    // Step state: 1 (Upload Aadhaar), 2 (Review OCR), 3 (Selfie), 4 (Verifying Scanner), 5 (Result)
    const [currentStep, setCurrentStep] = useState(1);

    // Worker identity state
    const [phone, setPhone] = useState(() => {
        const user = JSON.parse(localStorage.getItem("gigconnect_user") || "null");
        return user?.phone || "";
    });
    const [aadhaarFile, setAadhaarFile] = useState(null);
    const [aadhaarPreview, setAadhaarPreview] = useState(null);
    const [aadhaarCloudinaryUrl, setAadhaarCloudinaryUrl] = useState("");

    // Extracted OCR fields (editable in Step 2)
    const [ocrData, setOcrData] = useState({
        name: "",
        dob: "",
        address: "",
        aadhaarNumberMasked: "•••• •••• ",
    });

    // Webcam & live selfie state
    const webcamRef = useRef(null);
    const [selfieCaptured, setSelfieCaptured] = useState(null);

    // Loading & error feedback
    const [isExtracting, setIsExtracting] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [verificationResult, setVerificationResult] = useState(null);
    const [errorMessage, setErrorMessage] = useState("");
    const [isDragging, setIsDragging] = useState(false);

    // ==========================================
    // STEP 1: AADHAAR UPLOAD & DRAG-DROP HANDLERS
    // ==========================================
    const handleFileSelection = (file) => {
        if (!file) return;

        // Validation: JPG/PNG only
        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            showToast("Only JPG and PNG images are supported.");
            return;
        }

        // Validation: Max 5MB
        if (file.size > 5 * 1024 * 1024) {
            showToast("Image file size exceeds 5MB limit.");
            return;
        }

        setAadhaarFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setAadhaarPreview(e.target.result);
        reader.readAsDataURL(file);
        setErrorMessage("");
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    };

    // Trigger OCR extraction
    const handleExtractOcr = async () => {
        if (!aadhaarFile) {
            showToast("Please upload your Aadhaar card image first.");
            return;
        }

        if (!phone || phone.trim().length < 10) {
            showToast("Please enter a valid 10-digit phone number.");
            return;
        }

        setIsExtracting(true);
        setErrorMessage("");

        try {
            const formData = new FormData();
            formData.append("aadhaarCard", aadhaarFile);
            formData.append("phone", phone);

            const response = await extractAadhaar(formData);
            if (response.success && response.data) {
                setAadhaarCloudinaryUrl(response.data.aadhaarCardImageUrl);
                setOcrData({
                    name: response.data.name || "",
                    dob: response.data.dob || "",
                    address: response.data.address || "",
                    aadhaarNumberMasked: response.data.aadhaarNumberMasked || "•••• •••• 0000",
                });
                showToast("Aadhaar details successfully extracted.");
                setCurrentStep(2); // Move to review step
            } else {
                throw new Error(response.message || "Failed to parse Aadhaar card.");
            }
        } catch (err) {
            setErrorMessage(err.message || "Unable to extract details from the image. Please ensure image is clear and try again.");
            showToast(err.message || "Extraction failed");
        } finally {
            setIsExtracting(false);
        }
    };

    // ==========================================
    // STEP 2: CONFIRM/EDIT OCR DETAILS
    // ==========================================
    const handleOcrFieldChange = (field, value) => {
        setOcrData((prev) => ({ ...prev, [field]: value }));
    };

    const handleConfirmOcr = () => {
        if (!ocrData.name.trim()) {
            showToast("Please enter or confirm your full name.");
            return;
        }
        setCurrentStep(3); // Move to selfie capture
    };

    // ==========================================
    // STEP 3: LIVE WEBCAM SELFIE CAPTURE
    // ==========================================
    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setSelfieCaptured(imageSrc);
            }
        }
    }, [webcamRef]);

    const retakeSelfie = () => {
        setSelfieCaptured(null);
    };

    // ==========================================
    // STEP 4: SUBMIT FOR AI FACE VERIFICATION
    // ==========================================
    const handleVerifyFace = async () => {
        if (!selfieCaptured) {
            showToast("Please capture a live selfie first.");
            return;
        }

        setCurrentStep(4); // Show scanner screen
        setIsVerifying(true);
        setErrorMessage("");

        try {
            const payload = {
                phone,
                name: ocrData.name,
                aadhaarNumberMasked: ocrData.aadhaarNumberMasked,
                aadhaarCardImageUrl: aadhaarCloudinaryUrl,
                selfieBase64: selfieCaptured,
                dob: ocrData.dob,
                address: ocrData.address,
            };

            const response = await verifyWorkerFace(payload);

            setVerificationResult({
                status: response.verificationStatus,
                score: response.faceMatchScore,
                message: response.message,
                worker: response.data,
            });

            if (onVerificationComplete) {
                onVerificationComplete(response.data);
            }

            setCurrentStep(5); // Show result screen
        } catch (err) {
            setErrorMessage(err.message || "Face verification failed. Please try again.");
            setVerificationResult({
                status: "rejected",
                score: 0,
                message: err.message || "Face detection failed. Ensure good lighting and a clear camera view.",
            });
            setCurrentStep(5);
        } finally {
            setIsVerifying(false);
        }
    };

    // Reset flow for retry
    const handleRetry = () => {
        setSelfieCaptured(null);
        setVerificationResult(null);
        setErrorMessage("");
        setCurrentStep(1);
    };

    return (
        <section className="verification-container" aria-labelledby="verification-heading">
            <header className="verification-header">
                <span className="verification-kicker">Identity & Trust Verification</span>
                <h2 id="verification-heading" className="verification-title">
                    Worker Biometric Authentication
                </h2>
                <p className="verification-subtitle">
                    Automated Aadhaar OCR and facial recognition matching for verified gig work.
                </p>
            </header>

            {/* Visual Stepper */}
            <nav className="stepper-bar" aria-label="Verification progress">
                <div className="stepper-line">
                    <div
                        className="stepper-line-fill"
                        style={{ width: `${((currentStep - 1) / 4) * 100}%` }}
                    />
                </div>

                {[
                    { num: 1, label: "Aadhaar Card" },
                    { num: 2, label: "Confirm Data" },
                    { num: 3, label: "Live Selfie" },
                    { num: 4, label: "AI Match" },
                    { num: 5, label: "Status" },
                ].map((s) => (
                    <div
                        key={s.num}
                        className={`step-node ${currentStep === s.num ? "active" : ""} ${currentStep > s.num ? "completed" : ""}`}
                    >
                        <div className="step-circle">{currentStep > s.num ? "✓" : s.num}</div>
                        <span className="step-label">{s.label}</span>
                    </div>
                ))}
            </nav>

            {/* ==========================================
                STEP 1: AADHAAR CARD UPLOAD
            =========================================== */}
            {currentStep === 1 && (
                <div className="step-card">
                    <h3>Step 1: Upload Aadhaar Card Image</h3>
                    <p className="lead-copy" style={{ margin: "0.5rem 0 1.5rem", color: "#8b949e" }}>
                        Upload the front of your official Aadhaar card. Our secure system will extract your name and date of birth.
                    </p>

                    <div className="form-group">
                        <label htmlFor="worker-phone">Registered Phone Number</label>
                        <input
                            id="worker-phone"
                            className="form-control"
                            type="tel"
                            placeholder="e.g. 9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                        />
                    </div>

                    {!aadhaarPreview ? (
                        <div
                            className={`dropzone ${isDragging ? "dragover" : ""}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            onClick={() => document.getElementById("aadhaar-file-input").click()}
                        >
                            <span className="dropzone-icon">📄</span>
                            <p className="dropzone-prompt">Drag and drop your Aadhaar image here</p>
                            <p className="dropzone-note">or browse from your device (JPG, PNG · max 5MB)</p>
                            <input
                                id="aadhaar-file-input"
                                type="file"
                                accept="image/jpeg,image/png"
                                style={{ display: "none" }}
                                onChange={(e) => handleFileSelection(e.target.files[0])}
                            />
                        </div>
                    ) : (
                        <div className="image-preview-wrapper">
                            <img src={aadhaarPreview} alt="Aadhaar Card Preview" />
                            <button
                                type="button"
                                className="remove-image-btn"
                                onClick={() => {
                                    setAadhaarFile(null);
                                    setAadhaarPreview(null);
                                }}
                                title="Remove image"
                            >
                                ✕
                            </button>
                        </div>
                    )}

                    {errorMessage && (
                        <p className="error-message" role="alert" style={{ marginTop: "1rem" }}>
                            {errorMessage}
                        </p>
                    )}

                    <div className="btn-row">
                        {onCancel && (
                            <button type="button" className="btn-secondary" onClick={onCancel}>
                                Cancel
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!aadhaarFile || isExtracting || !phone}
                            onClick={handleExtractOcr}
                        >
                            {isExtracting ? "Extracting Text with OCR..." : "Extract Aadhaar Details →"}
                        </button>
                    </div>
                </div>
            )}

            {/* ==========================================
                STEP 2: REVIEW & CONFIRM OCR DETAILS
            =========================================== */}
            {currentStep === 2 && (
                <div className="step-card">
                    <h3>Step 2: Confirm Extracted Information</h3>
                    <p className="lead-copy" style={{ margin: "0.5rem 0 1.2rem", color: "#8b949e" }}>
                        Verify the details recognized from your Aadhaar card. You can edit any mistakes before proceeding.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div className="form-group">
                            <label htmlFor="ocr-name">Full Name (from card)</label>
                            <input
                                id="ocr-name"
                                className="form-control"
                                type="text"
                                value={ocrData.name}
                                onChange={(e) => handleOcrFieldChange("name", e.target.value)}
                                placeholder="Full Name"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="ocr-dob">Date of Birth (DD/MM/YYYY)</label>
                            <input
                                id="ocr-dob"
                                className="form-control"
                                type="text"
                                value={ocrData.dob}
                                onChange={(e) => handleOcrFieldChange("dob", e.target.value)}
                                placeholder="DD/MM/YYYY"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="ocr-aadhaar">Masked Aadhaar Number (Protected)</label>
                        <input
                            id="ocr-aadhaar"
                            className="form-control"
                            type="text"
                            value={ocrData.aadhaarNumberMasked}
                            readOnly
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="ocr-address">Address (Optional / from card)</label>
                        <input
                            id="ocr-address"
                            className="form-control"
                            type="text"
                            value={ocrData.address}
                            onChange={(e) => handleOcrFieldChange("address", e.target.value)}
                            placeholder="Residential Address"
                        />
                    </div>

                    <div className="security-badge">
                        <span>🔒</span>
                        <span>
                            <strong>Privacy Shield Active:</strong> Full 12-digit Aadhaar numbers are never stored in our database. Only the masked version showing the last 4 digits is retained.
                        </span>
                    </div>

                    <div className="btn-row">
                        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(1)}>
                            ← Back to Upload
                        </button>
                        <button type="button" className="btn-primary" onClick={handleConfirmOcr}>
                            Confirm & Proceed to Selfie →
                        </button>
                    </div>
                </div>
            )}

            {/* ==========================================
                STEP 3: LIVE WEBCAM SELFIE CAPTURE
            =========================================== */}
            {currentStep === 3 && (
                <div className="step-card">
                    <h3>Step 3: Capture Live Facial Selfie</h3>
                    <p className="lead-copy" style={{ margin: "0.5rem 0 1.5rem", color: "#8b949e" }}>
                        Position your face inside the circle and look straight into the camera. Ensure you are in a brightly lit room without sunglasses or masks.
                    </p>

                    <div className="webcam-container">
                        {!selfieCaptured ? (
                            <>
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={videoConstraints}
                                    className="webcam-view"
                                />
                                <div className="face-oval-guide" />
                                <span className="face-guide-hint">Align your face inside the guide</span>
                            </>
                        ) : (
                            <img src={selfieCaptured} alt="Live Selfie Captured" className="webcam-view" />
                        )}
                    </div>

                    <div style={{ textAlign: "center", marginTop: "1rem" }}>
                        {!selfieCaptured ? (
                            <button type="button" className="btn-primary" onClick={captureSelfie}>
                                📸 Capture Selfie
                            </button>
                        ) : (
                            <button type="button" className="btn-secondary" onClick={retakeSelfie}>
                                🔄 Retake Selfie
                            </button>
                        )}
                    </div>

                    <div className="btn-row">
                        <button type="button" className="btn-secondary" onClick={() => setCurrentStep(2)}>
                            ← Back to Details
                        </button>
                        <button
                            type="button"
                            className="btn-primary"
                            disabled={!selfieCaptured}
                            onClick={handleVerifyFace}
                        >
                            Run AI Face Verification →
                        </button>
                    </div>
                </div>
            )}

            {/* ==========================================
                STEP 4: AI SCANNING ANIMATION SCREEN
            =========================================== */}
            {currentStep === 4 && (
                <div className="step-card scanner-screen">
                    <div className="scanner-radar">
                        <div className="scanner-sweep" />
                        <div className="scanner-line" />
                    </div>
                    <h3>Performing AI Biometric Comparison...</h3>
                    <p className="lead-copy" style={{ color: "#8b949e", maxWidth: "460px", margin: "0.8rem auto 0" }}>
                        Extracting 128-dimensional facial landmarks from your Aadhaar photo and comparing biometric embeddings with your live selfie.
                    </p>
                </div>
            )}

            {/* ==========================================
                STEP 5: VERIFICATION RESULT SCREEN
            =========================================== */}
            {currentStep === 5 && verificationResult && (
                <div className="step-card">
                    {/* 1. AUTO VERIFIED (Score > 85) */}
                    {verificationResult.status === "auto_verified" && (
                        <div className="result-card result-auto-verified">
                            <div className="result-icon">✓</div>
                            <h3 style={{ color: "#3fb950", fontSize: "1.6rem", margin: "0.2rem 0" }}>
                                Verification Successful!
                            </h3>
                            <span className="score-pill high">
                                Biometric Match Score: {verificationResult.score}%
                            </span>
                            <p className="lead-copy" style={{ color: "#c9d1d9", maxWidth: "520px", margin: "1rem auto" }}>
                                Your identity has been automatically verified against your Aadhaar card photo. Your cooperative worker account is now activated.
                            </p>
                            <div className="btn-row" style={{ justifyContent: "center" }}>
                                <button
                                    type="button"
                                    className="btn-primary"
                                    onClick={() => onCancel ? onCancel() : setCurrentStep(1)}
                                >
                                    Proceed to Dashboard
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 2. PENDING REVIEW (Score 60 - 85) */}
                    {verificationResult.status === "pending" && (
                        <div className="result-card result-pending">
                            <div className="result-icon">⏳</div>
                            <h3 style={{ color: "#e3b341", fontSize: "1.6rem", margin: "0.2rem 0" }}>
                                Under Review - Admin Verification
                            </h3>
                            <span className="score-pill medium">
                                Biometric Match Score: {verificationResult.score}% (Manual Review Required)
                            </span>
                            <p className="lead-copy" style={{ color: "#c9d1d9", maxWidth: "540px", margin: "1rem auto" }}>
                                Your biometric score is between 60% and 85%. To ensure high trust standards, your application has been forwarded to our federation administrators for manual review within 24 hours.
                            </p>
                            <div className="btn-row" style={{ justifyContent: "center" }}>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => onCancel ? onCancel() : setCurrentStep(1)}
                                >
                                    Check Status Later
                                </button>
                            </div>
                        </div>
                    )}

                    {/* 3. REJECTED (Score < 60) */}
                    {verificationResult.status === "rejected" && (
                        <div className="result-card result-rejected">
                            <div className="result-icon">✕</div>
                            <h3 style={{ color: "#f85149", fontSize: "1.6rem", margin: "0.2rem 0" }}>
                                Verification Rejected
                            </h3>
                            <span className="score-pill low">
                                Biometric Match Score: {verificationResult.score}% (Below 60% Threshold)
                            </span>
                            <p className="lead-copy" style={{ color: "#c9d1d9", maxWidth: "520px", margin: "1rem auto" }}>
                                {verificationResult.message || "We could not confirm a confident match between your live selfie and the photograph on your Aadhaar card."}
                            </p>
                            <div className="btn-row" style={{ justifyContent: "center" }}>
                                <button type="button" className="btn-primary" onClick={handleRetry}>
                                    🔄 Retry Verification
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </section>
    );
}
