import { useEffect, useState } from "react";
import { getPendingWorkers, reviewWorker } from "../../api";
import { showToast } from "../../toast";
import "./PendingVerifications.css";

export default function PendingVerifications({ onReviewComplete }) {
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [enlargedImage, setEnlargedImage] = useState(null);

    const token = localStorage.getItem("gigconnect_token");

    const fetchPending = async () => {
        if (!token) return;
        setLoading(true);
        try {
            const response = await getPendingWorkers(token);
            if (response.success) {
                setWorkers(response.data || []);
            }
        } catch (error) {
            showToast(error.message || "Failed to load pending verifications");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, [token]);

    const handleReview = async (workerId, decision) => {
        setActionLoading(workerId);
        try {
            const status = decision === "approve" ? "manually_verified" : "rejected";
            const notes = decision === "approve" 
                ? "Manually approved by federation admin." 
                : "Rejected upon manual inspection.";

            const response = await reviewWorker(workerId, status, notes, token);
            if (response.success) {
                showToast(`Worker ${decision === "approve" ? "approved" : "rejected"} successfully.`);
                // Remove from pending list
                setWorkers((prev) => prev.filter((w) => w._id !== workerId));
                if (onReviewComplete) onReviewComplete();
            }
        } catch (error) {
            showToast(error.message || `Failed to ${decision} worker`);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="pending-verifications-card">
                <p className="lead-copy" style={{ color: "#8b949e", textAlign: "center" }}>
                    Loading pending biometric verifications...
                </p>
            </div>
        );
    }

    return (
        <div className="pending-verifications-card">
            <div className="table-header-wrap">
                <div>
                    <h3>Aadhaar Biometric Verification Queue</h3>
                    <p style={{ margin: "0.2rem 0 0", fontSize: "0.85rem", color: "#8b949e" }}>
                        Workers requiring manual admin inspection due to borderline AI match scores (60% - 85%).
                    </p>
                </div>
                <span className="count-badge">{workers.length} Pending Review</span>
            </div>

            {!workers.length ? (
                <p className="empty-state" style={{ textAlign: "center", padding: "2rem 0" }}>
                    🎉 All caught up! No worker verifications are pending review.
                </p>
            ) : (
                <div className="verifications-table-wrapper">
                    <table className="verifications-table">
                        <thead>
                            <tr>
                                <th>Worker Details</th>
                                <th>Masked Aadhaar</th>
                                <th>Face Comparison</th>
                                <th>AI Match Score</th>
                                <th>Extracted OCR Details</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {workers.map((worker) => {
                                const score = worker.faceMatchScore || 0;
                                const scoreClass = score >= 85 ? "green" : score >= 60 ? "amber" : "red";

                                return (
                                    <tr key={worker._id}>
                                        <td className="worker-cell">
                                            <strong>{worker.name || "Worker"}</strong>
                                            <span>{worker.phone}</span>
                                        </td>
                                        <td>
                                            <code style={{ background: "#161b22", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                                                {worker.aadhaarNumberMasked || "•••• •••• ----"}
                                            </code>
                                        </td>
                                        <td>
                                            <div className="photo-compare-cell">
                                                <div className="compare-thumb-wrap">
                                                    <img
                                                        src={worker.aadhaarCardImageUrl}
                                                        alt="Aadhaar Card"
                                                        className="compare-thumb"
                                                        onClick={() => setEnlargedImage(worker.aadhaarCardImageUrl)}
                                                        title="Click to zoom Aadhaar"
                                                    />
                                                    <span className="thumb-label">Aadhaar</span>
                                                </div>
                                                <span style={{ color: "#8b949e", fontSize: "0.8rem" }}>vs</span>
                                                <div className="compare-thumb-wrap">
                                                    {worker.selfieImageUrl ? (
                                                        <img
                                                            src={worker.selfieImageUrl}
                                                            alt="Live Selfie"
                                                            className="compare-thumb"
                                                            onClick={() => setEnlargedImage(worker.selfieImageUrl)}
                                                            title="Click to zoom Selfie"
                                                        />
                                                    ) : (
                                                        <div className="compare-thumb" style={{ background: "#21262d", display: "flex", alignItems: "center", justifyContent: "center", color: "#8b949e", fontSize: "0.7rem" }}>
                                                            No Photo
                                                        </div>
                                                    )}
                                                    <span className="thumb-label">Selfie</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`score-badge ${scoreClass}`}>
                                                {score}% Match
                                            </span>
                                        </td>
                                        <td className="ocr-details-cell">
                                            <span><strong>Name:</strong> {worker.extractedOcrData?.name || worker.name}</span>
                                            <span><strong>DOB:</strong> {worker.extractedOcrData?.dob || "N/A"}</span>
                                            {worker.extractedOcrData?.address && (
                                                <span title={worker.extractedOcrData.address}>
                                                    <strong>Addr:</strong> {worker.extractedOcrData.address}
                                                </span>
                                            )}
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                type="button"
                                                className="btn-approve"
                                                disabled={actionLoading === worker._id}
                                                onClick={() => handleReview(worker._id, "approve")}
                                            >
                                                {actionLoading === worker._id ? "..." : "Approve ✓"}
                                            </button>
                                            <button
                                                type="button"
                                                className="btn-reject"
                                                disabled={actionLoading === worker._id}
                                                onClick={() => handleReview(worker._id, "reject")}
                                            >
                                                Reject ✕
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Click to zoom image modal */}
            {enlargedImage && (
                <div className="image-modal-backdrop" onClick={() => setEnlargedImage(null)}>
                    <div className="image-modal-content" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            className="modal-close-btn"
                            onClick={() => setEnlargedImage(null)}
                        >
                            ✕
                        </button>
                        <img src={enlargedImage} alt="Enlarged Document" />
                    </div>
                </div>
            )}
        </div>
    );
}
