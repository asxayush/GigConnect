import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../toast";

const BACKEND_URL = (import.meta.env.VITE_API_URL || "http://localhost:4000").replace(/\/$/, "");

// Custom crisp SVG Pin for Leaflet
const createCustomHubIcon = (color = "#ea580c", iconName = "construction") => {
  return L.divIcon({
    className: "custom-leaflet-pin",
    html: `
      <div style="
        background: ${color};
        width: 38px;
        height: 38px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        box-shadow: 0 4px 14px rgba(0,0,0,0.25);
        border: 2px solid white;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <span class="material-symbols-outlined" style="font-size: 20px;">${iconName}</span>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  });
};

const HUBS_DATA = [
  {
    id: "hub-okhla",
    name: "Okhla Phase 3 Hub",
    fullName: "Okhla Phase 3 Cooperative Tool Hub",
    area: "South Delhi Industrial Cluster",
    address: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    lat: 28.5355,
    lng: 77.2600,
    toolsCount: "2 Heavy Drills & Threaders",
    contact: "+91 98110 41022",
    iconColor: "#ea580c",
  },
  {
    id: "hub-cp",
    name: "CP Central Depot",
    fullName: "Connaught Place Central Tool Depot",
    area: "Central Delhi Hub",
    address: "Super Bazar Complex, Outer Circle CP, New Delhi - 110001",
    lat: 28.6328,
    lng: 77.2197,
    toolsCount: "3 Diagnostic Meters & Saws",
    contact: "+91 98110 29103",
    iconColor: "#0A2540",
  },
  {
    id: "hub-ggn",
    name: "Gurugram Depot",
    fullName: "Gurugram Sector 14 Trade Depot",
    area: "Gurugram Cyber & Industrial Belt",
    address: "Old Delhi Road, Near ITI Sector 14, Gurugram - 122001",
    lat: 28.4725,
    lng: 77.0390,
    toolsCount: "4 Woodcraft & Cutting Tools",
    contact: "+91 98110 33844",
    iconColor: "#0284c7",
  },
  {
    id: "hub-noida",
    name: "Noida Sector 62",
    fullName: "Noida Sector 62 Federation Center",
    area: "Noida East Cluster",
    address: "Block C, Electronic City, Sector 62, Noida - 201309",
    lat: 28.6250,
    lng: 77.3680,
    toolsCount: "3 Inverter Welders & Kits",
    contact: "+91 98110 55665",
    iconColor: "#16a34a",
  },
];

const INITIAL_TOOLS = [
  {
    id: "tool-101",
    name: "Bosch Professional GBH 2-26 DRE Rotary Hammer Drill",
    category: "Electrical & Heavy Drilling",
    brand: "Bosch Power Tools",
    specs: "800W motor, 2.7 Joules impact energy, SDS-plus chuck",
    replacementValue: 15499,
    coopDailyFee: 0,
    status: "available",
    condition: "Certified Master Grade",
    hubName: "Okhla Phase 3 Hub",
    hubAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    lat: 28.5355,
    lng: 77.2600,
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "tool-102",
    name: "DeWalt DWE560 Heavy-Duty Circular Saw 184mm",
    category: "Carpentry & Woodcraft",
    brand: "DeWalt Industrial Tools",
    specs: "1350W high-torque motor, 65mm cutting depth",
    replacementValue: 12850,
    coopDailyFee: 0,
    status: "available",
    condition: "Precision Calibrated",
    hubName: "Gurugram Depot",
    hubAddress: "Old Delhi Road, Near ITI Sector 14, Gurugram - 122001",
    lat: 28.4725,
    lng: 77.0390,
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "tool-103",
    name: "Stanley Heavy Inverter Arc Welder 200A",
    category: "Metalwork & Fabrication",
    brand: "Stanley FatMax",
    specs: "IGBT inverter technology, anti-stick hot start",
    replacementValue: 18900,
    coopDailyFee: 0,
    status: "available",
    condition: "Factory Certified",
    hubName: "Noida Sector 62",
    hubAddress: "Block C, Electronic City, Sector 62, Noida - 201309",
    lat: 28.6250,
    lng: 77.3680,
    imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "tool-104",
    name: "Fluke 117 Electrician's True RMS Digital Multimeter",
    category: "Electrical Diagnostic",
    brand: "Fluke Calibration",
    specs: "VoltAlert non-contact AC voltage detection, LoZ impedance",
    replacementValue: 22400,
    coopDailyFee: 0,
    status: "available",
    condition: "NABL Lab Tested",
    hubName: "CP Central Depot",
    hubAddress: "Super Bazar Complex, Outer Circle CP, New Delhi - 110001",
    lat: 28.6328,
    lng: 77.2197,
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80",
  },
  {
    id: "tool-105",
    name: "RIDGID Heavy Duty Pipe Threader & Die Kit (1/2\" to 2\")",
    category: "Plumbing & Sanitary",
    brand: "RIDGID Professional",
    specs: "Drop head ratchet threader with alloy dies",
    replacementValue: 16500,
    coopDailyFee: 0,
    status: "available",
    condition: "Inspected & Lubricated",
    hubName: "Okhla Phase 3 Hub",
    hubAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    lat: 28.5355,
    lng: 77.2600,
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
  },
];

export default function ToolBankMap({ onNavigate }) {
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [selectedHub, setSelectedHub] = useState("all");
  const [reservationSuccess, setReservationSuccess] = useState(null);

  // ================= 1. USER & VERIFICATION STATE =================
  const [verificationStatus, setVerificationStatus] = useState(() => {
    const saved = localStorage.getItem("gigconnect_worker_status");
    if (saved) return saved;
    const userStored = localStorage.getItem("gigconnect_user");
    if (userStored) {
      try {
        const u = JSON.parse(userStored);
        if (u.verificationStatus) return u.verificationStatus;
      } catch (e) {}
    }
    return "pending"; // Default demo state: pending
  });

  const isVerified = verificationStatus === "verified";

  useEffect(() => {
    localStorage.setItem("gigconnect_worker_status", verificationStatus);
  }, [verificationStatus]);

  // Fetch from backend if server is running
  useEffect(() => {
    fetch(`${BACKEND_URL}/api/toolbank`)
      .then((res) => res.json())
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setTools(res.data);
        }
      })
      .catch(() => {});
  }, []);

  const filteredTools = tools.filter((t) => {
    if (selectedHub === "all") return true;
    return (
      t.hubName?.toLowerCase().includes(selectedHub.toLowerCase()) ||
      selectedHub.toLowerCase().includes(t.hubName?.toLowerCase() || "")
    );
  });

  // ================= 2. ACTION BUTTON & RESERVATION LOGIC =================
  const handleReserve = async (tool) => {
    if (!isVerified) {
      showToast(
        "Your profile is pending Federation approval. You can reserve tools once you receive your Verified Badge."
      );
      return;
    }

    try {
      const token = localStorage.getItem("gigconnect_token") || "demo-verified-worker-token";
      const res = await fetch(`${BACKEND_URL}/api/toolbank/${tool.id}/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setReservationSuccess(data.data);
        showToast(`✓ ${tool.name} reserved for 24 hours!`);
      } else {
        showToast(data.message || "Reservation failed.");
      }
    } catch (e) {
      setReservationSuccess({
        reservationId: `TB-RES-${Date.now().toString().slice(-6)}`,
        toolName: tool.name,
        replacementValue: tool.replacementValue,
        pickupHub: tool.hubName,
        pickupAddress: tool.hubAddress,
        validUntil: new Date(Date.now() + 24 * 3600 * 1000),
      });
      showToast(`✓ ${tool.name} reserved under Cooperative Mutual Trust!`);
    }
  };

  return (
    <div className="w-full bg-[#faf8ff] text-[#0A2540] min-h-screen font-sans antialiased">
      
      {/* ================= 1. PAGE HEADER ================= */}
      <div className="bg-white border-b border-slate-200/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
              <h1 className="text-xl sm:text-2xl font-black text-[#0A2540] tracking-tight m-0">
                Sahakari Tool Bank
              </h1>
              <span className="px-2.5 py-0.5 bg-orange-50 text-[#ea580c] border border-orange-200 rounded-full text-[11px] font-extrabold uppercase">
                0% Deposit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
              Reserve heavy cooperative equipment across Delhi NCR. 0% Deposit for verified members.
            </p>
          </div>

          {/* Clean Segmented Control for Simulate Verification */}
          <div className="flex items-center gap-2 self-start md:self-auto bg-slate-100/90 p-1 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 px-2 hidden sm:inline">
              Simulate Verification:
            </span>
            <button
              type="button"
              onClick={() => {
                setVerificationStatus("verified");
                showToast("Switched to Verified Worker status.");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                isVerified
                  ? "bg-white text-[#0A2540] shadow-sm font-extrabold"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`material-symbols-outlined text-[15px] ${isVerified ? "text-emerald-600" : ""}`}>
                verified
              </span>
              <span>Verified Worker</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setVerificationStatus("pending");
                showToast("Switched to Pending Verification status.");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                !isVerified
                  ? "bg-white text-amber-700 shadow-sm font-extrabold"
                  : "bg-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <span className={`material-symbols-outlined text-[15px] ${!isVerified ? "text-amber-600" : ""}`}>
                hourglass_top
              </span>
              <span>Pending</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. TWO-COLUMN MAIN LAYOUT ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ================= 3. LEFT COLUMN: REAL-TIME DELHI NCR LEAFLET MAP ================= */}
          <div className="lg:col-span-6 flex flex-col gap-3">
            
            {/* Hub Quick Filter Badges */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <button
                type="button"
                onClick={() => setSelectedHub("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                  selectedHub === "all"
                    ? "bg-[#0A2540] text-white border-[#0A2540] shadow-xs"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                All Hubs (4)
              </button>
              {HUBS_DATA.map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHub(h.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
                    selectedHub === h.name
                      ? "bg-[#ea580c] text-white border-[#ea580c] shadow-xs"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {h.name}
                </button>
              ))}
            </div>

            {/* Leaflet Map Wrapper */}
            <div className="h-[600px] w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative z-0 bg-slate-100">
              <MapContainer
                center={[28.6139, 77.2090]}
                zoom={10}
                scrollWheelZoom={true}
                className="h-full w-full"
                style={{ height: "100%", width: "100%" }}
              >
                {/* Light Theme CartoDB Positron TileLayer */}
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                  url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                />

                {/* Delhi NCR Hub Markers */}
                {HUBS_DATA.map((hub) => (
                  <Marker
                    key={hub.id}
                    position={[hub.lat, hub.lng]}
                    icon={createCustomHubIcon(hub.iconColor, "construction")}
                    eventHandlers={{
                      click: () => {
                        setSelectedHub(hub.name);
                      },
                    }}
                  >
                    <Popup className="custom-coop-popup">
                      <div className="p-1 text-slate-800 font-sans">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="w-2 h-2 rounded-full bg-[#ea580c]" />
                          <h4 className="text-xs font-black text-[#0A2540] m-0">
                            {hub.fullName}
                          </h4>
                        </div>
                        <p className="text-[11px] text-slate-500 m-0 mb-1.5 leading-snug">
                          {hub.address}
                        </p>
                        <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 text-[10px] space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Inventory:</span>
                            <span className="font-bold text-[#0A2540]">{hub.toolsCount}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Steward Helpline:</span>
                            <span className="font-bold text-slate-700">{hub.contact}</span>
                          </div>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>

            {/* Map Footnote */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Hub Dispatch Network • Delhi NCR
              </span>
              <span className="font-bold text-[#0A2540]">4 Certified Depots</span>
            </div>
          </div>

          {/* ================= 4. RIGHT COLUMN: TOOL LISTINGS (LIGHT THEME) ================= */}
          <div className="lg:col-span-6 flex flex-col">
            
            {/* Amber Warning Banner for Pending/Unverified */}
            {!isVerified && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl shadow-xs flex items-start gap-3"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-amber-900 uppercase tracking-wider m-0">
                    Verification Required to Reserve Heavy Equipment
                  </h4>
                  <p className="text-xs text-amber-800 m-0 mt-0.5 leading-relaxed">
                    Heavy tools (up to <strong>₹22,400 replacement value</strong>) are safeguarded under cooperative mutual trust. Complete your Aadhaar e-KYC to unlock instant zero-deposit tool pickup.
                  </p>
                  <button
                    type="button"
                    onClick={() => onNavigate?.("register")}
                    className="mt-2 text-xs font-bold text-amber-900 underline hover:text-amber-950 border-none bg-transparent cursor-pointer p-0 inline-flex items-center gap-1"
                  >
                    <span>Proceed to Worker Verification</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Available Header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="text-sm font-black text-[#0A2540] uppercase tracking-wider m-0">
                  Available Equipment ({filteredTools.length})
                </h3>
                <span className="text-xs text-slate-500">
                  Inspected weekly by Federation Maintenance Guilds
                </span>
              </div>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                Showing: {selectedHub === "all" ? "All Hubs" : selectedHub}
              </span>
            </div>

            {/* Vertically Scrollable List of Tool Cards */}
            <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
              {filteredTools.map((tool) => (
                <div
                  key={tool.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition-all"
                >
                  <img
                    src={tool.imageUrl}
                    alt={tool.name}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0 bg-slate-50"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="px-2 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                        {tool.brand}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-extrabold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        {tool.condition}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-[#0A2540] truncate m-0">
                      {tool.name}
                    </h4>
                    <p className="text-xs text-slate-500 m-0 mt-0.5 line-clamp-1">
                      {tool.specs}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs">
                      <span className="text-[#ea580c] font-black">
                        Value: ₹{tool.replacementValue.toLocaleString()}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-600 font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                        {tool.hubName}
                      </span>
                    </div>
                  </div>

                  {/* Action Button: Verified vs Pending */}
                  <div className="w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
                    {isVerified ? (
                      <button
                        type="button"
                        onClick={() => handleReserve(tool)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-extrabold text-xs rounded-xl shadow-sm transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        <span>Reserve Tool</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReserve(tool)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5 hover:bg-slate-200/60 transition-colors"
                        title="Your profile is pending Federation approval. You can reserve tools once you receive your Verified Badge."
                      >
                        <span className="material-symbols-outlined text-[15px] text-amber-500">lock</span>
                        <span>🔒 Requires Verification</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

          </div>

        </div>
      </div>

      {/* Reservation Success Modal */}
      <AnimatePresence>
        {reservationSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl text-[#0A2540]"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 mx-auto border border-emerald-200 shadow-xs">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <h3 className="text-center text-lg font-black text-[#0A2540] m-0">
                Tool Reserved Successfully!
              </h3>
              <p className="text-center text-xs text-slate-500 mt-1 mb-4">
                Booking Code: <strong className="text-[#ea580c] font-mono text-sm">{reservationSuccess.reservationId}</strong>
              </p>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipment:</span>
                  <span className="font-bold text-[#0A2540]">{reservationSuccess.toolName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Hub:</span>
                  <span className="font-bold text-[#0A2540]">{reservationSuccess.pickupHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deposit Paid:</span>
                  <span className="font-black text-emerald-700">₹0 (Mutual Cooperative Trust)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setReservationSuccess(null)}
                className="w-full py-3 bg-[#0A2540] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all border-none cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
