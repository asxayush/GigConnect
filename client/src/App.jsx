import { useState } from "react"
import { AdminView, BookingView, DetailView, Home, RatingView, WorkerRegistration } from "./components/Home/Home"
import './App.css'

function App() {
  const [view, setView] = useState("home")
  const navigate = (nextView) => {
    setView(nextView)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => navigate("home")} aria-label="Go to GigConnect home"><span className="brand-mark">G</span><span>GigConnect</span></button>
        <nav className="main-nav" aria-label="Main navigation">
          <button className={view === "home" ? "active" : ""} onClick={() => navigate("home")}>Find help</button>
          <button className={view === "booking" || view === "detail" ? "active" : ""} onClick={() => navigate("booking")}>My bookings</button>
          <button className={view === "register" ? "active" : ""} onClick={() => navigate("register")}>Register a worker</button>
          <button className={view === "admin" ? "active" : ""} onClick={() => navigate("admin")}>Federation desk</button>
        </nav>
        <button className="account-button" onClick={() => navigate("register")}>Sign in</button>
      </header>
      <main>{view === "home" && <Home onNavigate={navigate} />}{view === "booking" && <BookingView onNavigate={navigate} />}{view === "detail" && <DetailView onNavigate={navigate} />}{view === "register" && <WorkerRegistration />}{view === "admin" && <AdminView />}{view === "rating" && <RatingView onNavigate={navigate} />}</main>
      <footer className="site-footer"><span>GigConnect</span><span>Cooperative work. Neighbourhood trust.</span><span>Delhi NCR · 2026</span></footer>
    </div>
  )
}

export default App
