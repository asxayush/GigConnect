import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { motion, AnimatePresence } from "framer-motion";
import { getWorkers } from "../../api";
import VoiceAssistant from "../VoiceAssistant/VoiceAssistant";
import { DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR } from "../../assets/avatars";

export default function FindHelp({ onNavigate }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sakhiMode, setSakhiMode] = useState(false);
  const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [searchLocation, setSearchLocation] = useState("Connaught Place, New Delhi / 110001");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 2);
    d.setMinutes(0, 0, 0);
    return d;
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [allLoaded, setAllLoaded] = useState(false);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsServiceDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsServiceDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const serviceOptions = [
    { id: "all", label: "All Crafts & Trades", icon: "handyman", count: "250+ Pros" },
    { id: "electrical", label: "Electricians & Power", icon: "bolt", count: "36 Pros" },
    { id: "plumbing", label: "Plumbers & Sanitary", icon: "plumbing", count: "38 Pros" },
    { id: "carpentry", label: "Carpenters & Woodcraft", icon: "carpenter", count: "24 Pros" },
    { id: "painting", label: "Painters & Wall Decor", icon: "format_paint", count: "22 Pros" },
    { id: "domestic", label: "Domestic Helpers & Chores", icon: "home_work", count: "45 Pros" },
    { id: "caregiving", label: "Caregivers & Elder Care", icon: "health_and_safety", count: "19 Pros" },
    { id: "driver", label: "Drivers & Chauffeurs", icon: "directions_car", count: "28 Pros" },
    { id: "gardening", label: "Gardeners & Landscaping", icon: "yard", count: "16 Pros" },
    { id: "cleaning", label: "Deep Cleaners & Sanitization", icon: "cleaning_services", count: "44 Pros" },
    { id: "technician", label: "Technicians & Appliance/HVAC", icon: "mode_fan", count: "26 Pros" },
  ];

  const activeService = serviceOptions.find((opt) => opt.id === selectedCategory) || serviceOptions[0];

  const categoryChips = [
    { id: "all", label: "All Services (250+)" },
    { id: "electrical", label: "Electricians (36)" },
    { id: "plumbing", label: "Plumbers (38)" },
    { id: "carpentry", label: "Carpenters (24)" },
    { id: "painting", label: "Painters (22)" },
    { id: "domestic", label: "Domestic Helpers (45)" },
    { id: "caregiving", label: "Caregivers (19)" },
    { id: "driver", label: "Drivers (28)" },
    { id: "gardening", label: "Gardeners (16)" },
    { id: "cleaning", label: "Cleaners (44)" },
    { id: "technician", label: "Technicians (26)" },
  ];

  // Curated list of verified cooperative Delhi NCR workers across all 10 guilds
  const workers = [
    {
      id: "w1",
      name: "Ramesh Kumar",
      craft: "electrical",
      gender: "Male",
      role: "Certified Master Electrician (10 yrs exp)",
      rating: "4.80",
      jobs: "210 jobs completed",
      credential: "Delhi Co-op Guild #4102",
      credentialIcon: "bolt",
      skills: ["Switchboard & MCB Repair", "Ceiling Fan Installation", "House Rewiring"],
      rateType: "hourly rate",
      rate: "₹250",
      hourlyRate: 250,
      sakhiVerified: false,
      area: "Connaught Place & Central Delhi",
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w2",
      name: "Sunita Devi",
      craft: "cleaning",
      gender: "Female",
      role: "Deep Cleaning & Sanitization Lead (8 yrs exp)",
      rating: "4.90",
      jobs: "420 jobs completed",
      credential: "♀ Sakhi Trust Lead Guild",
      credentialIcon: "award_star",
      skills: ["Full Home Sanitization", "Sofa & Carpet Wash", "Eco Chemicals"],
      rateType: "hourly rate",
      rate: "₹400",
      hourlyRate: 400,
      sakhiVerified: true,
      area: "South Delhi & Noida Sector 62",
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w3",
      name: "Ali Raza",
      craft: "carpentry",
      gender: "Male",
      role: "Woodcraft & Modular Furniture Specialist (12 yrs exp)",
      rating: "4.50",
      jobs: "165 jobs completed",
      credential: "Co-op Woodcraft Guild",
      credentialIcon: "construction",
      skills: ["Door Locks & Handles", "Custom Cupboards", "Bed & Table Assembly"],
      rateType: "hourly rate",
      rate: "₹350",
      hourlyRate: 350,
      sakhiVerified: false,
      area: "Gurugram Cyber City & DLF Phase 2",
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w4",
      name: "Priya Sharma",
      craft: "technician",
      gender: "Female",
      role: "ITI Appliance & AC Maintenance Technician (7 yrs exp)",
      rating: "4.70",
      jobs: "190 jobs completed",
      credential: "♀ Sakhi Certified Technician",
      credentialIcon: "verified",
      skills: ["AC Jet Wash", "Refrigerator Gas Check", "Washing Machine Drum Fix"],
      rateType: "hourly rate",
      rate: "₹300",
      hourlyRate: 300,
      sakhiVerified: true,
      area: "Rohini & North Delhi",
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w5",
      name: "Vikram Singh",
      craft: "plumbing",
      gender: "Male",
      role: "Senior Master Plumber (9 yrs exp)",
      rating: "4.60",
      jobs: "318 jobs completed",
      credential: "Delhi Plumber Co-op #2910",
      credentialIcon: "plumbing",
      skills: ["Pipe Leakage", "Kitchen Sink Clearing", "Overhead Tank Pump"],
      rateType: "hourly rate",
      rate: "₹200",
      hourlyRate: 200,
      sakhiVerified: false,
      area: "Noida Sector 18 & Indirapuram",
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w6",
      name: "Kavita Rao",
      craft: "domestic",
      gender: "Female",
      role: "Certified Domestic Helper & Housekeeping Specialist",
      rating: "4.92",
      jobs: "340 jobs completed",
      credential: "♀ Sakhi Household Guild",
      credentialIcon: "home_work",
      skills: ["Daily Housekeeping", "Meal Assistance", "Wardrobe Organization"],
      rateType: "hourly rate",
      rate: "₹200",
      hourlyRate: 200,
      sakhiVerified: true,
      area: "Dwarka & West Delhi",
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w7",
      name: "Shanti Devi",
      craft: "caregiving",
      gender: "Female",
      role: "Elder Care & Patient Assistance Specialist (6 yrs exp)",
      rating: "4.98",
      jobs: "175 jobs completed",
      credential: "♀ Sakhi Healthcare Guild",
      credentialIcon: "health_and_safety",
      skills: ["Geriatric Mobility", "Vital Signs Monitoring", "Medicine Reminders"],
      rateType: "daily rate",
      rate: "₹700",
      hourlyRate: 350,
      sakhiVerified: true,
      area: "Vasant Kunj & South Delhi",
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w8",
      name: "Rajeshwar Yadav",
      craft: "painting",
      gender: "Male",
      role: "Master Wall Painter & Texture Decorator (11 yrs exp)",
      rating: "4.75",
      jobs: "220 jobs completed",
      credential: "Delhi Painters Co-op Guild",
      credentialIcon: "format_paint",
      skills: ["Interior Emulsion", "Waterproofing Putty", "Stencil & Texture Wall"],
      rateType: "daily rate",
      rate: "₹800",
      hourlyRate: 300,
      sakhiVerified: false,
      area: "Laxmi Nagar & East Delhi",
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w9",
      name: "Harish Chandra",
      craft: "driver",
      gender: "Male",
      role: "Professional Personal Chauffeur & Highway Driver",
      rating: "4.88",
      jobs: "510 jobs completed",
      credential: "Delhi Transport Guild #108",
      credentialIcon: "directions_car",
      skills: ["Automatic & Manual", "Outstation Trips", "Safe City Driving"],
      rateType: "daily rate",
      rate: "₹850",
      hourlyRate: 350,
      sakhiVerified: false,
      area: "Gurugram & Delhi NCR",
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w10",
      name: "Babulal Saini",
      craft: "gardening",
      gender: "Male",
      role: "Horticulture Specialist & Terrace Landscaper (14 yrs exp)",
      rating: "4.85",
      jobs: "195 jobs completed",
      credential: "NCR Horticulture Co-op",
      credentialIcon: "yard",
      skills: ["Bonsai & Terrace Gardens", "Lawn Mowing & Pruning", "Organic Fertilizer"],
      rateType: "hourly rate",
      rate: "₹250",
      hourlyRate: 250,
      sakhiVerified: false,
      area: "Greater Kailash & Chanakyapuri",
      image: DEFAULT_MALE_AVATAR,
    },
  ];

  const [apiWorkers, setApiWorkers] = useState([]);
  const [coords, setCoords] = useState({ lat: 28.6139, lng: 77.2090 });
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [simulatedOnline, setSimulatedOnline] = useState(true);

  // Detect GPS location with fallback to manual entry
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setSearchLocation("Connaught Place, New Delhi (Fallback)");
      return;
    }
    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newCoords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(newCoords);
        setSearchLocation(`Live GPS: ${newCoords.lat.toFixed(4)}, ${newCoords.lng.toFixed(4)}`);
        setIsDetectingLocation(false);
      },
      () => {
        setCoords({ lat: 28.6139, lng: 77.2090 });
        setSearchLocation("Connaught Place, New Delhi (Default Hub)");
        setIsDetectingLocation(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  useEffect(() => {
    const skillMap = {
      all: "",
      electrical: "Electrician",
      plumbing: "Plumber",
      carpentry: "Carpenter",
      painting: "Painter",
      domestic: "Domestic Helper",
      caregiving: "Caregiver",
      driver: "Driver",
      gardening: "Gardener",
      cleaning: "Cleaner",
      technician: "Technician",
    };
    const targetSkill = skillMap[selectedCategory] || "";
    getWorkers(targetSkill, coords, sakhiMode)
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((p) => {
            const rawSkill = p.skills?.[0]?.toLowerCase() || "";
            const derivedCraft = rawSkill.includes("plumb") ? "plumbing"
              : rawSkill.includes("elect") ? "electrical"
              : rawSkill.includes("carp") ? "carpentry"
              : rawSkill.includes("paint") ? "painting"
              : rawSkill.includes("domest") || rawSkill.includes("house") ? "domestic"
              : rawSkill.includes("care") || rawSkill.includes("elder") ? "caregiving"
              : rawSkill.includes("driv") ? "driver"
              : rawSkill.includes("garden") || rawSkill.includes("hort") ? "gardening"
              : rawSkill.includes("clean") || rawSkill.includes("sanit") ? "cleaning"
              : rawSkill.includes("tech") || rawSkill.includes("app") || rawSkill.includes("ac") ? "technician"
              : "all";

            const distanceText = p.distanceText || (p.distanceKm != null ? `${p.distanceKm} km away` : "Nearby");
            const calculatedEta = p.calculatedEta || (p.etaMinutes ? `${p.etaMinutes} mins arrival` : null);

            return {
              id: p._id,
              userId: p.userId?._id,
              name: p.userId?.name || "Verified Cooperative Tradesperson",
              craft: selectedCategory === "all" ? derivedCraft : selectedCategory,
              role: `${p.skills?.join(" • ") || "Master Tradesperson"}`,
              rating: Number(p.ratingAvg || 4.85).toFixed(2),
              jobs: `${p.jobsCompleted || 120} jobs completed`,
              credential: "Co-op Verified Member",
              credentialIcon: "verified",
              skills: p.skills || [],
              rateType: "standard rate",
              rate: "₹300",
              hourlyRate: 300,
              distanceText,
              calculatedEta,
              distanceKm: p.distanceKm ?? null,
              lat: p.lat ?? (Array.isArray(p.location?.coordinates) ? p.location.coordinates[1] : null),
              lng: p.lng ?? (Array.isArray(p.location?.coordinates) ? p.location.coordinates[0] : null),
              sakhiVerified: Boolean(p.isSakhiVerified || p.sakhiVerified),
              area: p.userId?.location?.area || "Delhi NCR",
              image: p.photoUrl || (p.isSakhiVerified || p.sakhiVerified || p.userId?.gender?.toLowerCase() === "female" ? DEFAULT_FEMALE_AVATAR : DEFAULT_MALE_AVATAR),
            };
          });
          setApiWorkers(mapped);
        }
      })
      .catch((err) => {
        console.warn("Workers API fallback to curated list:", err.message);
      });
  }, [selectedCategory, coords, sakhiMode]);

  const activeWorkerList = apiWorkers.length > 0 ? apiWorkers : workers;

  // Filter by craft category AND Sakhi Mode safety toggle
  const filteredWorkers = useMemo(() => {
    let list = activeWorkerList;

    if (selectedCategory !== "all") {
      list = list.filter(
        (w) => w.craft === selectedCategory || w.role?.toLowerCase()?.includes(selectedCategory)
      );
    }

    if (sakhiMode) {
      list = list.filter((w) => w.sakhiVerified === true);
    }

    return list;
  }, [selectedCategory, sakhiMode, activeWorkerList]);

  const handleBook = (worker) => {
    onNavigate?.("booking", {
      name: worker.name,
      userId: worker.userId || worker.id,
      skills: [worker.role],
      price: worker.rate,
      prefilledDate: selectedDate.toISOString(),
      trade: worker.role,
      hourlyRate: worker.hourlyRate,
      avatar: worker.image,
      coopId: worker.credential,
    });
  };

  const handleChat = (worker) => {
    onNavigate?.("messages", {
      name: worker.name,
      trade: worker.role,
      avatar: worker.image,
      hourlyRate: worker.hourlyRate,
      rating: worker.rating,
      category: worker.craft,
    });
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setLoadingMore(false);
      setAllLoaded(true);
    }, 600);
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen font-sans">
      <div className="flex flex-col w-full relative">
        
        {/* Subtle Ambient Jaali Geometry */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 overflow-hidden opacity-[0.04] -z-10 select-none">
          <svg className="text-primary-container" fill="none" height="400" viewBox="0 0 400 400" width="400">
            <defs>
              <pattern id="coop-jaali-grid-findhelp" patternUnits="userSpaceOnUse" width="40" height="40">
                <path d="M 40 0 L 0 40 M 0 0 L 40 40" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="20" cy="20" fill="none" r="14" stroke="currentColor" strokeWidth="1.5" />
                <rect fill="none" height="20" stroke="currentColor" strokeWidth="1" width="20" x="10" y="10" />
              </pattern>
            </defs>
            <rect fill="url(#coop-jaali-grid-findhelp)" height="400" width="400" />
          </svg>
        </div>

        {/* Main Directory Container */}
        <div className="max-w-max-content-width mx-auto w-full px-margin-mobile md:px-margin-desktop py-space-8">
          
          {/* Header Section */}
          <div className="flex flex-col gap-space-2 mb-space-8">
            <div className="flex items-center gap-space-2 text-primary font-label-sm text-label-sm uppercase tracking-wider">
              <span className="inline-block w-2 h-2 rounded-full bg-secondary-container" />
              <span>Verified Cooperative Worker Federation • Delhi NCR</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4">
              <div>
                <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-extrabold tracking-tight">
                  Book Skilled Trades &amp; Direct Services
                </h1>
                <p className="font-body-lg text-body-lg text-on-surface-variant m-0 mt-1">
                  100% Aadhaar-verified karigars with zero middleman surge pricing.
                </p>
              </div>

              {/* ================= FEATURE 2: SAKHI TRUST WOMEN'S SAFETY TOGGLE ================= */}
              <div className="flex-shrink-0">
                <div
                  className={`p-3 rounded-2xl border transition-all duration-300 shadow-sm flex items-center justify-between gap-3 ${
                    sakhiMode
                      ? "bg-gradient-to-r from-pink-50 via-purple-50 to-pink-100/60 border-pink-300 ring-2 ring-pink-400/30 shadow-[0_4px_20px_rgba(236,72,153,0.15)]"
                      : "bg-surface-container-low border-border-tone/40 hover:bg-surface-container"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-lg transition-colors ${
                        sakhiMode
                          ? "bg-pink-600 text-white shadow-md shadow-pink-500/30"
                          : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      ♀
                    </div>
                    <div>
                      <span className="font-label-md text-label-md text-slate-900 font-extrabold block leading-tight">
                        Sakhi Mode
                      </span>
                      <span className="text-[11px] text-pink-700 font-semibold block">
                        Women-to-Women / Verified Safe
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch Button */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={sakhiMode}
                    onClick={() => setSakhiMode(!sakhiMode)}
                    className={`w-12 h-7 rounded-full transition-colors relative cursor-pointer border-none p-0.5 flex items-center ${
                      sakhiMode ? "bg-gradient-to-r from-pink-500 to-purple-600" : "bg-slate-300"
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-200 block ${
                        sakhiMode ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sakhi Mode Active Banner Notification */}
          <AnimatePresence>
            {sakhiMode && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                className="mb-space-6 p-space-4 bg-gradient-to-r from-pink-50 via-purple-50 to-pink-50 border border-pink-200 rounded-2xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-pink-600 text-white flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                  </div>
                  <p className="text-xs text-pink-900 font-medium m-0 leading-relaxed">
                    <strong>♀ Sakhi Trust Active:</strong> Filtering for verified female professionals and safety-audited service providers for comfortable, secure in-home service.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSakhiMode(false)}
                  className="text-xs font-bold text-pink-700 hover:text-pink-900 underline border-none bg-transparent cursor-pointer flex-shrink-0"
                >
                  Turn Off
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-4 p-space-4 bg-surface-container-lowest rounded-2xl shadow-xl border border-border-tone/30 mb-space-8">
            
            {/* Service Category Dropdown */}
            <div className="lg:col-span-4 relative" ref={dropdownRef}>
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Selected Service
              </label>
              <button
                type="button"
                onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                className="w-full h-12 bg-surface-container-low px-4 rounded-xl flex items-center justify-between text-on-surface font-label-lg text-label-lg font-bold border border-transparent focus:border-primary cursor-pointer transition-all"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">
                    {activeService.icon}
                  </span>
                  <span>{activeService.label}</span>
                </div>
                <span className="material-symbols-outlined text-outline">
                  {isServiceDropdownOpen ? "expand_less" : "expand_more"}
                </span>
              </button>

              {isServiceDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-surface-container-lowest rounded-xl shadow-2xl border border-border-tone/40 py-2 z-50 animate-in fade-in zoom-in-95">
                  {serviceOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(opt.id);
                        setIsServiceDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-surface-container text-left border-none bg-transparent cursor-pointer ${
                        selectedCategory === opt.id ? "bg-primary-container/10 text-primary font-bold" : "text-on-surface"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-primary">{opt.icon}</span>
                        <span>{opt.label}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{opt.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Location Input with GPS button */}
            <div className="lg:col-span-4">
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Service Location &amp; 2dsphere Radial Search
              </label>
              <div className="relative flex items-center h-12 bg-surface-container-low px-3 rounded-xl border border-transparent focus-within:border-primary">
                <span className="material-symbols-outlined text-primary text-[20px] mr-2">location_on</span>
                <input
                  type="text"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  placeholder="Enter Delhi NCR locality / Pin"
                  className="w-full bg-transparent text-xs sm:text-sm text-on-surface font-semibold focus:outline-none border-none"
                />
                <button
                  type="button"
                  onClick={handleDetectLocation}
                  disabled={isDetectingLocation}
                  className="px-2.5 py-1.5 bg-primary text-on-primary rounded-lg text-[11px] font-bold border-none cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
                  title="Detect live GPS coordinates"
                >
                  <span className={`material-symbols-outlined text-[14px] ${isDetectingLocation ? "animate-spin" : ""}`}>
                    near_me
                  </span>
                  <span className="hidden sm:inline">GPS</span>
                </button>
              </div>
            </div>

            {/* Date Picker */}
            <div className="lg:col-span-4">
              <label className="font-label-sm text-label-sm text-on-surface-variant block mb-1">
                Date &amp; Time
              </label>
              <div className="relative flex items-center h-12 bg-surface-container-low px-4 rounded-xl border border-transparent focus-within:border-primary [&>.react-datepicker-wrapper]:w-full">
                <span className="material-symbols-outlined text-primary text-[20px] mr-2 pointer-events-none">
                  calendar_month
                </span>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date) => setSelectedDate(date)}
                  showTimeSelect
                  timeIntervals={30}
                  minDate={new Date()}
                  dateFormat="d MMM yyyy, h:mm aa"
                  className="w-full bg-transparent text-sm text-on-surface font-semibold focus:outline-none border-none cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Filter Chips & Voice Search */}
          <div className="flex items-center justify-between gap-4 mb-space-8 overflow-x-auto no-scrollbar pb-1">
            <div className="flex items-center gap-2">
              {categoryChips.map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedCategory(chip.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border-none cursor-pointer flex-shrink-0 ${
                    selectedCategory === chip.id
                      ? "bg-primary-container text-on-primary shadow-sm"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            <VoiceAssistant onServiceDetected={(cat) => setSelectedCategory(cat)} className="shrink-0" />
          </div>

          {/* ================= WORKER CARDS GRID ================= */}
          {filteredWorkers.length === 0 ? (
            <div className="py-16 text-center bg-surface-container-low rounded-3xl border border-border-tone/30">
              <span className="material-symbols-outlined text-5xl text-outline mb-2">search_off</span>
              <h3 className="text-lg font-bold text-on-surface m-0">No matching professionals found</h3>
              <p className="text-sm text-on-surface-variant max-w-sm mx-auto mt-1 mb-4">
                {sakhiMode
                  ? "No ♀ Sakhi Verified professionals currently available in this specific category. Try viewing all categories or turn off Sakhi Mode."
                  : "Try clearing search filters to see all available cooperative members."}
              </p>
              {sakhiMode && (
                <button
                  type="button"
                  onClick={() => setSakhiMode(false)}
                  className="px-5 py-2.5 bg-primary-container text-on-primary font-bold text-xs rounded-xl border-none cursor-pointer"
                >
                  View All Verified Workers
                </button>
              )}
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {filteredWorkers.map((w) => {
                  const visibleSkills = (w.skills || []).slice(0, 3);
                  const remainingSkillsCount = Math.max(0, (w.skills?.length || 0) - 3);

                  return (
                    <motion.div
                      key={w.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className={`rounded-2xl p-5 transition-all flex flex-col justify-between border ${
                        w.sakhiVerified
                          ? "bg-gradient-to-br from-white via-pink-50/20 to-purple-50/15 border-pink-300 ring-1 ring-pink-400/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5"
                          : "bg-surface-container-lowest border-border-tone/30 shadow-xs hover:shadow-lg hover:-translate-y-0.5"
                      }`}
                    >
                      <div>
                        {/* Top Badges Bar */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          {w.sakhiVerified ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-full text-[11px] font-bold shadow-xs">
                              <span>♀</span> Sakhi Verified Safe
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-surface-container text-primary rounded-full text-[11px] font-bold border border-border-tone/30">
                              <span className="material-symbols-outlined text-[13px]">verified</span> Co-op Certified
                            </span>
                          )}

                          <span className="text-xs text-on-surface-variant font-medium truncate max-w-[140px] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[13px] text-primary">place</span>
                            {w.area || "Delhi NCR"}
                          </span>
                        </div>

                        {/* Profile Info Header */}
                        <div className="flex items-start gap-3.5 mb-3">
                          <img
                            src={w.image}
                            alt={w.name}
                            className={`w-14 h-14 rounded-2xl object-cover flex-shrink-0 ${
                              w.sakhiVerified ? "ring-2 ring-pink-400 border border-white shadow-xs" : "border border-gray-200 shadow-xs"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm sm:text-base font-bold text-on-surface m-0 truncate">
                              {w.name}
                            </h3>
                            <p className="text-xs text-on-surface-variant m-0 mt-0.5 truncate">
                              {w.role}
                            </p>
                            
                            {/* Rating and completed jobs */}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                                <span>★</span>
                                <span>{w.rating}</span>
                              </div>
                              <span className="text-[11px] text-on-surface-variant font-medium">
                                {w.jobs}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Geospatial Distance & ETA Banner */}
                        <div className="mb-3 px-2.5 py-1.5 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-800 text-xs font-semibold flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">near_me</span>
                            <span>{w.distanceText || "Distance pending GPS"}</span>
                          </div>
                          <span className="font-bold text-emerald-900">
                            ⏱ {w.calculatedEta || "ETA pending"}
                          </span>
                        </div>

                        {/* Skill Tags */}
                        <div className="flex flex-wrap gap-1.5 mb-4">
                          {visibleSkills.map((skill, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-surface-container text-on-surface text-[11px] font-medium rounded-md truncate max-w-[170px]"
                            >
                              {skill}
                            </span>
                          ))}
                          {remainingSkillsCount > 0 && (
                            <span className="px-1.5 py-0.5 bg-surface-container text-on-surface-variant text-[10px] font-bold rounded-md">
                              +{remainingSkillsCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Tariff & Action Buttons */}
                      <div className="pt-3 border-t border-border-tone/20 mt-auto">
                        <div className="flex items-baseline justify-between mb-3">
                          <span className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">
                            Direct Cooperative Tariff
                          </span>
                          <div>
                            <span className="text-base font-black text-primary">{w.rate}</span>
                            <span className="text-xs text-on-surface-variant"> / hr</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleChat(w)}
                            className="py-2.5 px-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-all border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px] text-emerald-600">chat</span>
                            <span>Chat</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleBook(w)}
                            className="py-2.5 px-2 rounded-xl bg-secondary-container hover:opacity-95 active:scale-95 text-on-secondary font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[15px]">calendar_month</span>
                            <span>Book</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Load More Trigger */}
          <div className="mt-space-12 text-center">
            {!allLoaded ? (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-space-8 py-space-3 bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-bold rounded-xl shadow-sm transition-all border border-border-tone/40 cursor-pointer"
              >
                {loadingMore ? "Loading more verified federation pros..." : "Load More Co-op Tradespeople"}
              </button>
            ) : (
              <span className="text-xs text-on-surface-variant font-medium">
                ✓ Showing all available active cooperative guild members in Delhi NCR.
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
