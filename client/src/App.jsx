import { useEffect, useState } from "react"
import { AuthView, BookingView, DetailView, Home, RatingView, WorkerRegistration } from "./components/Home/Home"
import AdminDashboard from "./components/AdminDashboard/AdminDashboard"
import SignUp from "./components/SignUp/SignUp"
import Toast from "./components/Toast/Toast"
import { showToast } from "./toast"
import './App.css'

function App() {
  const [view, setView] = useState("home")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [language, setLanguage] = useState(localStorage.getItem("gigconnect_language") || "en")
  useEffect(() => {
    const handleUnhandledError = (event) => showToast(event.reason?.message || "Something went wrong. Please try again.");
    window.addEventListener("unhandledrejection", handleUnhandledError);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledError);
  }, [])
  const navigate = (nextView, record = null) => {
    setView(nextView)
    if (record) setSelectedRecord(record)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }
  const toggleLanguage = () => { const next = language === "en" ? "hi" : "en"; setLanguage(next); localStorage.setItem("gigconnect_language", next) }

  return (
    <div className="app-shell">
      <Toast />
      <header className="site-header">
        <button className="brand" onClick={() => navigate("home")} aria-label="Go to GigConnect home"><span className="brand-mark">G</span><span>GigConnect</span></button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}>Find help</button>
          <button className={view === "booking" || view === "detail" ? "active" : ""} onClick={() => navigate("booking")}>My bookings</button>
          <button className={view === "register" ? "active" : ""} onClick={() => navigate("register")}>Register a worker</button>
          <button className={view === "admin" ? "active" : ""} onClick={() => navigate("admin")}>Federation desk</button>
        </nav>
        <button className="language-button" onClick={toggleLanguage}>{language === "en" ? "हिन्दी" : "English"}</button><button className="account-button" onClick={() => navigate("public-register")}>Join GigConnect</button>
      </header>
      <main>{view === "home" && <Home language={language} onNavigate={navigate} />}{view === "booking" && <BookingView selectedWorker={selectedRecord} onNavigate={navigate} />}{view === "detail" && <DetailView booking={selectedRecord} onNavigate={navigate} />}{view === "register" && <WorkerRegistration />}{view === "admin" && <AdminDashboard />}{view === "rating" && <RatingView booking={selectedRecord} onNavigate={navigate} />}{view === "auth" && <AuthView onNavigate={navigate} />}{view === "public-register" && <SignUp onNavigate={navigate} />}</main>
      <footer className="site-footer"><span>GigConnect</span><span>Cooperative work. Neighbourhood trust.</span><span>Delhi NCR · 2026</span></footer>
    </div>
  )
}

export default App
