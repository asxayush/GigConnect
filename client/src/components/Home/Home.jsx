import { useEffect, useState } from "react";
import WorkerCard from "../WorkerCard/WorkerCard";
import BookingTicket from "../BookingTicket/BookingTicket";
import StatusTracker from "../StatusTracker/StatusTracker";
import { getBookings, getWorkers, login, register } from "../../api";

const services = [
    { icon: "⚡", name: "Electrician", hindi: "बिजली" },
    { icon: "♒", name: "Plumber", hindi: "प्लम्बर" },
    { icon: "⌂", name: "Carpenter", hindi: "बढ़ई" },
    { icon: "✦", name: "Domestic help", hindi: "घरेलू मदद" },
    { icon: "▣", name: "Driver", hindi: "ड्राइवर" },
    { icon: "♧", name: "Gardener", hindi: "माली" },
];

const fallbackWorkers = [
    { name: "Ramesh Kumar", initials: "RK", role: "Electrician", area: "Lajpat Nagar", experience: 12, skills: ["Wiring", "Fans", "Inverters"], rating: "4.9", jobs: 186, distance: "1.8" },
    { name: "Sunita Devi", initials: "SD", role: "Plumber", area: "Saket", experience: 9, skills: ["Pipes", "Leaks", "Fittings"], rating: "4.8", jobs: 132, distance: "2.4" },
    { name: "Imran Khan", initials: "IK", role: "Carpenter", area: "Kalkaji", experience: 15, skills: ["Furniture", "Doors", "Repairs"], rating: "4.9", jobs: 214, distance: "3.1" },
];

const bookings = [
    { id: "GC-1048", service: "Ceiling fan repair", status: "Assigned", date: "18 Sep 2026", time: "10:30 AM", address: "B-42, Lajpat Nagar II" },
    { id: "GC-1031", service: "Kitchen pipe fitting", status: "Completed", date: "12 Sep 2026", time: "4:00 PM", address: "27, Saket Extension" },
];

function ServiceStrip({ selected, onSelect }) {
    return <div className="service-strip" aria-label="Choose a service">{services.map((service) => <button className={`service-item ${selected === service.name ? "is-selected" : ""}`} key={service.name} onClick={() => onSelect(service.name)}><span className="service-icon" aria-hidden="true">{service.icon}</span><span>{service.name}</span><small>{service.hindi}</small></button>)}</div>;
}

function Home({ onNavigate }) {
    const [service, setService] = useState("Plumber");
    const [when, setWhen] = useState("Tomorrow");
    const [matches, setMatches] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [workers, setWorkers] = useState(fallbackWorkers);
    const [workerSource, setWorkerSource] = useState("demo");
    useEffect(() => {
        getWorkers(service)
            .then(({ data }) => {
                if (!data?.length) return;
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
            .catch(() => setWorkerSource("demo"));
    }, [service]);
    const showMatches = () => { setMatches(true); document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" }); };
    return <>
        <section className="hero-section" id="home"><div className="hero-copy"><p className="section-kicker">Cooperative-owned service network</p><h1>Reliable help from workers your neighbourhood trusts.</h1><p className="hero-description">Book verified cooperative workers directly. Fair work for them, dependable service for you.</p><div className="booking-bar" aria-label="Quick booking"><span className="booking-prefix">Need a</span><select value={service} onChange={(event) => setService(event.target.value)} aria-label="Choose service">{services.map((item) => <option key={item.name}>{item.name}</option>)}</select><span className="booking-prefix">by</span><select value={when} onChange={(event) => setWhen(event.target.value)} aria-label="Choose date"><option>Tomorrow</option><option>This weekend</option><option>Next week</option></select><button className="voice-button" type="button">🎤 Bol ke bataye</button><button className="button button-primary" onClick={showMatches}>Book Now</button></div><div className="trust-line"><span>✓ ID-verified workers</span><span>✓ No hidden commission</span><span>✓ Local cooperative support</span></div></div><div className="hero-note"><span className="hero-note-number">01</span><p>Every booking strengthens the people who keep our homes and neighbourhoods running.</p></div></section>
        <section className="section-band" aria-labelledby="services-heading"><div className="section-heading"><div><p className="section-kicker">Find practical help</p><h2 id="services-heading">What needs doing?</h2></div><span className="section-count">06 services</span></div><ServiceStrip selected={service} onSelect={setService} /></section>
        {matches && <section className="content-section" id="matches" aria-labelledby="matches-heading"><div className="section-heading"><div><p className="section-kicker">{service} · {when}</p><h2 id="matches-heading">Verified workers near you</h2></div><span className="section-count">{workerSource === "api" ? "Live cooperative directory" : "Demo directory"}</span><button className="text-button" onClick={() => setMatches(false)}>Clear search</button></div><div className="worker-list">{workers.filter((worker) => workerSource === "api" || worker.role === service || service === "Plumber" || worker.skills.includes(service)).map((worker) => <WorkerCard key={worker.name} worker={worker} onBook={setSelectedWorker} />)}</div>{selectedWorker && <div className="confirmation-strip"><strong>{selectedWorker.name}</strong> is ready for your request. <button className="button button-primary button-small" onClick={() => onNavigate("booking")}>Continue to booking</button></div>}</section>}
        <section className="content-section trust-section" aria-labelledby="trust-heading"><div><p className="section-kicker">Built for the people behind the work</p><h2 id="trust-heading">A fairer way to get things done.</h2></div><div className="trust-grid"><div><strong>01</strong><h3>Verified locally</h3><p>Federation teams review worker profiles, skills and certifications before they appear here.</p></div><div><strong>02</strong><h3>Owned cooperatively</h3><p>Your booking reaches the worker directly, without a platform commission taking their share.</p></div><div><strong>03</strong><h3>Help when it matters</h3><p>Field coordinators can register workers and support customers who prefer a human touch.</p></div></div></section>
    </>;
}

function BookingView({ onNavigate }) {
    const [items, setItems] = useState(bookings);
    const [live, setLive] = useState(false);
    useEffect(() => {
        const token = localStorage.getItem("gigconnect_token");
        if (!token) return;
        getBookings(token).then(({ data }) => {
            if (!data?.length) return;
            setItems(data.map((item) => ({ id: item._id, service: item.serviceCategory, status: item.status, date: new Date(item.scheduledAt).toLocaleDateString(), time: new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), address: item.address })));
            setLive(true);
        }).catch(() => setLive(false));
    }, []);
    return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Customer workspace</p><h2>Your bookings</h2></div><span className="section-count">{live ? "Live bookings" : "Demo bookings"}</span><button className="button button-primary" onClick={() => onNavigate("home")}>New booking</button></div><div className="booking-list">{items.map((booking) => <BookingTicket key={booking.id} booking={booking} onOpen={() => onNavigate("detail")} />)}</div></section>;
}
function DetailView({ onNavigate }) { return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Booking GC-1048</p><h2>Ceiling fan repair</h2></div><span className="status-label status-green">Assigned</span></div><div className="detail-layout"><div className="detail-panel"><StatusTracker current="Assigned" /><dl className="booking-facts"><div><dt>Scheduled</dt><dd>18 Sep 2026, 10:30 AM</dd></div><div><dt>Address</dt><dd>B-42, Lajpat Nagar II, New Delhi</dd></div><div><dt>Service fee</dt><dd>₹450 estimated</dd></div></dl></div><div><WorkerCard worker={fallbackWorkers[0]} onBook={() => { }} /><button className="button button-secondary full-button" onClick={() => onNavigate("rating")}>Rate this service</button></div></div></section>; }
function WorkerRegistration() { return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Worker onboarding</p><h2>Register a cooperative worker</h2></div><span className="form-note">Self or coordinator assisted</span></div><form className="registry-form" onSubmit={(event) => event.preventDefault()}><label>Full name<input required placeholder="e.g. Meena Kumari" /></label><label>Phone number<input required type="tel" placeholder="+91 98765 43210" /></label><label>Area<input required placeholder="e.g. Rohini, Delhi" /></label><label>Primary skill<select><option>Electrician</option><option>Plumber</option><option>Carpenter</option><option>Domestic help</option><option>Driver</option></select></label><label className="wide-field">Skills and experience<textarea rows="3" placeholder="Describe practical skills and years of experience" /></label><label className="wide-field file-field">Certificate or ID<input type="file" /></label><label className="availability"><input type="checkbox" defaultChecked /> Available for new work</label><button className="button button-primary" type="submit">Save worker profile</button></form></section>; }
function AdminView() { return <section className="content-section page-section"><div className="section-heading"><div><p className="section-kicker">Federation workspace</p><h2>Today at a glance</h2></div><span className="status-label status-green">System healthy</span></div><div className="stat-row"><div><span>Pending verification</span><strong>08</strong></div><div><span>Bookings this week</span><strong>47</strong></div><div><span>Active workers</span><strong>126</strong></div></div><div className="admin-grid"><div className="admin-panel"><div className="panel-heading"><h3>Workers awaiting review</h3><span>08 pending</span></div>{["Kavita Sharma · Plumber", "Arjun Singh · Driver", "Farida Begum · Domestic help"].map((person) => <div className="review-row" key={person}><div><strong>{person.split(" · ")[0]}</strong><span>{person.split(" · ")[1]} · Received today</span></div><div><button className="button button-small button-primary">Approve</button><button className="text-button">Review</button></div></div>)}</div><div className="admin-panel demand-panel"><div className="panel-heading"><h3>Demand insights</h3><span>Last 7 days</span></div>{[["Plumbing", 84], ["Electrical", 68], ["Carpentry", 51], ["Domestic help", 37]].map(([name, value]) => <div className="demand-row" key={name}><div><span>{name}</span><strong>{value} requests</strong></div><div className="demand-bar"><i style={{ width: `${value}%` }} /></div></div>)}</div></div></section>; }
function RatingView({ onNavigate }) { const [rating, setRating] = useState(0); return <section className="content-section page-section narrow-section"><p className="section-kicker">Booking GC-1031 · Completed</p><h2>How did Sunita's work go?</h2><p className="lead-copy">Your feedback helps the cooperative recognise reliable service.</p><div className="rating-picker" aria-label="Choose rating">{[1, 2, 3, 4, 5].map((value) => <button key={value} className={value <= rating ? "selected" : ""} onClick={() => setRating(value)} aria-label={`${value} stars`}>★</button>)}</div><textarea className="feedback-box" rows="5" placeholder="Tell us about the service (optional)" /><button className="button button-primary" onClick={() => onNavigate("booking")}>Submit feedback</button></section>; }

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
        } catch (error) { setMessage(error.message); }
    };
    return <section className="content-section page-section narrow-section"><p className="section-kicker">GigConnect account</p><h2>{mode === "login" ? "Welcome back" : "Join the cooperative network"}</h2><p className="lead-copy">Use the backend account to view live bookings and request services.</p><form className="registry-form" onSubmit={submit}>{mode === "register" && <label className="wide-field">Full name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>}<label className="wide-field">Email<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label><label className="wide-field">Password<input required type="password" minLength="6" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>{mode === "register" && <label className="wide-field">Account type<select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}><option value="customer">Customer</option><option value="worker">Worker</option></select></label>}<button className="button button-primary" type="submit">{mode === "login" ? "Sign in" : "Create account"}</button></form>{message && <p className="lead-copy">{message}</p>}<button className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>{mode === "login" ? "Create a new account" : "I already have an account"}</button></section>;
}

export { Home, BookingView, DetailView, WorkerRegistration, AdminView, RatingView, AuthView };
export default Home;
