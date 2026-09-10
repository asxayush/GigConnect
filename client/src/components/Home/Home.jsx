import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { useTranslation } from "react-i18next";
import WorkerCard from "../WorkerCard/WorkerCard";
import BookingTicket from "../BookingTicket/BookingTicket";
import BookingForm from "../BookingTicket/BookingForm";
import StatusTracker from "../StatusTracker/StatusTracker";
import AadhaarModal from "../AadhaarModal/AadhaarModal";
import HeroBackground from "./HeroBackground";
import { getBookings, getWorkers, login, register, registerWorker, submitRating, updateBookingStatus, updateMyWorkerProfile } from "../../api";
import { showToast } from "../../toast";

const services = [
    { icon: "⚡", name: "Electrician", hindi: "बिजली" },
    { icon: "♒", name: "Plumber",     hindi: "प्लम्बर" },
    { icon: "⌂", name: "Carpenter",   hindi: "बढ़ई" },
    { icon: "✦", name: "Domestic help", hindi: "घरेलू मदद" },
    { icon: "▣", name: "Driver",      hindi: "ड्राइवर" },
    { icon: "♧", name: "Gardener",    hindi: "माली" },
];

function ServiceStrip({ selected, onSelect }) {
    return (
        <div className="service-strip" aria-label="Choose a service">
            {services.map((service) => (
                <button
                    key={service.name}
                    className={`service-item ${selected === service.name ? "is-selected" : ""}`}
                    onClick={() => onSelect(service.name)}
                >
                    <span className="service-icon" aria-hidden="true">{service.icon}</span>
                    <span>{service.name}</span>
                    <small>{service.hindi}</small>
                </button>
            ))}
        </div>
    );
}

function ScrollReveal({ children, className = "" }) {
    const ref = useRef(null);
    const visible = useInView(ref, { once: true, margin: "-12% 0px" });
    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0, y: 34 }}
            animate={visible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}

// Quick date helpers
function getTomorrow() {
    const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); return d;
}
function getThisWeekend() {
    const d = new Date();
    const day = d.getDay();
    const diff = day === 6 ? 7 : 6 - day;
    d.setDate(d.getDate() + diff); d.setHours(10, 0, 0, 0); return d;
}

function Home({ onNavigate }) {
    const { t } = useTranslation();
    const [service, setService] = useState("Plumber");
    const [selectedDate, setSelectedDate] = useState(getTomorrow());
    const [dateError, setDateError] = useState("");
    const [matches, setMatches] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [workers, setWorkers] = useState([]);
    const [workerSource, setWorkerSource] = useState("loading");
    const [workerError, setWorkerError] = useState("");

    useEffect(() => {
        const loadWorkers = (coordinates) =>
            getWorkers(service, coordinates)
                .then(({ data }) => {
                    if (!data?.length) { setWorkers([]); setWorkerSource("api"); return; }
                    setWorkers(data.map((profile) => ({
                        name: profile.userId?.name || "Cooperative worker",
                        initials: (profile.userId?.name || "CW").split(" ").map((p) => p[0]).join("").slice(0, 2),
                        role: profile.skills?.[0] || service,
                        area: profile.userId?.location?.area || "Nearby",
                        experience: profile.experience || 0,
                        skills: profile.skills || [],
                        rating: Number(profile.ratingAvg || 0).toFixed(1),
                        jobs: profile.jobsCompleted || 0,
                        distance: profile.distanceText || (profile.distanceKm != null ? `${profile.distanceKm} km` : "nearby"),
                        eta: profile.calculatedEta,
                        userId: profile.userId?._id,
                    })));
                    setWorkerSource("api");
                })
                .catch((error) => { setWorkers([]); setWorkerSource("error"); setWorkerError(error.message); });

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => loadWorkers({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => loadWorkers(),
                { enableHighAccuracy: false, timeout: 4000, maximumAge: 300000 },
            );
        } else loadWorkers();
    }, [service]);

    const showMatches = () => {
        if (!selectedDate || selectedDate < new Date()) {
            setDateError(t("hero.dateError"));
            return;
        }
        setDateError("");
        setMatches(true);
        document.getElementById("matches")?.scrollIntoView({ behavior: "smooth" });
    };

    const setToday = () => {
        const d = new Date(); d.setHours(d.getHours() + 1, 0, 0, 0); setSelectedDate(d); setDateError("");
    };
    const setTomorrow = () => { setSelectedDate(getTomorrow()); setDateError(""); };
    const setWeekend = () => { setSelectedDate(getThisWeekend()); setDateError(""); };

    return (
        <>
            <section className="hero-section" id="home">
                <div className="hero-card">
                    <p className="section-kicker">{t("hero.kicker")}</p>
                    <h1>{t("hero.title")}</h1>
                    <p className="hero-description">{t("hero.description")}</p>
                    <div className="booking-bar" aria-label="Quick booking">
                        <span className="booking-prefix">{t("hero.needA")}</span>
                        <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Choose service">
                            {services.map((item) => <option key={item.name}>{item.name}</option>)}
                        </select>
                        <span className="booking-prefix">{t("hero.by")}</span>

                        {/* Quick date pills */}
                        <div className="booking-quick-dates">
                            <button type="button" className="quick-date-btn" onClick={setToday}>{t("quickDates.today")}</button>
                            <button type="button" className="quick-date-btn" onClick={setTomorrow}>{t("quickDates.tomorrow")}</button>
                            <button type="button" className="quick-date-btn" onClick={setWeekend}>{t("quickDates.weekend")}</button>
                        </div>

                        {/* Date-time picker */}
                        <DatePicker
                            selected={selectedDate}
                            onChange={(date) => { setSelectedDate(date); setDateError(""); }}
                            showTimeSelect
                            timeIntervals={60}
                            minDate={new Date()}
                            dateFormat="d MMM, h:mm aa"
                            placeholderText={t("booking.dateTime")}
                            className="booking-datepicker"
                            aria-label={t("booking.dateTime")}
                        />

                        <button type="button" className="voice-button">🎤 Bol ke bataye</button>
                        <button className="button button-primary" onClick={showMatches}>{t("hero.bookNow")}</button>
                    </div>
                    {dateError && <p className="error-message" role="alert" style={{ marginTop: 8 }}>{dateError}</p>}
                    <div className="trust-line">
                        <span>{t("hero.trustLine1")}</span>
                        <span>{t("hero.trustLine2")}</span>
                        <span>{t("hero.trustLine3")}</span>
                    </div>
                </div>
                <div className="hero-visual">
                    <HeroBackground />
                    <div className="mesh-label">{t("hero.meshLabel")}</div>
                </div>
            </section>

            <ScrollReveal className="scroll-section">
                <section className="section-band" aria-labelledby="services-heading">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">{t("services.findPracticalHelp")}</p>
                            <h2 id="services-heading">{t("hero.findLabel")}</h2>
                        </div>
                        <span className="section-count">{t("services.servicesCount")}</span>
                    </div>
                    <ServiceStrip selected={service} onSelect={setService} />
                </section>
            </ScrollReveal>

            {matches && (
                <section className="content-section" id="matches" aria-labelledby="matches-heading">
                    <div className="section-heading">
                        <div>
                            <p className="section-kicker">{service} · {selectedDate ? selectedDate.toLocaleDateString() : ""}</p>
                            <h2 id="matches-heading">{t("workers.heading")}</h2>
                        </div>
                        <span className="section-count">{workerSource === "loading" ? t("workers.loadingDirectory") : t("workers.liveDirectory")}</span>
                        <button className="text-button" onClick={() => setMatches(false)}>{t("workers.clearSearch")}</button>
                    </div>
                    {workerSource === "loading" && <p className="lead-copy">{t("workers.loading")}</p>}
                    {workerError && <p className="error-message" role="alert">{workerError}</p>}
                    {workerSource !== "loading" && !workerError && !workers.length && (
                        <p className="empty-state">{t("workers.empty")}</p>
                    )}
                    <div className="worker-list">
                        {workers.map((worker) => (
                            <WorkerCard
                                key={worker.userId || worker.name}
                                worker={worker}
                                onBook={(w) => {
                                    setSelectedWorker(w);
                                    onNavigate("booking", { ...w, prefilledDate: selectedDate?.toISOString() });
                                }}
                            />
                        ))}
                    </div>
                    {selectedWorker && (
                        <div className="confirmation-strip">
                            <strong>{selectedWorker.name}</strong> {t("workers.ready", { name: "" }).replace("{{name}}", "").trim()}
                        </div>
                    )}
                </section>
            )}

            <ScrollReveal className="scroll-section">
                <section className="content-section trust-section" aria-labelledby="trust-heading">
                    <div>
                        <p className="section-kicker">{t("trust.kicker")}</p>
                        <h2 id="trust-heading">{t("hero.trust")}</h2>
                    </div>
                    <div className="trust-grid">
                        <div>
                            <strong>01</strong>
                            <h3>{t("trust.title01")}</h3>
                            <p>{t("trust.body01")}</p>
                        </div>
                        <div>
                            <strong>02</strong>
                            <h3>{t("trust.title02")}</h3>
                            <p>{t("trust.body02")}</p>
                        </div>
                        <div>
                            <strong>03</strong>
                            <h3>{t("trust.title03")}</h3>
                            <p>{t("trust.body03")}</p>
                        </div>
                    </div>
                </section>
            </ScrollReveal>
        </>
    );
}

function BookingView({ onNavigate, selectedWorker }) {
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const token = localStorage.getItem("gigconnect_token");
    const [state, setState] = useState(token ? "loading" : "signed-out");
    const [showForm, setShowForm] = useState(Boolean(selectedWorker));

    useEffect(() => {
        if (!token) return;
        getBookings(token)
            .then(({ data }) => {
                setItems(data.map((item) => ({
                    ...item,
                    id: item._id,
                    service: item.serviceCategory,
                    date: new Date(item.scheduledAt).toLocaleDateString(),
                    time: new Date(item.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                })));
                setState("ready");
            })
            .catch(() => setState("error"));
    }, [token]);

    const addBooking = (booking) => {
        const item = {
            ...booking,
            id: booking._id,
            service: booking.serviceCategory,
            date: new Date(booking.scheduledAt).toLocaleDateString(),
            time: new Date(booking.scheduledAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setItems((current) => [item, ...current]);
        setState("ready");
        setShowForm(false);
    };

    return (
        <section className="content-section page-section">
            <div className="section-heading">
                <div>
                    <p className="section-kicker">{t("booking.kicker")}</p>
                    <h2>{t("booking.heading")}</h2>
                </div>
                <span className="section-count">{t("booking.liveBookings")}</span>
                <button className="button button-primary" onClick={() => setShowForm(true)}>{t("booking.newBooking")}</button>
            </div>
            {showForm && (
                <BookingForm
                    worker={selectedWorker}
                    prefilledDate={selectedWorker?.prefilledDate}
                    onCreated={addBooking}
                    onCancel={() => setShowForm(false)}
                />
            )}
            {state === "loading" && <p className="lead-copy">{t("booking.loading")}</p>}
            {state === "signed-out" && !showForm && <p className="empty-state">{t("booking.signInPrompt")}</p>}
            {state === "error" && <p className="error-message" role="alert">{t("booking.error")}</p>}
            {state === "ready" && !items.length && !showForm && <p className="empty-state">{t("booking.empty")}</p>}
            <div className="booking-list">
                {items.map((booking) => (
                    <BookingTicket key={booking.id} booking={booking} onOpen={() => onNavigate("detail", booking)} />
                ))}
            </div>
        </section>
    );
}

function DetailView({ booking, onNavigate }) {
    const { t } = useTranslation();
    const [message, setMessage] = useState("");

    if (!booking) return (
        <section className="content-section page-section">
            <p className="empty-state">{t("detail.selectPrompt")}</p>
        </section>
    );

    const worker = booking.workerId;
    const role = JSON.parse(localStorage.getItem("gigconnect_user") || "null")?.role;
    const nextStatus =
        role === "worker" && booking.status === "Assigned" ? "In Progress" :
        role === "worker" && booking.status === "In Progress" ? "Completed" :
        role === "customer" && booking.status === "Requested" ? "Cancelled" : null;

    const advance = async () => {
        try {
            const result = await updateBookingStatus(booking.id, nextStatus, localStorage.getItem("gigconnect_token"));
            Object.assign(booking, result.data, { status: result.data.status });
            setMessage(`Booking marked ${result.data.status}.`);
        } catch (error) {
            showToast(error.message);
            setMessage(error.message);
        }
    };

    return (
        <section className="content-section page-section">
            <div className="section-heading">
                <div>
                    <p className="section-kicker">Booking {booking.id}</p>
                    <h2>{booking.service}</h2>
                </div>
                <span className="status-label">{booking.status}</span>
            </div>
            <div className="detail-layout">
                <div className="detail-panel">
                    <StatusTracker current={booking.status} />
                    <dl className="booking-facts">
                        <div><dt>{t("detail.scheduled")}</dt><dd>{booking.date}, {booking.time}</dd></div>
                        <div><dt>{t("detail.address")}</dt><dd>{booking.address}</dd></div>
                        <div><dt>{t("detail.serviceFee")}</dt><dd>{booking.price ? `₹${booking.price}` : t("detail.toBeConfirmed")}</dd></div>
                    </dl>
                    {nextStatus && (
                        <button className="button button-primary" onClick={advance}>
                            {nextStatus === "Cancelled" ? t("detail.cancelBooking") : t("detail.markStatus", { status: nextStatus })}
                        </button>
                    )}
                    {message && <p className="lead-copy" role="status">{message}</p>}
                </div>
                {worker && (
                    <div className="detail-panel">
                        <h3>{worker.name}</h3>
                        <p className="lead-copy">{t("detail.assignedWorker")}</p>
                        {booking.status === "Completed" && (
                            <button className="button button-secondary full-button" onClick={() => onNavigate("rating", booking)}>
                                {t("detail.rateService")}
                            </button>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

function WorkerRegistration() {
    const { t } = useTranslation();
    const [message, setMessage] = useState("");
    const [phoneValue, setPhoneValue] = useState("");
    const [showAadhaarModal, setShowAadhaarModal] = useState(false);
    const [aadhaarVerified, setAadhaarVerified] = useState(false);

    const submit = async (event) => {
        event.preventDefault();
        const token = localStorage.getItem("gigconnect_token");
        const user = JSON.parse(localStorage.getItem("gigconnect_user") || "null");
        if (!token) { setMessage(t("register.signInFirst")); return; }
        const form = new FormData(event.currentTarget);
        form.append("skills", JSON.stringify([form.get("skill")]));
        form.append("location", JSON.stringify({ area: form.get("area") }));
        form.delete("skill");
        form.delete("area");
        try {
            if (user?.role === "worker") await updateMyWorkerProfile(form, token);
            else if (["admin", "coordinator"].includes(user?.role)) await registerWorker(form, token);
            else { setMessage(t("register.roleError")); return; }
            setMessage(user.role === "worker" ? t("register.updated") : t("register.submitted"));
            event.currentTarget.reset();
            setPhoneValue("");
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <section className="content-section page-section">
            <div className="section-heading">
                <div>
                    <p className="section-kicker">{t("register.kicker")}</p>
                    <h2>{t("register.heading")}</h2>
                </div>
                <span className="form-note">{t("register.formNote")}</span>
            </div>
            <form className="registry-form" onSubmit={submit}>
                <label>
                    {t("register.fullName")}
                    <input name="name" required placeholder={t("register.fullNamePlaceholder")} />
                </label>
                <label>
                    {t("register.phone")}
                    <input
                        name="phone"
                        required
                        type="tel"
                        placeholder={t("register.phonePlaceholder")}
                        value={phoneValue}
                        onChange={(e) => setPhoneValue(e.target.value)}
                    />
                </label>
                <label>
                    {t("register.area")}
                    <input name="area" required placeholder={t("register.areaPlaceholder")} />
                </label>
                <label>
                    {t("register.primarySkill")}
                    <select name="skill">
                        <option>Electrician</option>
                        <option>Plumber</option>
                        <option>Carpenter</option>
                        <option>Domestic help</option>
                        <option>Driver</option>
                    </select>
                </label>
                <label className="wide-field">
                    {t("register.skillsExperience")}
                    <textarea name="experience" rows="3" placeholder={t("register.skillsPlaceholder")} />
                </label>
                <label className="wide-field file-field">
                    {t("register.workerPhoto")}
                    <input name="photo" type="file" accept="image/jpeg,image/png" />
                </label>
                <label className="wide-field file-field">
                    {t("register.certificate")}
                    <input name="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png" />
                </label>

                {/* Aadhaar verification button */}
                <div className="wide-field" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                    <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => setShowAadhaarModal(true)}
                    >
                        {t("register.verifyAadhaar")}
                    </button>
                    {aadhaarVerified && (
                        <span className="verified-badge" style={{ fontSize: 16 }}>
                            {t("register.aadhaarVerified")}
                        </span>
                    )}
                </div>

                <label className="availability">
                    <input name="availability" type="checkbox" defaultChecked />
                    {t("register.available")}
                </label>
                <button className="button button-primary" type="submit">{t("register.save")}</button>
            </form>
            {message && <p className="lead-copy" role="status">{message}</p>}

            {showAadhaarModal && (
                <AadhaarModal
                    phone={phoneValue}
                    onClose={() => setShowAadhaarModal(false)}
                    onVerified={(workerData) => {
                        setAadhaarVerified(true);
                        setShowAadhaarModal(false);
                        showToast(t("register.aadhaarVerified"));
                    }}
                />
            )}
        </section>
    );
}

function RatingView({ booking, onNavigate }) {
    const { t } = useTranslation();
    const [rating, setRating] = useState(0);
    const [message, setMessage] = useState("");

    const submit = async () => {
        const token = localStorage.getItem("gigconnect_token");
        if (!token || !booking) { setMessage(t("rating.signInFirst")); return; }
        try {
            await submitRating({ bookingId: booking.id, stars: rating }, token);
            setMessage(t("rating.submitted"));
        } catch (error) {
            setMessage(error.message);
        }
    };

    return (
        <section className="content-section page-section narrow-section">
            <p className="section-kicker">{t("rating.kicker")}</p>
            <h2>{t("rating.heading")}</h2>
            <p className="lead-copy">{t("rating.body")}</p>
            <div className="rating-picker" aria-label="Choose rating">
                {[1, 2, 3, 4, 5].map((value) => (
                    <button
                        key={value}
                        className={value <= rating ? "selected" : ""}
                        onClick={() => setRating(value)}
                        aria-label={`${value} stars`}
                    >★</button>
                ))}
            </div>
            <textarea className="feedback-box" rows="5" placeholder={t("rating.placeholder")} />
            <button className="button button-primary" disabled={!rating} onClick={submit}>{t("rating.submit")}</button>
            {message && <p className="lead-copy" role="status">{message}</p>}
            <button className="text-button" onClick={() => onNavigate("booking")}>{t("rating.back")}</button>
        </section>
    );
}

function AuthView({ onNavigate }) {
    const { t } = useTranslation();
    const [mode, setMode] = useState("login");
    const [form, setForm] = useState({ name: "", email: "", password: "", role: "customer" });
    const [message, setMessage] = useState("");

    const submit = async (event) => {
        event.preventDefault();
        setMessage(t("auth.connecting"));
        try {
            const result = mode === "login"
                ? await login({ email: form.email, password: form.password })
                : await register(form);
            localStorage.setItem("gigconnect_token", result.data.token);
            localStorage.setItem("gigconnect_user", JSON.stringify(result.data.user));
            setMessage(`Welcome, ${result.data.user.name}`);
            onNavigate("booking");
        } catch (error) {
            showToast(error.message);
            setMessage(error.message);
        }
    };

    return (
        <section className="content-section page-section narrow-section">
            <p className="section-kicker">{t("auth.kicker")}</p>
            <h2>{mode === "login" ? t("auth.loginHeading") : t("auth.registerHeading")}</h2>
            <p className="lead-copy">{t("auth.body")}</p>
            <form className="registry-form" onSubmit={submit}>
                {mode === "register" && (
                    <label className="wide-field">
                        {t("auth.nameLabel")}
                        <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </label>
                )}
                <label className="wide-field">
                    {t("auth.emailLabel")}
                    <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </label>
                <label className="wide-field">
                    {t("auth.passwordLabel")}
                    <input required type="password" minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </label>
                {mode === "register" && (
                    <label className="wide-field">
                        {t("auth.accountType")}
                        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                            <option value="customer">{t("auth.customer")}</option>
                            <option value="worker">{t("auth.worker")}</option>
                        </select>
                    </label>
                )}
                <button className="button button-primary" type="submit">
                    {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
                </button>
            </form>
            {message && <p className="lead-copy">{message}</p>}
            <button className="text-button" onClick={() => setMode(mode === "login" ? "register" : "login")}>
                {mode === "login" ? t("auth.createNew") : t("auth.haveAccount")}
            </button>
        </section>
    );
}

export { Home, BookingView, DetailView, WorkerRegistration, RatingView, AuthView };
export default Home;
