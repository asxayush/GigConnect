import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import WorkerCard from "../WorkerCard/WorkerCard";
import BookingTicket from "../BookingTicket/BookingTicket";
import BookingForm from "../BookingTicket/BookingForm";
import StatusTracker from "../StatusTracker/StatusTracker";
import { getBookings, getWorkers, login, register, registerWorker, submitRating, updateBookingStatus, updateMyWorkerProfile } from "../../api";
import { showToast } from "../../toast";

const user = JSON.parse(localStorage.getItem("gigconnect_user") || "null");

const services = [
    { icon: "⚡", name: "Electrician", hindi: "बिजली" },
    { icon: "♒", name: "Plumber", hindi: "प्लम्बर" },
    { icon: "⌂", name: "Carpenter", hindi: "बढ़ई" },
    { icon: "✦", name: "Domestic help", hindi: "घरेलू मदद" },
    { icon: "▣", name: "Driver", hindi: "ड्राइवर" },
    { icon: "♧", name: "Gardener", hindi: "माली" },
];

function ServiceStrip({ selected, onSelect }) {
    return <div className="service-strip" aria-label="Choose a service">{services.map((service) => <button className={`service-item ${selected === service.name ? "is-selected" : ""}`} key={service.name} onClick={() => onSelect(service.name)}><span className="service-icon" aria-hidden="true">{service.icon}</span><span>{service.name}</span><small>{service.hindi}</small></button>)}</div>;
}

function DigitalMesh() {
    const glyphs = Array.from({ length: 144 }, (_, index) => ({
        id: index,
        delay: `${(index % 12) * 0.07 + Math.floor(index / 12) * 0.025}s`,
        drift: `${((index * 17) % 9) - 4}px`,
        turn: `${((index * 23) % 18) - 9}deg`,
        scale: `${0.78 + ((index * 11) % 35) / 100}`,
    }));

    return <div className="digital-mesh" aria-hidden="true">{glyphs.map((glyph) => <span className="mesh-glyph" key={glyph.id} style={{ "--delay": glyph.delay, "--drift": glyph.drift, "--turn": glyph.turn, "--scale": glyph.scale }}>{glyph.id % 5 === 0 ? "−" : "+"}</span>)}</div>;
}

function ScrollReveal({ children, className = "" }) {
    const ref = useRef(null);
    const visible = useInView(ref, { once: true, margin: "-12% 0px" });
    return <motion.div ref={ref} className={className} initial={{ opacity: 0, y: 34 }} animate={visible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>{children}</motion.div>;
}

function Home({ onNavigate, language = "en" }) {
    const copy = language === "hi" ? { kicker: "सहकारी सेवा नेटवर्क", title: "आपके पड़ोस के भरोसेमंद कामगारों से मदद पाएं।", description: "प्रमाणित सहकारी कामगारों को सीधे बुक करें।", find: "क्या काम करवाना है?", trust: "काम कराने का एक बेहतर तरीका।" } : { kicker: "Cooperative-owned service network", title: "Reliable help from workers your neighbourhood trusts.", description: "Book verified cooperative workers directly. Fair work for them, dependable service for you.", find: "What needs doing?", trust: "A fairer way to get things done." };
    const [service, setService] = useState("Plumber");
    const [when, setWhen] = useState("Tomorrow");
    const [matches, setMatches] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [workerSource, setWorkerSource] = useState("loading");
    const [workerError, setWorkerError] = useState("");
    useEffect(() => {
        const loadWorkers = (coordinates) => getWorkers(service, coordinates)
            .then(({ data }) => {
                if (!data?.length) { setWorkers([]); setWorkerSource("api"); return; }
                setWorkers(data.map((profile) => ({
                    name: profile.userId?.name || "Cooperative worker",
                    initials: (profile.userId?.name || "CW").split(" ").map((part) => part[0]).join("").slice(0, 2),
                    role: profile.skills?.[0] || service,
                    area: profile.userId?.location?.area || "Nearby",
                    experience: profile.experience || 0,
                    skills: profile.skills || [],
                    rating: Number(profile.ratingAvg || 0).toFixed(1),
                    jobs: profile.jobsCompleted || 0,
                    distance: "nearby",
                    userId: profile.userId?._id,
                })));
                setWorkerSource("api");
            })
            .catch((error) => { setWorkers([]); setWorkerSource("error"); setWorkerError(error.message); });
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => loadWorkers({ lat: position.coords.latitude, lng: position.coords.longitude }),
                () => loadWorkers(),
                { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 },
            );
        } else loadWorkers();
    }, [service]);
    const showMatches = () => { setMatches(true); document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" }); };
    return <>
        <section className="hero-section" id="home"><div className="hero-card"><p className="section-kicker">{copy.kicker}</p><h1>{copy.title}</h1><p className="hero-description">{copy.description}</p><div className="booking-bar" aria-label="Quick booking"><span className="booking-prefix">Need a</span><select value={service} onChange={(event) => setService(event.target.value)} aria-label="Choose service">{services.map((item) => <option key={item.name}>{item.name}</option>)}</select><span className="booking-prefix">by</span><select value={when} onChange={(event) => setWhen(event.target.value)} aria-label="Choose date"><option>Tomorrow</option><option>This weekend</option><option>Next week</option></select><button className="voice-button" type="button">🎤 Bol ke bataye</button><button className="button button-primary" onClick={showMatches}>Book Now</button></div><div className="trust-line"><span>✓ ID-verified workers</span><span>✓ No hidden commission</span><span>✓ Local cooperative support</span></div></div><div className="hero-visual"><DigitalMesh /><div className="mesh-label">LOCAL / VERIFIED / DIRECT</div></div></section>
        <ScrollReveal className="scroll-section"><section className="section-band" aria-labelledby="services-heading"><div className="section-heading"><div><p className="section-kicker">Find practical help</p><h2 id="services-heading">{copy.find}</h2></div><span className="section-count">06 services</span></div><ServiceStrip selected={service} onSelect={setService} /></section></ScrollReveal>
        {matches && <section className="content-section" id="matches" aria-labelledby="matches-heading"><div className="section-heading"><div><p className="section-kicker">{service} · {when}</p><h2 id="matches-heading">Verified workers near you</h2></div><span className="section-count">{workerSource === "loading" ? "Loading directory" : "Live cooperative directory"}</span><button className="text-button" onClick={() => setMatches(false)}>Clear search</button></div>{workerSource === "loading" && <p className="lead-copy">Finding verified workers...</p>}{workerError && <p className="error-message" role="alert">{workerError}</p>}{workerSource !== "loading" && !workerError && !workers.length && <p className="empty-state">No verified workers are available for this service yet.</p>}<div className="worker-list">{workers.map((worker) => <WorkerCard key={worker.userId || worker.name} worker={worker} onBook={(chosenWorker) => { setSelectedWorker(chosenWorker); onNavigate("booking", chosenWorker); }} />)}</div>{selectedWorker && <div className="confirmation-strip"><strong>{selectedWorker.name}</strong> is ready for your request.</div>}</section>}
        <ScrollReveal className="scroll-section"><section className="content-section trust-section" aria-labelledby="trust-heading"><div><p className="section-kicker">Built for the people behind the work</p><h2 id="trust-heading">{copy.trust}</h2></div><div className="trust-grid"><div><strong>01</strong><h3>Verified locally</h3><p>Federation teams review worker profiles, skills and certifications before they appear here.</p></div><div><strong>02</strong><h3>Owned cooperatively</h3><p>Your booking reaches the worker directly, without a platform commission taking their share.</p></div><div><strong>03</strong><h3>Help when it matters</h3><p>Field coordinators can register workers and support customers who prefer a human touch.</p></div></div></section></ScrollReveal>
    </>;
}

function BookingView({ onNavigate, selectedWorker }) {
    const [items, setItems] = useState([]);
    const token = localStorage.getItem("gigconnect_token");
    const [state, setState] = useState(token ? "loading" : "signed-out");
    const [showForm, setShowForm] = useState(Boolean(selectedWorker));
    useEffect(() => {
        if (!token) return;
        getBookings(token).then(({ data }) => {
            setItems(data.map((item) => ({ ...item, id: item._id, service: item.serviceCategory, date: new Date(item.scheduledAt).toLocaleDateString(), time: new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })));
            setState("ready");
        }).catch(() => setState("error"));
    }, [token]);
    const addBooking = (booking) => { const item = { ...booking, id: booking._id, service: booking.serviceCategory, date: new Date(booking.scheduledAt).toLocaleDateString(), time: new Date(booking.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }; setItems((current) => [item, ...current]); setState("ready"); setShowForm(false); };
    return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Customer workspace</p><h2>Your bookings</h2></div><span className="section-count">Live bookings</span><button className="button button-primary" onClick={() => setShowForm(true)}>New booking</button></div>{showForm && <BookingForm worker={selectedWorker} onCreated={addBooking} onCancel={() => setShowForm(false)} />}{state === "loading" && <p className="lead-copy">Loading your bookings...</p>}{state === "signed-out" && !showForm && <p className="empty-state">Sign in to create or view your bookings.</p>}{state === "error" && <p className="error-message" role="alert">Unable to load bookings. Please try again.</p>}{state === "ready" && !items.length && !showForm && <p className="empty-state">You have no bookings yet.</p>}<div className="booking-list">{items.map((booking) => <BookingTicket key={booking.id} booking={booking} onOpen={() => onNavigate("detail", booking)} />)}</div></section>;
}
function DetailView({ booking, onNavigate }) { const [message, setMessage] = useState(""); if (!booking) return <section className="content-section page-section"><p className="empty-state">Select a booking to view its details.</p></section>; const worker = booking.workerId; const role = JSON.parse(localStorage.getItem("gigconnect_user") || "null")?.role; const nextStatus = role === "worker" && booking.status === "Assigned" ? "In Progress" : role === "worker" && booking.status === "In Progress" ? "Completed" : role === "customer" && booking.status === "Requested" ? "Cancelled" : null; const advance = async () => { try { const result = await updateBookingStatus(booking.id, nextStatus, localStorage.getItem("gigconnect_token")); Object.assign(booking, result.data, { status: result.data.status }); setMessage(`Booking marked ${result.data.status}.`); } catch (error) { showToast(error.message); setMessage(error.message); } }; return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Booking {booking.id}</p><h2>{booking.service}</h2></div><span className="status-label">{booking.status}</span></div><div className="detail-layout"><div className="detail-panel"><StatusTracker current={booking.status} /><dl className="booking-facts"><div><dt>Scheduled</dt><dd>{booking.date}, {booking.time}</dd></div><div><dt>Address</dt><dd>{booking.address}</dd></div><div><dt>Service fee</dt><dd>{booking.price ? `₹${booking.price}` : "To be confirmed"}</dd></div></dl>{nextStatus && <button className="button button-primary" onClick={advance}>{nextStatus === "Cancelled" ? "Cancel booking" : `Mark ${nextStatus}`}</button>}{message && <p className="lead-copy" role="status">{message}</p>}</div>{worker && <div className="detail-panel"><h3>{worker.name}</h3><p className="lead-copy">Assigned worker</p>{booking.status === "Completed" && <button className="button button-secondary full-button" onClick={() => onNavigate("rating", booking)}>Rate this service</button>}</div>}</div></section>; }
function WorkerRegistration() { const [message, setMessage] = useState(""); const submit = async (event) => { event.preventDefault(); const token = localStorage.getItem("gigconnect_token"); const user = JSON.parse(localStorage.getItem("gigconnect_user") || "null"); if (!token) { setMessage("Sign in before submitting a worker profile."); return; } const form = new FormData(event.currentTarget); form.append("skills", JSON.stringify([form.get("skill")])); form.append("location", JSON.stringify({ area: form.get("area") })); form.delete("skill"); form.delete("area"); try { if (user?.role === "worker") await updateMyWorkerProfile(form, token); else if (["admin", "coordinator"].includes(user?.role)) await registerWorker(form, token); else { setMessage("Sign in as a worker, federation admin, or field coordinator."); return; } setMessage(user.role === "worker" ? "Your worker profile was updated." : "Worker profile submitted for verification."); event.currentTarget.reset(); } catch (error) { setMessage(error.message); } }; return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Worker onboarding</p><h2>Register a cooperative worker</h2></div><span className="form-note">Self or coordinator assisted</span></div><form className="registry-form" onSubmit={submit}><label>Full name<input name="name" required placeholder="Full name" /></label><label>Phone number<input name="phone" required type="tel" placeholder="Phone number" /></label><label>Area<input name="area" required placeholder="Area" /></label><label>Primary skill<select name="skill"><option>Electrician</option><option>Plumber</option><option>Carpenter</option><option>Domestic help</option><option>Driver</option></select></label><label className="wide-field">Skills and experience<textarea name="experience" rows="3" placeholder="Skills and experience" /></label><label className="wide-field file-field">Worker photo<input name="photo" type="file" accept="image/jpeg,image/png" required={user?.role !== "worker"} /></label><label className="wide-field file-field">Trade or skill certificate (Optional)<input name="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" /></label><label className="availability"><input name="availability" type="checkbox" defaultChecked /> Available for new work</label><button className="button button-primary" type="submit">Save worker profile</button></form>{message && <p className="lead-copy" role="status">{message}</p>}</section>; }
function RatingView({ booking, onNavigate }) { const [rating, setRating] = useState(0); const [message, setMessage] = useState(""); const submit = async () => { const token = localStorage.getItem("gigconnect_token"); if (!token || !booking) { setMessage("Sign in and select a completed booking first."); return; } try { await submitRating({ bookingId: booking.id, stars: rating }, token); setMessage("Feedback submitted."); } catch (error) { setMessage(error.message); } }; return <section className="content-section page-section narrow-section"><p className="section-kicker">Completed booking</p><h2>Rate your service</h2><p className="lead-copy">Your feedback helps the cooperative recognise reliable service.</p><div className="rating-picker" aria-label="Choose rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={value <= rating ? "selected" : ""} onClick={() => setRating(value)} aria-label={`${value} stars`}>★</button>)}</div><textarea className="feedback-box" rows="5" placeholder="Tell us about the service (optional)" /><button className="button button-primary" disabled={!rating} onClick={submit}>Submit feedback</button>{message && <p className="lead-copy" role="status">{message}</p>}<button className="text-button" onClick={() => onNavigate("booking")}>Back to bookings</button></section>; }

function AuthView({ onNavigate }) {
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
    const [message, setMessage] = useState("");
    const submit = async (event) => {
        event.preventDefault(); setMessage("Connecting...");
        try {
            const result = mode === "login" ? await login({ email: form.email, password: form.password }) : await register(form);
            localStorage.setItem("gigconnect_token", result.data.token);
            localStorage.setItem("gigconnect_user", JSON.stringify(result.data.user));
            setMessage(`Welcome, ${result.data.user.name}`); onNavigate("booking");
        } catch (error) { showToast(error.message); setMessage(error.message); }
    };
    return <section className="content-section page-section narrow-section"><p className="section-kicker">GigConnect account</p><h2>{mode === "login" ? "Welcome back" : "Join the cooperative network"}</h2><p className="lead-copy">Use the backend account to view live bookings and request services.</p><form className="registry-form" onSubmit={submit}>{mode === "register" && <label className="wide-field">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}<label className="wide-field">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="wide-field">Password<input required type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{mode === "register" && <label className="wide-field">Account type<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="customer">Customer</option><option value="worker">Worker</option></select></label>}<button className="button button-primary" type="submit">{mode === "login" ? "Sign in" : "Create account"}</button></form>{message && <p className="lead-copy">{message}</p>}<button className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create a new account" : "I already have an account"}</button></section>;
}

export { Home, BookingView, DetailView, WorkerRegistration, RatingView, AuthView };
export default Home;
