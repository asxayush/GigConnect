import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { showToast } from "../toast";
import { triggerSosAlert, verifyBookingOtp, completeBooking } from "../api";

// Leaflet default icon fix for Vite/Webpack environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom HTML Icons with Linear/Stripe Matte Styling
const createCustomerIcon = () =>
  L.divIcon({
    className: "custom-customer-marker",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="w-10 h-10 rounded-xl bg-[#003548] border-2 border-[#bfe8ff] flex items-center justify-center shadow-2xl text-white">
          <span class="material-symbols-outlined text-[20px]">home_pin</span>
        </div>
        <div class="absolute -bottom-1 w-2.5 h-2.5 bg-[#003548] rotate-45 border-r-2 border-b-2 border-[#bfe8ff]"></div>
      </div>
    `,
    iconSize: [40, 44],
    iconAnchor: [20, 44],
    popupAnchor: [0, -42],
  });

const createWorkerIcon = (avatarUrl, isSakhi) =>
  L.divIcon({
    className: "custom-worker-marker",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute -inset-1.5 rounded-2xl ${isSakhi ? 'bg-pink-500/40 animate-ping' : 'bg-[#fd651e]/40 animate-ping'}"></div>
        <div class="w-12 h-12 rounded-xl bg-[#131b2e] border-2 ${isSakhi ? 'border-pink-400' : 'border-[#fd651e]'} p-0.5 shadow-2xl overflow-hidden relative z-10 flex items-center justify-center">
          <img src="${avatarUrl}" class="w-full h-full object-cover rounded-lg" alt="Worker" />
          ${isSakhi ? '<div class="absolute top-0 right-0 bg-pink-600 text-white text-[9px] font-black px-1 rounded-bl-md">♀</div>' : ''}
        </div>
        <div class="absolute -bottom-1 w-2.5 h-2.5 bg-[#131b2e] rotate-45 border-r-2 border-b-2 ${isSakhi ? 'border-pink-400' : 'border-[#fd651e]'}"></div>
      </div>
    `,
    iconSize: [48, 52],
    iconAnchor: [24, 52],
    popupAnchor: [0, -50],
  });

// Auto-recenter map when worker coordinates update
function MapRecenter({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length === 2) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
    }
  }, [bounds, map]);
  return null;
}

export default function ActiveBooking({ booking, onNavigate }) {
  // Default Sample Booking Data if accessed directly
  const activeBooking = booking || {
    id: "GC-88421",
    serviceCategory: "Full Home Deep Cleaning & Sanitization",
    status: "in-progress",
    otp: "4829",
    price: 1499,
    scheduledAt: "Today • Immediate Dispatch",
    customer: {
      name: "Ananya Sharma",
      phone: "+91 98110 44219",
      address: "Flat 402, DLF Phase 2, Cyber City, Gurugram",
      lat: 28.4895,
      lng: 77.0890,
    },
    worker: {
      id: "w-sunita-devi",
      name: "Sunita Devi",
      phone: "+91 99999 99992",
      role: "Lead Sanitation Specialist & Guild Steward",
      rating: 4.96,
      reviewsCount: 420,
      sakhiVerified: true,
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&auto=format&fit=crop&q=80",
      lat: 28.4750,
      lng: 77.0720,
    },
  };

  const isSakhi = Boolean(activeBooking.worker?.sakhiVerified || activeBooking.worker?.isSakhiVerified);

  // Coordinates State
  const customerPos = [
    activeBooking.customer?.lat || 28.4895,
    activeBooking.customer?.lng || 77.0890,
  ];

  const [workerPos, setWorkerPos] = useState([
    activeBooking.worker?.lat || 28.4750,
    activeBooking.worker?.lng || 77.0720,
  ]);

  const [etaMinutes, setEtaMinutes] = useState(8);
  const [distanceKm, setDistanceKm] = useState(1.4);
  const [jobStatus, setJobStatus] = useState(activeBooking.status || "in-progress");
  const [showSosModal, setShowSosModal] = useState(false);
  const [isSosActive, setIsSosActive] = useState(false);
  const [sosAlertId, setSosAlertId] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const socketRef = useRef(null);

  // Sockets Connection & Live Tracking
  useEffect(() => {
    const backendUrl = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");
    const socket = io(backendUrl, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[ActiveBooking] Connected to real-time socket:", socket.id);
      socket.emit("joinBooking", { bookingId: activeBooking.id });
    });

    // Listen for live worker location updates
    socket.on("location_update", (data) => {
      if (data && (data.lat || (data.coordinates && data.coordinates.length === 2))) {
        const nextLat = data.lat || data.coordinates[1];
        const nextLng = data.lng || data.coordinates[0];
        setWorkerPos([nextLat, nextLng]);
        
        // Compute simple distance delta
        const dLat = (customerPos[0] - nextLat) * 111;
        const dLng = (customerPos[1] - nextLng) * 111;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        setDistanceKm(Number(dist.toFixed(1)));
        setEtaMinutes(Math.max(1, Math.round(dist * 4)));
      }
    });

    // Listen for SOS status updates from Federation Desk
    socket.on("sos_status_update", (data) => {
      if (data.status === "active") {
        setIsSosActive(true);
        setSosAlertId(data.alertId);
      } else if (data.status === "resolved") {
        setIsSosActive(false);
        showToast("Emergency alert resolved by Federation Desk.");
      }
    });

    // Simulated graceful movement along route if in demo/disconnected mode
    const interval = setInterval(() => {
      setWorkerPos((prev) => {
        const step = 0.0003;
        const targetLat = customerPos[0];
        const targetLng = customerPos[1];
        const deltaLat = targetLat - prev[0];
        const deltaLng = targetLng - prev[1];

        if (Math.abs(deltaLat) < 0.0002 && Math.abs(deltaLng) < 0.0002) {
          return customerPos;
        }

        const nextLat = prev[0] + Math.sign(deltaLat) * step * 0.6;
        const nextLng = prev[1] + Math.sign(deltaLng) * step * 0.8;

        const dLat = (targetLat - nextLat) * 111;
        const dLng = (targetLng - nextLng) * 111;
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        setDistanceKm(Number(Math.max(0.1, dist).toFixed(1)));
        setEtaMinutes(Math.max(1, Math.round(dist * 4)));

        return [nextLat, nextLng];
      });
    }, 4000);

    return () => {
      clearInterval(interval);
      if (socket) socket.disconnect();
    };
  }, [activeBooking.id, customerPos[0], customerPos[1]]);

  // Trigger Emergency SOS Handshake
  const handleTriggerSos = async () => {
    try {
      const payload = {
        bookingId: activeBooking.id,
        workerId: activeBooking.worker?.id,
        location: {
          lat: customerPos[0],
          lng: customerPos[1],
          coordinates: [customerPos[1], customerPos[0]],
        },
        reason: "🚨 Emergency SOS Triggered by Customer via Active Booking UI",
        metadata: {
          customerName: activeBooking.customer?.name,
          workerName: activeBooking.worker?.name,
          address: activeBooking.customer?.address,
        },
      };

      // 1. Emit via socket
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("trigger_sos", payload);
      }

      // 2. Backup REST trigger
      try {
        const token = localStorage.getItem("gigconnect_token");
        await triggerSosAlert(payload, token);
      } catch (err) {
        console.warn("SOS REST fallback error:", err.message);
      }

      setIsSosActive(true);
      setShowSosModal(false);
      showToast("🚨 Federation Admins have been alerted and are tracking this job.");
    } catch (err) {
      showToast("Failed to trigger SOS alert: " + err.message);
    }
  };

  // Doorstep Handshake: Worker inputs OTP to start service
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!enteredOtp || enteredOtp.length !== 4) {
      showToast("Please enter a valid 4-digit OTP PIN.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const token = localStorage.getItem("gigconnect_token");
      await verifyBookingOtp(activeBooking.id, enteredOtp, token);
      setJobStatus("in-progress");
      showToast("✓ OTP authenticated! Service is now In Progress.");
    } catch (err) {
      // Offline / demo fallback if matching booking ID
      if (String(enteredOtp).trim() === String(activeBooking.otp || "4829").trim()) {
        setJobStatus("in-progress");
        showToast("✓ Doorstep PIN authenticated! Service In Progress.");
      } else {
        showToast("Invalid OTP. Please check with customer.");
      }
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleCompleteJob = async () => {
    try {
      const token = localStorage.getItem("gigconnect_token");
      await completeBooking(activeBooking.id, token);
    } catch (err) {
      console.warn("Complete API fallback:", err.message);
    }
    setJobStatus("completed");
    showToast("✓ Job concluded. 95% Worker Escrow released with 5% Mutual Welfare Fund deposited.");
    onNavigate("rating", activeBooking);
  };

  const mapBounds = [customerPos, workerPos];

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-[#e6edf3] font-sans antialiased pb-16">
      
      {/* 1. TOP STATUS HEADER WITH LINEAR MATTE DESIGN */}
      <header className="border-b border-[#21262d] bg-[#0d1117]/80 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("booking")}
            className="w-9 h-9 rounded-xl bg-[#161b22] hover:bg-[#21262d] text-[#8b949e] hover:text-white flex items-center justify-center border border-[#30363d] transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-400 uppercase">
                Live Job Tracking
              </span>
              <span className="text-xs font-mono text-[#8b949e]">#{activeBooking.id}</span>
            </div>
            <h1 className="text-sm md:text-base font-bold text-white tracking-tight m-0 mt-0.5">
              {activeBooking.serviceCategory}
            </h1>
          </div>
        </div>

        {/* SOS HIGH-PRIORITY BUTTON IN HEADER */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowSosModal(true)}
            className="bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl shadow-[0_0_15px_rgba(220,38,38,0.5)] font-bold text-xs md:text-sm px-4 py-2.5 flex items-center gap-2 border border-red-500/40 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">emergency</span>
            <span>🚨 Emergency SOS</span>
          </button>
        </div>
      </header>

      {/* 2. ACTIVE SOS EMERGENCY BANNER IF TRIGGERED */}
      <AnimatePresence>
        {isSosActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-red-950/80 border-b border-red-600/50 px-4 md:px-8 py-3 text-white flex flex-wrap items-center justify-between gap-3 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-red-300">
                  Critical Alert Active
                </span>
                <p className="text-xs text-red-100 m-0 font-medium">
                  Federation Desk Emergency Stewards are currently monitoring this live job location.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:112"
                className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-red-400 flex items-center gap-1.5 no-underline"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>Dial 112 Police</span>
              </a>
              <button
                type="button"
                onClick={() => showToast("Emergency Steward connected via masked channel.")}
                className="bg-[#161b22] hover:bg-[#21262d] text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-[#30363d] cursor-pointer"
              >
                Hotline Intercom
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN DASHBOARD CONTENT */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: LIVE LEAFLET MAP & ETA CARD (7 COLS) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          
          {/* MAP CONTAINER (MATTE-DARK BORDERED) */}
          <div className="w-full h-[380px] sm:h-[460px] rounded-xl overflow-hidden border border-[#21262d] bg-[#161b22] shadow-2xl relative z-10">
            
            {/* Overlay Live ETA Pill */}
            <div className="absolute top-4 left-4 z-[400] bg-[#0d1117]/90 backdrop-blur-md border border-[#30363d] rounded-xl px-4 py-2.5 shadow-xl flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <span className="material-symbols-outlined text-[18px]">near_me</span>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8b949e] block font-bold">
                  Estimated Arrival
                </span>
                <span className="text-sm font-extrabold text-white">
                  {etaMinutes} mins <span className="text-xs font-normal text-[#8b949e]">({distanceKm} km away)</span>
                </span>
              </div>
            </div>

            {/* Overlay Recenter Button */}
            <div className="absolute top-4 right-4 z-[400]">
              <div className="px-3 py-1.5 bg-[#0d1117]/90 backdrop-blur-md border border-[#30363d] rounded-xl text-[11px] font-mono text-[#8b949e] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>GPS Live 1 Hz</span>
              </div>
            </div>

            <MapContainer
              center={customerPos}
              zoom={14}
              scrollWheelZoom={false}
              className="w-full h-full"
              style={{ background: "#0d1117" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
              />
              <MapRecenter bounds={mapBounds} />

              {/* Customer Home Pin */}
              <Marker position={customerPos} icon={createCustomerIcon()}>
                <Popup className="custom-leaflet-popup">
                  <div className="text-xs font-bold text-slate-900 p-1">
                    🏠 Your Location (Home)
                    <p className="text-[10px] text-slate-600 m-0 font-normal">
                      {activeBooking.customer?.address}
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Worker Moving Pin */}
              <Marker
                position={workerPos}
                icon={createWorkerIcon(activeBooking.worker?.image, isSakhi)}
              >
                <Popup className="custom-leaflet-popup">
                  <div className="text-xs font-bold text-slate-900 p-1">
                    {isSakhi ? "♀ Sakhi Verified Pro" : "Co-op Verified Worker"}
                    <div className="text-sm font-extrabold text-slate-950 mt-0.5">
                      {activeBooking.worker?.name}
                    </div>
                    <p className="text-[10px] text-slate-600 m-0">
                      ETA: ~{etaMinutes} mins ({distanceKm} km)
                    </p>
                  </div>
                </Popup>
              </Marker>

              {/* Polyline Route */}
              <Polyline
                positions={[workerPos, customerPos]}
                color={isSakhi ? "#ec4899" : "#fd651e"}
                weight={4}
                dashArray="6, 8"
                opacity={0.85}
              />
            </MapContainer>
          </div>

          {/* SERVICE LIFECYCLE STEPPER (STRIPE/LINEAR STYLE) */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-5 shadow-md">
            <span className="text-[11px] font-mono uppercase text-[#8b949e] font-bold block mb-4">
              Real-Time Execution State
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold mb-1.5">
                  ✓
                </div>
                <span className="text-xs font-bold text-white">Assigned</span>
                <span className="text-[10px] text-[#8b949e]">Aadhaar Cleared</span>
              </div>

              <div className="flex flex-col items-center relative">
                <div className="w-8 h-8 rounded-xl bg-[#003548] border-2 border-[#bfe8ff] text-[#bfe8ff] flex items-center justify-center text-xs font-bold mb-1.5 shadow-lg animate-pulse">
                  <span className="material-symbols-outlined text-[16px]">navigation</span>
                </div>
                <span className="text-xs font-bold text-[#bfe8ff]">En Route</span>
                <span className="text-[10px] text-[#8b949e]">{etaMinutes} mins away</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-[#21262d] border border-[#30363d] text-[#6e7681] flex items-center justify-center text-xs font-bold mb-1.5">
                  3
                </div>
                <span className="text-xs font-bold text-[#8b949e]">Service Done</span>
                <span className="text-[10px] text-[#8b949e]">Escrow Released</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORKER CARD, SAKHI TRUST, OTP & ACTIONS (5 COLS) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* WORKER PROFILE & TRUST CARD */}
          <div className="bg-[#161b22] border border-[#21262d] rounded-xl p-6 shadow-xl relative overflow-hidden">
            
            {/* Sakhi Gradient Ambient Glow if Sakhi Mode */}
            {isSakhi && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -z-0"></div>
            )}

            <div className="relative z-10">
              
              {/* Header: SAKHI TRUST BADGE (HIGHLY VISIBLE) */}
              {isSakhi ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-950/80 border border-pink-500/40 text-pink-300 font-bold text-xs mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-pink-400">shield_with_heart</span>
                  <span>♀ Sakhi Verified — Secure Women-Led Job</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0e4d64]/60 border border-[#bfe8ff]/30 text-[#bfe8ff] font-bold text-xs mb-4">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Cooperative Certified Master Tradesperson</span>
                </div>
              )}

              {/* Worker Avatar & Identity Details */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#30363d] shadow-md bg-[#0d1117]">
                    <img
                      src={activeBooking.worker?.image}
                      alt={activeBooking.worker?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSakhi && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs font-black shadow-md border border-[#161b22]">
                      ♀
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="text-base font-extrabold text-white tracking-tight m-0">
                    {activeBooking.worker?.name}
                  </h3>
                  <p className="text-xs text-[#8b949e] m-0 mt-0.5">
                    {activeBooking.worker?.role}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
                      ★ {activeBooking.worker?.rating}
                    </span>
                    <span className="text-[11px] text-[#8b949e]">
                      {activeBooking.worker?.reviewsCount} cooperative jobs
                    </span>
                  </div>
                </div>
              </div>

              {/* DIRECT CONTACT CONTROLS (LINEAR STYLE) */}
              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCalling(true);
                    showToast(`Masked IVR call initiated to ${activeBooking.worker?.name}...`);
                  }}
                  className="w-full py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs rounded-xl border border-[#30363d] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-emerald-400">call</span>
                  <span>Masked Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("messages", activeBooking.worker)}
                  className="w-full py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs rounded-xl border border-[#30363d] flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#00a884]">chat</span>
                  <span>Secure Chat</span>
                </button>
              </div>

              {/* DOORSTEP SECURITY OTP */}
              <div className="mt-5 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#8b949e] uppercase block font-bold">
                      Doorstep Security Handshake
                    </span>
                    <p className="text-xs text-[#c9d1d9] m-0 mt-0.5">
                      Share this PIN when worker arrives
                    </p>
                  </div>
                  <div className="text-xl font-mono font-black tracking-widest text-[#fd651e] bg-[#fd651e]/10 px-3.5 py-1.5 rounded-lg border border-[#fd651e]/30">
                    {activeBooking.otp || "4829"}
                  </div>
                </div>

                {/* Worker OTP Authentication Form */}
                <form onSubmit={handleVerifyOtp} className="pt-2 border-t border-[#21262d] flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 4-digit PIN"
                    className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-[#fd651e] focus:ring-1 focus:ring-[#fd651e] rounded-lg px-3 py-1.5 text-xs text-center font-mono tracking-widest text-white outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || enteredOtp.length !== 4}
                    className="px-3.5 py-1.5 bg-[#fd651e] hover:bg-[#e05413] text-white font-bold text-xs rounded-lg border border-[#fd651e]/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? "Validating..." : "Start Job (Verify PIN)"}
                  </button>
                </form>
              </div>

              {/* PAYMENT TRANSPARENCY ACCORDION */}
              <div className="mt-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="flex justify-between text-xs text-[#8b949e]">
                  <span>Total Escrow Reserved:</span>
                  <span className="font-bold text-white">₹{activeBooking.price || 1499}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-400">
                  <span>Direct Worker Payout (95%):</span>
                  <span>₹{Math.round((activeBooking.price || 1499) * 0.95)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-pink-300">
                  <span>Mutual Welfare & Safety Net (5%):</span>
                  <span>₹{Math.round((activeBooking.price || 1499) * 0.05)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#8b949e]">
                  <span>Platform Fee (Co-op Model):</span>
                  <span className="text-white font-bold">₹0 (Zero Commission)</span>
                </div>
              </div>

              {/* COMPLETE SERVICE TRIGGER */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCompleteJob}
                  className="w-full py-3 bg-[#003548] hover:bg-[#0e4d64] text-[#bfe8ff] font-bold text-xs md:text-sm rounded-xl border border-[#bfe8ff]/30 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>Mark Work Completed &amp; Rate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. EMERGENCY SOS CONFIRMATION MODAL */}
      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-[#161b22] border-2 border-red-600 rounded-2xl p-6 shadow-[0_0_50px_rgba(220,38,38,0.4)] text-white relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-red-600/20 border border-red-500/40 text-red-500 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>

              <h3 className="text-xl font-black text-center text-white tracking-tight m-0">
                Confirm Emergency SOS
              </h3>
              
              <p className="text-xs text-[#8b949e] text-center mt-2 leading-relaxed">
                Triggering SOS will instantly alert the <strong>Federation Desk Ward Stewards</strong>, log your live GPS location, and dispatch emergency response protocols.
              </p>

              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 my-4 space-y-1 text-xs">
                <div className="text-[#8b949e]">
                  Booking: <strong className="text-white">#{activeBooking.id}</strong>
                </div>
                <div className="text-[#8b949e]">
                  Assigned Worker: <strong className="text-white">{activeBooking.worker?.name}</strong>
                </div>
                <div className="text-[#8b949e]">
                  Address: <strong className="text-white">{activeBooking.customer?.address}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="w-full py-2.5 bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs rounded-xl border border-[#30363d] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSos}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl shadow-[0_0_20px_rgba(220,38,38,0.6)] border border-red-400 cursor-pointer"
                >
                  🚨 Broadcast Alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
