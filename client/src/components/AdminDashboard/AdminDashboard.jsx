import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { getAdminOverview, updateWorkerVerification } from "../../api";
import PendingVerifications from "./PendingVerifications";

const reveal = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

function AdminDashboard() {
    const { t } = useTranslation();
    const reduceMotion = useReducedMotion();
    const [overview, setOverview] = useState(null);
    const token = localStorage.getItem("gigconnect_token");
    const [state, setState] = useState(token ? "loading" : "signed-out");
    const [message, setMessage] = useState("");
    const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" };
    const loadOverview = () => {
        if (!token) return;
        setState("loading");
        getAdminOverview(token).then(({ data }) => { setOverview(data); setState("ready"); }).catch((error) => { setMessage(error.message); setState("error"); });
    };
    useEffect(() => {
        if (!token) return;
        getAdminOverview(token).then(({ data }) => { setOverview(data); setState("ready"); }).catch((error) => { setMessage(error.message); setState("error"); });
    }, [token]);
    const verify = async (workerId, status) => {
        try { await updateWorkerVerification(workerId, status, localStorage.getItem("gigconnect_token")); setMessage(t("admin.workerStatus", { status })); loadOverview(); } catch (error) { setMessage(error.message); }
    };
    if (state === "loading") return <section className="content-section page-section"><p className="lead-copy">{t("admin.loading")}</p></section>;
    if (state === "signed-out") return <section className="content-section page-section"><p className="empty-state">{t("admin.signInPrompt")}</p></section>;
    if (state === "error") return <section className="content-section page-section"><p className="error-message" role="alert">{message || t("admin.error")}</p><button className="button button-secondary" onClick={loadOverview}>{t("admin.tryAgain")}</button></section>;
    const pendingWorkers = overview.pendingWorkers || [];
    const demand = overview.demand || [];
    const maxDemand = Math.max(...demand.map((item) => item.count), 1);
    const bookingVolume = overview.bookingVolume || [];
    const maxBookings = Math.max(...bookingVolume.map((item) => item.count), 1);
    return <section className="content-section page-section" aria-labelledby="admin-heading">
        <motion.div className="section-heading" initial="hidden" animate="visible" variants={reveal} transition={transition}><div><p className="section-kicker">{t("admin.kicker")}</p><h2 id="admin-heading">{t("admin.heading")}</h2></div><span className="status-label status-green">{t("admin.liveData")}</span></motion.div>
        <motion.div className="stat-row" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}>
            {[[t("admin.pendingVerification"), pendingWorkers.length], [t("admin.bookingsWeek"), (overview.bookingVolume || []).reduce((total, item) => total + item.count, 0)], [t("admin.activeWorkers"), overview.activeWorkers]].map(([label, value]) => <motion.div key={label} variants={reveal} transition={transition}><span>{label}</span><strong>{value}</strong></motion.div>)}
        </motion.div>
        <div className="admin-grid">
            <motion.div className="admin-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}><div className="panel-heading"><h3>{t("admin.workersReview")}</h3><span>{t("admin.pending", { count: pendingWorkers.length })}</span></div>{!pendingWorkers.length && <p className="empty-state">{t("admin.noWorkersReview")}</p>}{pendingWorkers.map((profile) => <motion.div className="review-row" key={profile._id} variants={reveal} transition={transition}><div><strong>{profile.userId?.name || "Unnamed worker"}</strong><span>{profile.skills?.join(", ") || "Skills not listed"}</span></div><div><button className="button button-small button-primary" onClick={() => verify(profile.userId?._id, "verified")}>{t("admin.approve")}</button><button className="text-button" onClick={() => verify(profile.userId?._id, "rejected")}>{t("admin.reject")}</button></div></motion.div>)}</motion.div>
            <motion.div className="admin-panel demand-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}><div className="panel-heading"><h3>{t("admin.demandInsights")}</h3><span>{t("admin.liveAggregation")}</span></div>{!demand.length && <p className="empty-state">{t("admin.noDemand")}</p>}{demand.map((item) => <motion.div className="demand-row" key={item._id} variants={reveal} transition={transition}><div><span>{item._id}</span><strong>{t("admin.requests", { count: item.count })}</strong></div><div className="demand-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${(item.count / maxDemand) * 100}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }} /></div></motion.div>)}</motion.div>
        </div>
        <motion.div className="admin-panel volume-panel" initial="hidden" animate="visible" variants={reveal} transition={transition}><div className="panel-heading"><h3>{t("admin.bookingVolume")}</h3><span>{t("admin.last7Days")}</span></div>{!bookingVolume.length && <p className="empty-state">{t("admin.noVolume")}</p>}<div className="volume-chart">{bookingVolume.map((item) => <div className="volume-column" key={item._id}><motion.i initial={{ height: 0 }} animate={{ height: `${(item.count / maxBookings) * 100}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }} title={`${item.count} bookings`} /><span>{item._id.slice(5)}</span></div>)}</div></motion.div>

        {/* Biometric Verification Queue */}
        <PendingVerifications onReviewComplete={loadOverview} />

        {message && <p className="lead-copy" role="status">{message}</p>}
    </section>;
}

export default AdminDashboard;
