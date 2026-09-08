import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import i18next from "i18next"
import { AuthView, BookingView, DetailView, RatingView, WorkerRegistration } from "./components/Home/Home"
import StitchHome from "./components/Home/StitchHome"
import FindHelp from "./components/FindHelp/FindHelp"
import MyBookings from "./components/MyBookings/MyBookings"
import RegisterWorker from "./components/RegisterWorker/RegisterWorker"
import StitchNavbar from "./components/Navigation/StitchNavbar"
import StitchFooter from "./components/Navigation/StitchFooter"
import FederationDesk from "./components/FederationDesk/FederationDesk"
import AdminDashboard from "./components/AdminDashboard/AdminDashboard"
import SignUp from "./components/SignUp/SignUp"
import Toast from "./components/Toast/Toast"
import { showToast } from "./toast"
import './App.css'

function App() {
  const { t } = useTranslation()
  const [view, setView] = useState("home")
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [language, setLanguage] = useState(localStorage.getItem("gigconnect_language") || "en")

  useEffect(() => {
    const handleUnhandledError = (event) => showToast(event.reason?.message || t("common.error"));
    window.addEventListener("unhandledrejection", handleUnhandledError);
    return () => window.removeEventListener("unhandledrejection", handleUnhandledError);
  }, [t])

  const navigate = (nextView, record = null) => {
    setView(nextView)
    if (record) setSelectedRecord(record)
    window.scrollTo({ top: 0, behavior: "smooth" })
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
      />
      <main className="flex-1 w-full">
        {view === "home" && <StitchHome onNavigate={navigate} />}
        {view === "find-help" && <FindHelp onNavigate={navigate} />}
        {view === "booking" && <MyBookings selectedWorker={selectedRecord} onNavigate={navigate} />}
        {view === "detail" && <DetailView booking={selectedRecord} onNavigate={navigate} />}
        {view === "register" && <RegisterWorker onNavigate={navigate} />}
        {view === "admin" && <FederationDesk onNavigate={navigate} />}
        {view === "rating" && <RatingView booking={selectedRecord} onNavigate={navigate} />}
        {view === "auth" && <AuthView onNavigate={navigate} />}
        {view === "public-register" && <SignUp onNavigate={navigate} />}
      </main>
      <StitchFooter onNavigate={navigate} />
    </div>
  )
}

export default App
