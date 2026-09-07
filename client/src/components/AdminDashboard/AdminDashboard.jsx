import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { getAdminOverview, updateWorkerVerification } from "../../api";

const reveal = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

function AdminDashboard() {
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
        try { await updateWorkerVerification(workerId, status, localStorage.getItem("gigconnect_token")); setMessage(`Worker ${status}.`); loadOverview(); } catch (error) { setMessage(error.message); }
    };
    if (state === "loading") return <section className="content-section page-section"><p className="lead-copy">Loading federation data...</p></section>;
    if (state === "signed-out") return <section className="content-section page-section"><p className="empty-state">Sign in with an admin account to view the federation desk.</p></section>;
    if (state === "error") return <section className="content-section page-section"><p className="error-message" role="alert">{message || "Unable to load federation data."}</p><button className="button button-secondary" onClick={loadOverview}>Try again</button></section>;
    const pendingWorkers = overview.pendingWorkers || [];
    const demand = overview.demand || [];
    const maxDemand = Math.max(...demand.map((item) => item.count), 1);
    const bookingVolume = overview.bookingVolume || [];
    const maxBookings = Math.max(...bookingVolume.map((item) => item.count), 1);
    return <section className="content-section page-section" aria-labelledby="admin-heading">
        <motion.div className="section-heading" initial="hidden" animate="visible" variants={reveal} transition={transition}><div><p className="section-kicker">Federation workspace</p><h2 id="admin-heading">Today at a glance</h2></div><span className="status-label status-green">Live data</span></motion.div>
        <motion.div className="stat-row" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}>
            {[["Pending verification", pendingWorkers.length], ["Bookings this week", (overview.bookingVolume || []).reduce((total, item) => total + item.count, 0)], ["Active workers", overview.activeWorkers]].map(([label, value]) => <motion.div key={label} variants={reveal} transition={transition}><span>{label}</span><strong>{value}</strong></motion.div>)}
        </motion.div>
        <div className="admin-grid">
            <motion.div className="admin-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}><div className="panel-heading"><h3>Workers awaiting review</h3><span>{pendingWorkers.length} pending</span></div>{!pendingWorkers.length && <p className="empty-state">No workers are awaiting review.</p>}{pendingWorkers.map((profile) => <motion.div className="review-row" key={profile._id} variants={reveal} transition={transition}><div><strong>{profile.userId?.name || "Unnamed worker"}</strong><span>{profile.skills?.join(", ") || "Skills not listed"}</span></div><div><button className="button button-small button-primary" onClick={() => verify(profile.userId?._id, "verified")}>Approve</button><button className="text-button" onClick={() => verify(profile.userId?._id, "rejected")}>Reject</button></div></motion.div>)}</motion.div>
            <motion.div className="admin-panel demand-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.08 } } }}><div className="panel-heading"><h3>Demand insights</h3><span>Live aggregation</span></div>{!demand.length && <p className="empty-state">No booking demand data yet.</p>}{demand.map((item) => <motion.div className="demand-row" key={item._id} variants={reveal} transition={transition}><div><span>{item._id}</span><strong>{item.count} requests</strong></div><div className="demand-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${(item.count / maxDemand) * 100}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.8, ease: "easeOut" }} /></div></motion.div>)}</motion.div>
        </div>
        <motion.div className="admin-panel volume-panel" initial="hidden" animate="visible" variants={reveal} transition={transition}><div className="panel-heading"><h3>Booking volume</h3><span>Last 7 days</span></div>{!bookingVolume.length && <p className="empty-state">No booking volume data yet.</p>}<div className="volume-chart">{bookingVolume.map((item) => <div className="volume-column" key={item._id}><motion.i initial={{ height: 0 }} animate={{ height: `${(item.count / maxBookings) * 100}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }} title={`${item.count} bookings`} /><span>{item._id.slice(5)}</span></div>)}</div></motion.div>
        {message && <p className="lead-copy" role="status">{message}</p>}
    </section>;
}

export default AdminDashboard;
