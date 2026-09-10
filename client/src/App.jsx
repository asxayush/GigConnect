import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { BookingView, DetailView, WorkerRegistration } from "./components/Home/Home"
import StitchHome from "./components/Home/StitchHome"
import FindHelp from "./components/FindHelp/FindHelp"
import MyBookings from "./components/MyBookings/MyBookings"
import RegisterWorker from "./components/RegisterWorker/RegisterWorker"
import StitchNavbar from "./components/Navigation/StitchNavbar"
import StitchFooter from "./components/Navigation/StitchFooter"
import FederationDesk from "./components/FederationDesk/FederationDesk"
import AdminDashboard from "./components/AdminDashboard/AdminDashboard"
import SignUp from "./components/SignUp/SignUp"
import Messages from "./components/Messages/Messages"
import WorkerDashboard from "./components/Dashboard/WorkerDashboard"
import CustomerDashboard from "./components/Dashboard/CustomerDashboard"
import ToolBankMap from "./views/ToolBankMap"
import ActiveBooking from "./views/ActiveBooking"
import RatingView from "./views/RatingView"
import SahayataFAB from "./components/SahayataFAB"
import Toast from "./components/Toast/Toast"
import { showToast } from "./toast"
import { auth } from "./auth"
import './App.css'

function App() {
  const { t } = useTranslation()
  const [view, setView] = useState("home")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [language, setLanguage] = useState(localStorage.getItem("gigconnect_language") || "en")

  // State Management (BUG FIX 2): User Authentication State
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("gigconnect_user") || localStorage.getItem("gig_user")
      return saved ? JSON.parse(saved) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    const handleUnhandledError = (event) => showToast(event.reason?.message || t("common.error"))
    window.addEventListener("unhandledrejection", handleUnhandledError)
    return () => window.removeEventListener("unhandledrejection", handleUnhandledError)
  }, [t])

  // Reactive listener for Login & Logout across windows/components
  useEffect(() => {
    const syncAuth = () => {
      try {
        const saved = localStorage.getItem("gigconnect_user") || localStorage.getItem("gig_user")
        setUser(saved ? JSON.parse(saved) : null)
      } catch (e) {
        setUser(null)
      }
    }
    window.addEventListener("gigconnect_auth_change", syncAuth)
    window.addEventListener("storage", syncAuth)
    return () => {
      window.removeEventListener("gigconnect_auth_change", syncAuth)
      window.removeEventListener("storage", syncAuth)
    }
  }, [])

  const navigate = (nextView, record = null) => {
    setView(nextView)
    if (record) setSelectedRecord(record)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  // Working Complete Logout Action (BUG FIX 2)
  const handleLogout = () => {
    localStorage.removeItem("gig_token")
    localStorage.removeItem("gigconnect_token")
    localStorage.removeItem("gigconnect_user")
    localStorage.removeItem("gig_user")
    localStorage.removeItem("gigconnect_role")
    localStorage.removeItem("gigconnect_worker_status")
    sessionStorage.clear()
    
    try {
      auth?.signOut().catch(() => {})
    } catch (e) {}

    setUser(null)
    window.dispatchEvent(new Event("gigconnect_auth_change"))
    showToast("Logged out successfully.")
    navigate("home")
  }

  const toggleLanguage = () => {
    const next = language === "en" ? "hi" : "en"
    setLanguage(next)
    localStorage.setItem("gigconnect_language", next)
    i18next.changeLanguage(next)
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface font-body-md antialiased">
      <Toast />
      <StitchNavbar
        view={view}
        onNavigate={navigate}
        onToggleLanguage={toggleLanguage}
        currentLanguage={language}
        user={user}
        onLogout={handleLogout}
      />
      <main className="flex-1 w-full flex flex-col">
        {view === "home" && <StitchHome onNavigate={navigate} />}
        {view === "find-help" && <FindHelp onNavigate={navigate} />}
        {view === "booking" && <MyBookings selectedWorker={selectedRecord} onNavigate={navigate} />}
        {view === "active-booking" && <ActiveBooking booking={selectedRecord} onNavigate={navigate} />}
        {view === "messages" && <Messages initialWorker={selectedRecord} onNavigate={navigate} />}
        {view === "detail" && <DetailView booking={selectedRecord} onNavigate={navigate} />}
        {view === "register" && <RegisterWorker onNavigate={navigate} />}
        {view === "admin" && <FederationDesk onNavigate={navigate} />}
        {view === "tool-bank" && <ToolBankMap onNavigate={navigate} />}
        {view === "rating" && <RatingView booking={selectedRecord} onNavigate={navigate} />}
        {view === "worker-dashboard" && <WorkerDashboard onNavigate={navigate} />}
        {view === "customer-dashboard" && <CustomerDashboard onNavigate={navigate} />}
        {view === "dashboard" && (user?.role === "worker" ? <WorkerDashboard onNavigate={navigate} /> : <CustomerDashboard onNavigate={navigate} />)}
        {view === "auth" && <SignUp onNavigate={navigate} setUser={setUser} />}
        {view === "public-register" && <SignUp onNavigate={navigate} setUser={setUser} />}
      </main>
      
      {/* 24x7 Cooperative Sahayata FAB & AI Triage Chat Modal */}
      <SahayataFAB onNavigate={navigate} />

      {view !== "messages" && <StitchFooter onNavigate={navigate} />}
    </div>
  )
}

export default App
