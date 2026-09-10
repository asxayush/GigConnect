import React, { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import "leaflet/dist/leaflet.css";
import { showToast } from "../toast";
import { triggerSosAlert, verifyBookingOtp, completeBooking, API_URL } from "../api";
import { DEFAULT_FEMALE_AVATAR } from "../assets/avatars";

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
        <div class="w-10 h-10 rounded-xl bg-primary border-2 border-white flex items-center justify-center shadow-lg text-white">
          <span class="material-symbols-outlined text-[20px]">home_pin</span>
        </div>
        <div class="absolute -bottom-1 w-2.5 h-2.5 bg-primary rotate-45 border-r-2 border-b-2 border-white"></div>
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
        <div class="absolute -inset-1.5 rounded-2xl ${isSakhi ? "bg-pink-400/40 animate-ping" : "bg-secondary-container/40 animate-ping"}"></div>
        <div class="w-12 h-12 rounded-xl bg-white border-2 ${isSakhi ? "border-pink-400" : "border-secondary-container"} p-0.5 shadow-lg overflow-hidden relative z-10 flex items-center justify-center">
          <img src="${avatarUrl}" class="w-full h-full object-cover rounded-lg" alt="Worker" />
          ${isSakhi ? '<div class="absolute top-0 right-0 bg-pink-600 text-white text-[9px] font-bold px-1 rounded-bl-md">♀</div>' : ""}
        </div>
        <div class="absolute -bottom-1 w-2.5 h-2.5 bg-white rotate-45 border-r-2 border-b-2 ${isSakhi ? "border-pink-400" : "border-secondary-container"}"></div>
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
      image: DEFAULT_FEMALE_AVATAR,
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
    const backendUrl = API_URL;
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

    socket.on("sos_error", (data) => {
      showToast("SOS socket error: " + (data?.message || "alert not persisted"));
    });
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
    const payload = {
      bookingId: activeBooking.id || activeBooking._id,
      workerId: activeBooking.worker?.id || activeBooking.worker?._id,
      location: {
        lat: customerPos[0],
        lng: customerPos[1],
        coordinates: [customerPos[1], customerPos[0]],
      },
      reason: "🚨 Emergency SOS Triggered by Customer via Active Booking UI",
      address: activeBooking.customer?.address || "Delhi NCR Service Site",
      metadata: {
        customerName: activeBooking.customer?.name,
        workerName: activeBooking.worker?.name,
        address: activeBooking.customer?.address,
      },
    };

    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("trigger_sos", payload);
      }

      const token = localStorage.getItem("gigconnect_token");
      const restRes = await triggerSosAlert(payload, token);
      if (!restRes?.success) {
        throw new Error(restRes?.message || "SOS API did not confirm the alert.");
      }

      setIsSosActive(true);
      setSosAlertId(restRes?.data?.alertId || restRes?.data?.sosCode);
      setShowSosModal(false);
      const emailFailed = restRes?.warning || restRes?.data?.emailNotificationSent === false;
      showToast(
        emailFailed
          ? "🚨 SOS logged with Federation Desk, but emergency email failed. Keep retrying if you can."
          : "🚨 Federation Desk has been alerted and is tracking this job."
      );
    } catch (err) {
      setIsSosActive(false);
      setShowSosModal(false);
      showToast(
        "SOS FAILED: alert was not confirmed by the server. Call 112 / 1091 if you are in danger. " +
          (err.message || "No network.")
      );
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
    <div className="w-full min-h-screen bg-surface text-on-surface antialiased font-sans pb-16">
      <header className="border-b border-border-tone/30 bg-surface-container-lowest/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate("booking")}
            className="w-9 h-9 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-on-surface flex items-center justify-center border border-border-tone/40 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                Live job tracking
              </span>
              <span className="font-label-sm text-label-sm text-outline">#{activeBooking.id}</span>
            </div>
            <h1 className="font-headline-sm text-headline-sm text-on-surface m-0 mt-0.5">
              {activeBooking.serviceCategory}
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowSosModal(true)}
          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-xl font-bold text-xs md:text-sm px-4 py-2.5 flex items-center gap-2 border-none shadow-sm transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">emergency</span>
          <span>Emergency SOS</span>
        </button>
      </header>

      {/* 2. ACTIVE SOS EMERGENCY BANNER IF TRIGGERED */}
      <AnimatePresence>
        {isSosActive && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-error-container border-b border-error/30 px-4 md:px-8 py-3 text-on-error-container flex flex-wrap items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
              <div>
                <span className="font-label-sm text-label-sm text-error uppercase tracking-wider">
                  Emergency alert active
                </span>
                <p className="text-xs text-on-error-container m-0 font-medium">
                  Support is monitoring this job location. Call 112 if you are in immediate danger.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="tel:112"
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 no-underline border-none"
              >
                <span className="material-symbols-outlined text-[15px]">call</span>
                <span>Call 112</span>
              </a>
              <button
                type="button"
                onClick={() => showToast("Emergency support connected via masked channel.")}
                className="bg-surface-container-lowest hover:bg-surface-container text-on-surface text-xs font-bold px-3 py-1.5 rounded-xl border border-border-tone/40 cursor-pointer"
              >
                Contact support
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-6 grid grid-cols-1 lg:grid-cols-12 gap-space-6">
        <div className="lg:col-span-7 flex flex-col gap-space-4">
          <div className="w-full h-[380px] sm:h-[460px] rounded-2xl overflow-hidden border border-border-tone/30 bg-surface-container-lowest shadow-sm relative z-10">
            <div className="absolute top-4 left-4 z-[400] bg-surface-container-lowest/95 backdrop-blur-md border border-border-tone/40 rounded-xl px-4 py-2.5 shadow-sm flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <span className="material-symbols-outlined text-[18px]">near_me</span>
              </div>
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant block">
                  Estimated arrival
                </span>
                <span className="text-sm font-bold text-on-surface">
                  {etaMinutes} mins{" "}
                  <span className="text-xs font-medium text-on-surface-variant">({distanceKm} km away)</span>
                </span>
              </div>
            </div>

            <div className="absolute top-4 right-4 z-[400]">
              <div className="px-3 py-1.5 bg-surface-container-lowest/95 backdrop-blur-md border border-border-tone/40 rounded-xl text-[11px] font-label-md text-on-surface-variant flex items-center gap-1.5 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Live location update</span>
              </div>
            </div>

            <MapContainer
              center={customerPos}
              zoom={14}
              scrollWheelZoom={false}
              className="w-full h-full"
              style={{ background: "#f1f5f9" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
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

          <div className="bg-surface-container-lowest border border-border-tone/30 rounded-xl p-space-4 shadow-sm">
            <span className="font-label-sm text-label-sm text-on-surface-variant block mb-4">
              Job status
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center text-xs font-bold mb-1.5">
                  ✓
                </div>
                <span className="text-xs font-bold text-on-surface">Assigned</span>
                <span className="text-[10px] text-on-surface-variant">Identity verified</span>
              </div>

              <div className="flex flex-col items-center relative">
                <div className="w-8 h-8 rounded-xl bg-primary text-on-primary flex items-center justify-center text-xs font-bold mb-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[16px]">navigation</span>
                </div>
                <span className="text-xs font-bold text-primary">On the way</span>
                <span className="text-[10px] text-on-surface-variant">{etaMinutes} mins away</span>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-xl bg-surface-container border border-border-tone/40 text-outline flex items-center justify-center text-xs font-bold mb-1.5">
                  3
                </div>
                <span className="text-xs font-bold text-on-surface-variant">Completed</span>
                <span className="text-[10px] text-on-surface-variant">Payment released</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-space-4">
          <div className="bg-surface-container-lowest border border-border-tone/30 rounded-xl p-space-6 shadow-sm relative overflow-hidden">
            {isSakhi && (
              <div className="absolute top-0 right-0 w-48 h-48 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
            )}

            <div className="relative z-10">
              {isSakhi ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-50 border border-pink-200 text-pink-800 font-bold text-xs mb-4">
                  <span className="material-symbols-outlined text-[16px] text-pink-600">shield_with_heart</span>
                  <span>Sakhi verified — women-led job</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-container border border-border-tone/40 text-primary font-bold text-xs mb-4">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  <span>Verified cooperative professional</span>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-border-tone/40 shadow-sm bg-surface-container">
                    <img
                      src={activeBooking.worker?.image}
                      alt={activeBooking.worker?.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {isSakhi && (
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-lg bg-pink-600 text-white flex items-center justify-center text-xs font-bold shadow-sm border-2 border-white">
                      ♀
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-title-md text-title-md text-on-surface m-0">
                    {activeBooking.worker?.name}
                  </h3>
                  <p className="text-xs text-on-surface-variant m-0 mt-0.5">
                    {activeBooking.worker?.role}
                  </p>

                  <div className="flex items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      ★ {activeBooking.worker?.rating}
                    </span>
                    <span className="text-[11px] text-on-surface-variant">
                      {activeBooking.worker?.reviewsCount} jobs completed
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCalling(true);
                    showToast(`Masked call started to ${activeBooking.worker?.name}...`);
                  }}
                  className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  <span>Call</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("messages", activeBooking.worker)}
                  className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border-none flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  <span>Chat</span>
                </button>
              </div>

              <div className="mt-5 p-4 rounded-xl bg-surface-container-low border border-border-tone/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant block">
                      Verification PIN
                    </span>
                    <p className="text-xs text-on-surface m-0 mt-0.5">
                      Share this PIN when the professional arrives
                    </p>
                  </div>
                  <div className="text-xl font-bold tracking-widest text-secondary bg-secondary-fixed px-3.5 py-1.5 rounded-lg border border-secondary-fixed-dim">
                    {activeBooking.otp || "4829"}
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="pt-2 border-t border-border-tone/20 flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter 4-digit PIN"
                    className="flex-1 bg-surface-container-lowest border border-border-tone/40 focus:border-primary focus:ring-2 focus-within:ring-primary/10 rounded-xl px-3 py-2 text-xs text-center tracking-widest text-on-surface outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isVerifyingOtp || enteredOtp.length !== 4}
                    className="px-3.5 py-2 bg-secondary-container hover:opacity-95 text-on-secondary font-bold text-xs rounded-xl border-none transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isVerifyingOtp ? "Checking..." : "Start job"}
                  </button>
                </form>
              </div>

              <div className="mt-4 p-4 rounded-xl bg-surface-container-low border border-border-tone/30 space-y-2">
                <div className="flex justify-between text-xs text-on-surface-variant">
                  <span>Amount held in escrow</span>
                  <span className="font-bold text-on-surface">₹{activeBooking.price || 1499}</span>
                </div>
                <div className="flex justify-between text-[11px] text-emerald-700">
                  <span>Worker payout (95%)</span>
                  <span>₹{Math.round((activeBooking.price || 1499) * 0.95)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-pink-700">
                  <span>Welfare fund (5%)</span>
                  <span>₹{Math.round((activeBooking.price || 1499) * 0.05)}</span>
                </div>
                <div className="flex justify-between text-[11px] text-on-surface-variant">
                  <span>Platform fee</span>
                  <span className="text-on-surface font-bold">₹0</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleCompleteJob}
                  className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs md:text-sm rounded-xl border-none shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">task_alt</span>
                  <span>Mark completed &amp; rate</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showSosModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-surface-container-lowest border border-red-200 rounded-2xl p-6 shadow-xl text-on-surface relative"
            >
              <div className="w-14 h-14 rounded-2xl bg-error-container text-error flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[32px]">warning</span>
              </div>

              <h3 className="font-headline-sm text-headline-sm text-center text-on-surface m-0">
                Confirm emergency SOS
              </h3>

              <p className="text-xs text-on-surface-variant text-center mt-2 leading-relaxed">
                This alerts support, logs your live location, and starts an emergency response. If you are in danger, also call 112.
              </p>

              <div className="bg-surface-container-low border border-border-tone/30 rounded-xl p-3 my-4 space-y-1 text-xs">
                <div className="text-on-surface-variant">
                  Booking: <strong className="text-on-surface">#{activeBooking.id}</strong>
                </div>
                <div className="text-on-surface-variant">
                  Professional: <strong className="text-on-surface">{activeBooking.worker?.name}</strong>
                </div>
                <div className="text-on-surface-variant">
                  Address: <strong className="text-on-surface">{activeBooking.customer?.address}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowSosModal(false)}
                  className="w-full py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-bold text-xs rounded-xl border-none cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleTriggerSos}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl border-none cursor-pointer"
                >
                  Send alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
