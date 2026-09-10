import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../toast";
import { getToolInventory, rentToolItem, returnToolItem, getMyToolRentals, API_URL } from "../api";

const BACKEND_URL = API_URL;

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
    toolId: "tool-101",
    name: "Bosch Professional GBH 2-26 DRE Rotary Hammer Drill",
    category: "Electrical & Heavy Drilling",
    brand: "Bosch Power Tools",
    specs: "800W motor, 2.7 Joules impact energy, SDS-plus chuck",
    replacementValue: 15499,
    coopDailyFee: 0,
    totalStock: 3,
    availableStock: 3,
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
    toolId: "tool-102",
    name: "DeWalt DWE560 Heavy-Duty Circular Saw 184mm",
    category: "Carpentry & Woodcraft",
    brand: "DeWalt Industrial Tools",
    specs: "1350W high-torque motor, 65mm cutting depth",
    replacementValue: 12850,
    coopDailyFee: 0,
    totalStock: 2,
    availableStock: 2,
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
    toolId: "tool-103",
    name: "Stanley Heavy Inverter Arc Welder 200A",
    category: "Metalwork & Fabrication",
    brand: "Stanley FatMax",
    specs: "IGBT inverter technology, anti-stick hot start",
    replacementValue: 18900,
    coopDailyFee: 0,
    totalStock: 2,
    availableStock: 2,
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
    toolId: "tool-104",
    name: "Fluke 117 Electrician's True RMS Digital Multimeter",
    category: "Electrical Diagnostic",
    brand: "Fluke Calibration",
    specs: "VoltAlert non-contact AC voltage detection, LoZ impedance",
    replacementValue: 22400,
    coopDailyFee: 0,
    totalStock: 4,
    availableStock: 4,
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
    toolId: "tool-105",
    name: 'RIDGID Heavy Duty Pipe Threader & Die Kit (1/2" to 2")',
    category: "Plumbing & Sanitary",
    brand: "RIDGID Professional",
    specs: "Drop head ratchet threader with alloy dies",
    replacementValue: 16500,
    coopDailyFee: 0,
    totalStock: 2,
    availableStock: 2,
    status: "available",
    condition: "Inspected & Lubricated",
    hubName: "Okhla Phase 3 Hub",
    hubAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    lat: 28.5355,
    lng: 77.2600,
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
  },
];

const SAMPLE_RENTALS = [
  {
    _id: "rent-1",
    rentalCode: "TB-RES-492019",
    toolId: "tool-101",
    toolName: "Bosch Professional GBH 2-26 DRE Rotary Hammer Drill",
    brand: "Bosch Power Tools",
    pickupHub: "Okhla Phase 3 Cooperative Tool Hub",
    pickupAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    replacementValue: 15499,
    status: "active",
    rentedAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expectedReturnAt: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
  },
  {
    _id: "rent-2",
    rentalCode: "TB-RES-381022",
    toolId: "tool-104",
    toolName: "Fluke 117 Electrician's True RMS Digital Multimeter",
    brand: "Fluke Calibration",
    pickupHub: "Connaught Place Central Tool Depot",
    pickupAddress: "Super Bazar Complex, Outer Circle CP, New Delhi - 110001",
    replacementValue: 22400,
    status: "returned",
    rentedAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    returnedAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80",
  },
];

export default function ToolBankMap({ onNavigate }) {
  const [tools, setTools] = useState(INITIAL_TOOLS);
  const [selectedHub, setSelectedHub] = useState("all");
  const [activeTab, setActiveTab] = useState("inventory"); // "inventory" | "my-rentals"
  const [reservationSuccess, setReservationSuccess] = useState(null);
  const [activeRentals, setActiveRentals] = useState([]);
  const [allRentals, setAllRentals] = useState(SAMPLE_RENTALS);
  const [rentalsFilter, setRentalsFilter] = useState("all"); // "all" | "active" | "returned"
  const [qrModalRental, setQrModalRental] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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
    return "pending";
  });

  const isVerified = verificationStatus === "verified";

  const refreshInventoryAndRentals = () => {
    const token = localStorage.getItem("gigconnect_token");
    getToolInventory()
      .then((res) => {
        if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
          setTools(res.data);
        }
      })
      .catch(() => {});

    if (token) {
      getMyToolRentals(token)
        .then((res) => {
          if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
            setAllRentals(res.data);
            setActiveRentals(res.data.filter((r) => r.status === "active"));
          }
        })
        .catch(() => {});
    }
  };

  useEffect(() => {
    localStorage.setItem("gigconnect_worker_status", verificationStatus);
  }, [verificationStatus]);

  useEffect(() => {
    refreshInventoryAndRentals();
  }, []);

  const filteredTools = tools.filter((t) => {
    if (selectedHub === "all") return true;
    return (
      t.hubName?.toLowerCase().includes(selectedHub.toLowerCase()) ||
      selectedHub.toLowerCase().includes(t.hubName?.toLowerCase() || "")
    );
  });

  const filteredRentals = allRentals.filter((r) => {
    if (rentalsFilter === "all") return true;
    return r.status === rentalsFilter;
  });

  // ================= 2. ACTION BUTTON & RESERVATION LOGIC =================
  const handleReserve = async (tool) => {
    if (!isVerified) {
      showToast(
        "Aadhaar e-KYC verification required. You can reserve tools once verified by the Cooperative Federation."
      );
      return;
    }

    if (tool.availableStock <= 0) {
      showToast(`This tool is currently out of stock at ${tool.hubName}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const token = localStorage.getItem("gigconnect_token") || "demo-verified-worker-token";
      const res = await rentToolItem(tool.toolId || tool.id, token);

      if (res?.success) {
        setReservationSuccess(res.data);
        const newRental = {
          _id: res.data.rentalId || `rent-${Date.now()}`,
          rentalCode: res.data.reservationId,
          toolId: tool.toolId,
          toolName: tool.name,
          brand: tool.brand,
          pickupHub: tool.hubName,
          pickupAddress: tool.hubAddress,
          replacementValue: tool.replacementValue,
          status: "active",
          rentedAt: res.data.rentedAt || new Date().toISOString(),
          expectedReturnAt: res.data.validUntil || new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          imageUrl: tool.imageUrl,
        };
        setAllRentals((prev) => [newRental, ...prev.filter((r) => r._id !== newRental._id)]);
        setActiveRentals((prev) => [newRental, ...prev.filter((r) => r._id !== newRental._id)]);
        showToast(`✓ ${tool.name} checked out with zero cash deposit!`);
        refreshInventoryAndRentals();
      } else {
        showToast(res?.message || "Tool reservation failed.");
      }
    } catch (e) {
      showToast(e.message || "Tool reservation failed. The item was not booked.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReturn = async (rentalId) => {
    setIsProcessing(true);
    try {
      const token = localStorage.getItem("gigconnect_token") || "demo-verified-worker-token";
      const res = await returnToolItem(rentalId, token);
      if (res?.success) {
        setAllRentals((prev) =>
          prev.map((r) =>
            r._id === rentalId ? { ...r, status: "returned", returnedAt: new Date().toISOString() } : r
          )
        );
        setActiveRentals((prev) => prev.filter((r) => r._id !== rentalId));
        showToast("✓ Equipment successfully returned to Hub. Stock restored.");
        refreshInventoryAndRentals();
      }
    } catch (err) {
      showToast(err.message || "Failed to return tool");
    } finally {
      setIsProcessing(false);
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
                0% Cash Deposit
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 m-0 mt-0.5 font-medium">
              Reserve heavy cooperative equipment across Delhi NCR. Mutual cooperative trust for verified karigars.
            </p>
          </div>

          {/* Segmented Control for Simulate Verification */}
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

      {/* ================= VIEW SWITCHER: INVENTORY VS MY RENTALS ================= */}
      <div className="bg-white border-b border-slate-200 sticky top-[73px] z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "inventory"
                  ? "bg-[#0A2540] text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">home_repair_service</span>
              <span>Hub Map &amp; Inventory</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("my-rentals")}
              className={`px-4 py-2 rounded-lg text-xs font-black transition-all border-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "my-rentals"
                  ? "bg-[#0A2540] text-white shadow-sm"
                  : "bg-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
              <span>My Rentals &amp; QR Passes</span>
              <span className="ml-1 px-1.5 py-0.2 bg-[#ea580c] text-white rounded-full text-[10px]">
                {allRentals.length}
              </span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span>Cooperative Equipment Trust • 0% Security Deposit</span>
          </div>
        </div>
      </div>

      {/* Active Unreturned Rental Notification Banner */}
      {activeRentals.length > 0 && activeTab === "inventory" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[20px]">handyman</span>
              </div>
              <div>
                <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
                  Active Tool Checkout: {activeRentals[0].rentalCode}
                </span>
                <p className="text-xs text-blue-800 m-0">
                  {activeRentals[0].toolName || activeRentals[0].toolId} checked out from {activeRentals[0].pickupHub}. Policy limit: 1 active equipment per worker.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setQrModalRental(activeRentals[0])}
                className="px-3 py-2 bg-white hover:bg-blue-100 text-blue-900 text-xs font-black rounded-xl border border-blue-300 cursor-pointer transition-all flex items-center gap-1 shadow-2xs"
              >
                <span className="material-symbols-outlined text-[15px]">qr_code_2</span>
                <span>Hub QR</span>
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() => handleReturn(activeRentals[0]._id)}
                className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold rounded-xl border-none cursor-pointer transition-all shadow-xs"
              >
                Return Tool to Depot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 1: INVENTORY & LEAFLET MAP ================= */}
      {activeTab === "inventory" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* LEFT COLUMN: REAL-TIME DELHI NCR LEAFLET MAP */}
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
                  center={[28.6139, 77.209]}
                  zoom={10}
                  scrollWheelZoom={true}
                  className="h-full w-full"
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                  />

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
                            <strong className="text-xs text-[#0A2540]">{hub.fullName}</strong>
                          </div>
                          <p className="text-[11px] text-slate-600 m-0 mb-1">{hub.address}</p>
                          <div className="text-[10px] text-[#ea580c] font-bold bg-orange-50 px-2 py-0.5 rounded">
                            📦 {hub.toolsCount}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* RIGHT COLUMN: EQUIPMENT LIST */}
            <div className="lg:col-span-6 flex flex-col">
              {!isVerified && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0 mt-0.5">
                    shield_lock
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-amber-900 m-0">
                      Aadhaar Verification Required to Reserve Tools
                    </h4>
                    <p className="text-xs text-amber-800 m-0 mt-0.5 leading-relaxed">
                      Heavy equipment (up to <strong>₹22,400 replacement value</strong>) is unlocked under cooperative mutual trust. Complete Aadhaar e-KYC to reserve without cash deposits.
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
                    Real stock tracked in MongoDB with server-side Aadhaar gating
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                  Showing: {selectedHub === "all" ? "All Hubs" : selectedHub}
                </span>
              </div>

              {/* Vertically Scrollable List of Tool Cards */}
              <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredTools.map((tool) => {
                  const inStock = (tool.availableStock ?? 1) > 0;
                  return (
                    <div
                      key={tool.id || tool.toolId}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-slate-300 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm transition-all"
                    >
                      <img
                        src={tool.imageUrl}
                        alt={tool.name}
                        className="w-20 h-20 rounded-xl object-cover border border-slate-100 flex-shrink-0 bg-slate-50"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="px-2 py-0.2 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md uppercase">
                            {tool.brand}
                          </span>
                          <span className={`text-[11px] font-extrabold flex items-center gap-0.5 ${inStock ? "text-emerald-700" : "text-red-600"}`}>
                            <span className="material-symbols-outlined text-[13px]">{inStock ? "check_circle" : "cancel"}</span>
                            {inStock ? `${tool.availableStock ?? 1} Available in Hub` : "Out of Stock"}
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
                            Value: ₹{Number(tool.replacementValue || 15000).toLocaleString()}
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-600 font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px] text-slate-400">location_on</span>
                            {tool.hubName}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0">
                        {isVerified ? (
                          <button
                            type="button"
                            disabled={!inStock || isProcessing}
                            onClick={() => handleReserve(tool)}
                            className={`w-full sm:w-auto px-4 py-2.5 font-extrabold text-xs rounded-xl shadow-sm transition-all border-none flex items-center justify-center gap-1.5 ${
                              inStock
                                ? "bg-[#ea580c] hover:bg-[#c2410c] text-white cursor-pointer active:scale-95"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed"
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {inStock ? "check_circle" : "block"}
                            </span>
                            <span>{inStock ? "Reserve Tool (0% Deposit)" : "Out of Stock"}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleReserve(tool)}
                            className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl font-bold text-xs cursor-not-allowed flex items-center justify-center gap-1.5 hover:bg-slate-200/60 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[15px] text-amber-500">lock</span>
                            <span>🔒 Requires Aadhaar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: MY RENTALS & QR PASSES ================= */}
      {activeTab === "my-rentals" && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-black text-[#0A2540] m-0">My Equipment Rentals &amp; QR Passes</h2>
              <p className="text-xs text-slate-500 m-0 mt-0.5">
                Active passes for Hub pickup and return verification. Hand over to Hub Supervisor without cash deposits.
              </p>
            </div>

            {/* Filter segmented buttons */}
            <div className="inline-flex p-1 bg-white rounded-xl border border-slate-200 self-start md:self-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setRentalsFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  rentalsFilter === "all" ? "bg-[#0A2540] text-white" : "bg-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                All ({allRentals.length})
              </button>
              <button
                type="button"
                onClick={() => setRentalsFilter("active")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  rentalsFilter === "active" ? "bg-[#ea580c] text-white" : "bg-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Active ({allRentals.filter((r) => r.status === "active").length})
              </button>
              <button
                type="button"
                onClick={() => setRentalsFilter("returned")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-none cursor-pointer ${
                  rentalsFilter === "returned" ? "bg-slate-700 text-white" : "bg-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Returned ({allRentals.filter((r) => r.status === "returned").length})
              </button>
            </div>
          </div>

          {filteredRentals.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-lg mx-auto">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
              <h3 className="text-base font-black text-[#0A2540] m-0">No rentals found</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                You have no equipment checkouts matching this filter. Browse our 4 Delhi NCR cooperative hubs to reserve professional equipment.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab("inventory")}
                className="px-5 py-2.5 bg-[#ea580c] hover:bg-[#c2410c] text-white font-black text-xs rounded-xl border-none cursor-pointer transition-all shadow-sm"
              >
                Browse Hub Equipment
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredRentals.map((rental) => {
                const isActive = rental.status === "active";
                return (
                  <div
                    key={rental._id || rental.rentalCode}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status line */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="font-mono text-xs font-black text-[#ea580c] bg-orange-50 px-2.5 py-1 rounded-lg border border-orange-200">
                          {rental.rentalCode}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            {isActive ? "check_circle" : "done_all"}
                          </span>
                          <span>{isActive ? "Active (0% Deposit)" : "Returned to Hub ✓"}</span>
                        </span>
                      </div>

                      {/* Tool info */}
                      <div className="flex items-start gap-3.5 mb-3">
                        <img
                          src={rental.imageUrl || "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80"}
                          alt={rental.toolName}
                          className="w-16 h-16 rounded-2xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-black text-[#0A2540] m-0 truncate">
                            {rental.toolName}
                          </h4>
                          <span className="text-[11px] font-bold text-slate-500 block mt-0.5">
                            {rental.brand || "Cooperative Verified Hardware"}
                          </span>
                          <span className="text-xs text-[#ea580c] font-black mt-1 block">
                            Value: ₹{Number(rental.replacementValue || 15000).toLocaleString()} (Covered by Mutual Trust)
                          </span>
                        </div>
                      </div>

                      {/* Hub & Dates info */}
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs space-y-1.5 mb-4 text-slate-700">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <span className="material-symbols-outlined text-[15px] text-[#ea580c]">hub</span>
                          <span className="font-bold text-[#0A2540]">{rental.pickupHub}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                          <span className="truncate">{rental.pickupAddress}</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200 text-slate-600">
                          <span>Rented: {new Date(rental.rentedAt).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                          {isActive ? (
                            <span className="font-bold text-amber-700">Due: Tomorrow 6:00 PM</span>
                          ) : (
                            <span className="text-emerald-700 font-bold">Returned ✓</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setQrModalRental(rental)}
                        className="flex-1 py-2.5 px-3 bg-[#0A2540] hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl border-none cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                      >
                        <span className="material-symbols-outlined text-[16px] text-amber-400">qr_code_2</span>
                        <span>View Hub QR Code</span>
                      </button>

                      {isActive && (
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReturn(rental._id)}
                          className="py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black text-xs rounded-xl border border-emerald-300 cursor-pointer transition-all flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[15px]">assignment_return</span>
                          <span>Return</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= RESERVATION SUCCESS MODAL ================= */}
      <AnimatePresence>
        {reservationSuccess && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-[#0A2540]"
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

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs mb-5">
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

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const r = reservationSuccess;
                    setReservationSuccess(null);
                    setQrModalRental({
                      rentalCode: r.reservationId,
                      toolName: r.toolName,
                      pickupHub: r.pickupHub,
                      pickupAddress: r.pickupAddress,
                      status: "active",
                      toolId: r.toolId,
                    });
                  }}
                  className="flex-1 py-3 bg-[#ea580c] hover:bg-[#c2410c] text-white font-black text-xs rounded-xl transition-all border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                  <span>View Hub QR Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReservationSuccess(null)}
                  className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl transition-all border-none cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= QR CODE HANDOVER / RETURN PASS MODAL ================= */}
      <AnimatePresence>
        {qrModalRental && (
          <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl text-[#0A2540] relative overflow-hidden"
            >
              {/* Header Badge */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ea580c]" />
                  <span className="text-xs font-black uppercase tracking-wider text-[#0A2540]">
                    Sahakari Tool Bank Pass
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrModalRental(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>

              {/* Centered QR Code Box */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center mb-4">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 mb-3">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                      `GIGCONNECT:TOOL_RENTAL:${qrModalRental.rentalCode || qrModalRental._id}:${qrModalRental.toolId || "TOOL"}`
                    )}`}
                    alt="Equipment Checkout QR"
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <span className="font-mono text-xs font-black text-[#ea580c] tracking-wider">
                  {qrModalRental.rentalCode || qrModalRental.reservationId}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Scan at Cooperative Hub Terminal
                </span>
              </div>

              {/* Pass Details */}
              <div className="space-y-2 text-xs mb-5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div className="flex justify-between">
                  <span className="text-slate-500">Equipment:</span>
                  <span className="font-bold text-[#0A2540] truncate max-w-[200px]">
                    {qrModalRental.toolName || qrModalRental.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pickup Hub:</span>
                  <span className="font-bold text-[#0A2540]">{qrModalRental.pickupHub}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Security Deposit:</span>
                  <span className="font-black text-emerald-700">₹0 (Mutual Trust Gated)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rental Status:</span>
                  <span className={`font-bold capitalize ${qrModalRental.status === "active" ? "text-emerald-700" : "text-slate-600"}`}>
                    {qrModalRental.status === "active" ? "Active Checkout" : "Returned & Inspected"}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    showToast("Pass saved to offline wallet.");
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border-none cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">file_download</span>
                  <span>Save Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQrModalRental(null)}
                  className="flex-1 py-2.5 bg-[#0A2540] hover:bg-slate-800 text-white text-xs font-black rounded-xl border-none cursor-pointer shadow-md transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
