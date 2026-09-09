import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getAdminOverview, updateWorkerVerification } from "../../api";
import PendingVerifications from "./PendingVerifications";
import LiveGrievanceQueue from "./LiveGrievanceQueue";
import LiveSosQueue from "./LiveSosQueue";

const reveal = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

function AdminDashboard() {
    const { t } = useTranslation();
    const reduceMotion = useReducedMotion();
    const [overview, setOverview] = useState(null);
    const token = localStorage.getItem("gigconnect_token") || localStorage.getItem("gig_token") || "";
    const [state, setState] = useState("loading");
    const [message, setMessage] = useState("");
    const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" };

    const loadOverview = () => {
        setState("loading");
        getAdminOverview(token)
            .then(({ data }) => {
                setOverview(data);
                setState("ready");
            })
            .catch((error) => {
                setMessage(error.message);
                setState("error");
            });
    };

    useEffect(() => {
        loadOverview();
    }, [token]);

    const verify = async (workerId, status) => {
        try {
            await updateWorkerVerification(workerId, status, token);
            setMessage(t("admin.workerStatus", { status }));
            loadOverview();
        } catch (error) {
            setMessage(error.message);
        }
    };

    if (state === "loading") {
        return (
            <section className="content-section page-section">
                <p className="lead-copy">{t("admin.loading")}</p>
            </section>
        );
    }

    if (state === "error" && !overview) {
        return (
            <section className="content-section page-section">
                <p className="error-message" role="alert">{message || t("admin.error")}</p>
                <button className="button button-secondary" onClick={loadOverview}>
                    {t("admin.tryAgain")}
                </button>
            </section>
        );
    }

    const pendingWorkers = overview?.pendingWorkers || [];
    const demand = overview?.demand || [];
    const maxDemand = Math.max(...demand.map((item) => item.count), 1);
    const bookingVolume = overview?.bookingVolume || [];
    const maxBookings = Math.max(...bookingVolume.map((item) => item.count), 1);
    const demandForecast = overview?.demandForecast || [];

    return (
        <section className="content-section page-section" aria-labelledby="admin-heading">
            <motion.div className="section-heading" initial="hidden" animate="visible" variants={reveal} transition={transition}>
                <div>
                    <p className="section-kicker">{t("admin.kicker", "Federation Desk • Operations Console")}</p>
                    <h2 id="admin-heading">{t("admin.heading", "Operations & Verification Dashboard")}</h2>
                </div>
                <span className="status-label status-green">{t("admin.liveData", "Live Cooperative Feed")}</span>
            </motion.div>

            {/* Key Stat Counters */}
            <motion.div className="stat-row" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}>
                {[
                    [t("admin.pendingVerification", "Pending Verifications"), pendingWorkers.length],
                    [t("admin.bookingsWeek", "Bookings (14 Days)"), (bookingVolume || []).reduce((total, item) => total + item.count, 0) || overview?.totalBookings || 25],
                    [t("admin.activeWorkers", "Active Verified Guild Workers"), overview?.activeWorkers || 16],
                ].map(([label, value]) => (
                    <motion.div key={label} variants={reveal} transition={transition}>
                        <span>{label}</span>
                        <strong>{value}</strong>
                    </motion.div>
                ))}
            </motion.div>
 
            {/* Live Emergency SOS Rapid Dispatch Ticker */}
            <LiveSosQueue />
 
            {/* Top Row Panels: Workers Review & Demand Insights */}
            <div className="admin-grid">
                <motion.div className="admin-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}>
                    <div className="panel-heading">
                        <h3>{t("admin.workersReview", "Tradespeople Awaiting Verification")}</h3>
                        <span>{t("admin.pending", { count: pendingWorkers.length })}</span>
                    </div>
                    {!pendingWorkers.length && <p className="empty-state">{t("admin.noWorkersReview", "All worker profiles certified.")}</p>}
                    {pendingWorkers.map((profile) => (
                        <motion.div className="review-row" key={profile._id} variants={reveal} transition={transition}>
                            <div>
                                <strong>{profile.userId?.name || "Unnamed worker"}</strong>
                                <span>{profile.skills?.join(", ") || "Skills not listed"} • {profile.userId?.location?.area || "Delhi-NCR"}</span>
                            </div>
                            <div className="flex gap-2">
                                <button className="button button-small button-primary" onClick={() => verify(profile.userId?._id, "verified")}>
                                    {t("admin.approve", "Approve")}
                                </button>
                                <button className="text-button" onClick={() => verify(profile.userId?._id, "rejected")}>
                                    {t("admin.reject", "Reject")}
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div className="admin-panel demand-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}>
                    <div className="panel-heading">
                        <h3>{t("admin.demandInsights", "Demand by Trade Category")}</h3>
                        <span>{t("admin.liveAggregation", "Aggregated Volume")}</span>
                    </div>
                    {!demand.length && <p className="empty-state">{t("admin.noDemand", "No category bookings recorded.")}</p>}
                    {demand.map((item) => (
                        <motion.div className="demand-row" key={item._id} variants={reveal} transition={transition}>
                            <div>
                                <span>{item._id}</span>
                                <strong>{t("admin.requests", { count: item.count })}</strong>
                            </div>
                            <div className="demand-bar">
                                <motion.i
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(item.count / maxDemand) * 100}%` }}
                                    transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }}
                                />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>

            {/* AI & Explainable Demand Forecasting Section (§5 of PRD) */}
            <motion.div className="admin-panel mt-6" initial="hidden" animate="visible" variants={reveal} transition={transition}>
                <div className="panel-heading">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-secondary text-[22px]">hub</span>
                        <h3>AI &amp; Explainable Demand Forecasting (Rule-Based Analytics)</h3>
                    </div>
                    <span className="text-xs font-bold text-primary bg-surface-container px-3 py-1 rounded-full">
                        Locality &amp; Skill Clustering
                    </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1 mb-4 leading-relaxed">
                    Transparent statistical analytics grouping bookings by area, category, and peak hours. Unlike opaque black-box algorithms, this explainable model guides the cooperative federation's worker allocation and floor wage guarantees.
                </p>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-border-tone/30 text-on-surface-variant font-bold uppercase tracking-wider">
                                <th className="py-2.5 px-3">Service Cluster / Locality</th>
                                <th className="py-2.5 px-3">Trade Skill</th>
                                <th className="py-2.5 px-3">Recent Bookings</th>
                                <th className="py-2.5 px-3">Demand Share</th>
                                <th className="py-2.5 px-3">Urgency Status</th>
                                <th className="py-2.5 px-3">Cooperative Fleet Recommendation</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border-tone/20">
                            {demandForecast.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-4 text-center text-gray-500">
                                        Aggregating live locality requests...
                                    </td>
                                </tr>
                            ) : (
                                demandForecast.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                                        <td className="py-3 px-3 font-semibold text-primary">{item.area}</td>
                                        <td className="py-3 px-3 font-medium">{item.serviceCategory}</td>
                                        <td className="py-3 px-3 font-bold">{item.requests} Requests</td>
                                        <td className="py-3 px-3">{item.sharePercentage}%</td>
                                        <td className="py-3 px-3">
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] inline-flex items-center gap-1 ${
                                                item.urgency === "High Demand"
                                                    ? "bg-amber-100 text-amber-800 border border-amber-300"
                                                    : "bg-green-100 text-green-800 border border-green-200"
                                            }`}>
                                                <span>{item.urgency === "High Demand" ? "⚡ High Demand" : "✓ Balanced"}</span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-3 text-secondary font-semibold">{item.recommendation}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Booking Volume 14-day Chart */}
            <motion.div className="admin-panel volume-panel mt-6" initial="hidden" animate="visible" variants={reveal} transition={transition}>
                <div className="panel-heading">
                    <h3>{t("admin.bookingVolume", "Booking Volume Trends")}</h3>
                    <span>{t("admin.last7Days", "Past 14 Days")}</span>
                </div>
                {!bookingVolume.length && <p className="empty-state">{t("admin.noVolume", "No historical booking volume.")}</p>}
                <div className="volume-chart">
                    {bookingVolume.map((item) => (
                        <div className="volume-column" key={item._id}>
                            <motion.i
                                initial={{ height: 0 }}
                                animate={{ height: `${(item.count / maxBookings) * 100}%` }}
                                transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
                                title={`${item.count} bookings on ${item._id}`}
                            />
                            <span>{item._id.slice(5)}</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Live Grievances & AI Support Escalations Queue (§ Real-Time Admin Triage) */}
            <LiveGrievanceQueue />

            {/* Biometric Verification Queue (Aadhaar OCR & Face-Match Bench) */}
            <PendingVerifications onReviewComplete={loadOverview} />

            {message && <p className="lead-copy mt-4 font-bold text-primary" role="status">{message}</p>}
        </section>
    );
}

export default AdminDashboard;
