import { motion, useReducedMotion } from "framer-motion";

const pendingWorkers = [
    ["Kavita Sharma", "Plumber"],
    ["Arjun Singh", "Driver"],
    ["Farida Begum", "Domestic help"],
];
const demand = [["Plumbing", 84], ["Electrical", 68], ["Carpentry", 51], ["Domestic help", 37]];
const reveal = { hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } };

function AdminDashboard() {
    const reduceMotion = useReducedMotion();
    const transition = reduceMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" };
    const stagger = reduceMotion ? 0 : 0.08;

    return <section className="content-section page-section" aria-labelledby="admin-heading">
        <motion.div className="section-heading" initial="hidden" animate="visible" variants={reveal} transition={transition}>
            <div><p className="section-kicker">Federation workspace</p><h2 id="admin-heading">Today at a glance</h2></div>
            <span className="status-label status-green">System healthy</span>
        </motion.div>
        <motion.div className="stat-row" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: stagger } } }}>
            {[["Pending verification", "08"], ["Bookings this week", "47"], ["Active workers", "126"]].map(([label, value]) => <motion.div key={label} variants={reveal} transition={transition} whileHover={reduceMotion ? undefined : { y: -4 }} whileTap={reduceMotion ? undefined : { scale: 0.98 }}><span>{label}</span><strong>{value}</strong></motion.div>)}
        </motion.div>
        <div className="admin-grid">
            <motion.div className="admin-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: stagger } } }}>
                <div className="panel-heading"><h3>Workers awaiting review</h3><span>08 pending</span></div>
                {pendingWorkers.map(([name, role]) => <motion.div className="review-row" key={name} variants={reveal} transition={transition}><div><strong>{name}</strong><span>{role} · Received today</span></div><div><button className="button button-small button-primary">Approve</button><button className="text-button">Review</button></div></motion.div>)}
            </motion.div>
            <motion.div className="admin-panel demand-panel" initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: stagger } } }}>
                <div className="panel-heading"><h3>Demand insights</h3><span>Last 7 days</span></div>
                {demand.map(([name, value]) => <motion.div className="demand-row" key={name} variants={reveal} transition={transition}><div><span>{name}</span><strong>{value} requests</strong></div><div className="demand-bar"><motion.i initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: 0.25, ease: "easeOut" }} /></div></motion.div>)}
            </motion.div>
        </div>
    </section>;
}

export default AdminDashboard;
