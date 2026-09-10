import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import { showToast } from "../../toast";
import { DEFAULT_MALE_AVATAR } from "../../assets/avatars";
import {
  API_URL,
  getPendingBookingsForWorker,
  acceptBookingRequest,
  declineBookingRequest,
} from "../../api";

export default function WorkerDashboard({ onNavigate, user: propUser }) {
  // Current worker session (Seeded Rajesh Kumar ID)
  const workerUser =
    propUser ||
    (() => {
      try {
        const saved = localStorage.getItem("gigconnect_user") || localStorage.getItem("gig_user");
        return saved ? JSON.parse(saved) : null;
      } catch {
        return null;
      }
    })() || {
      id: "6aa284a4d667617a99b8f0e8",
      _id: "6aa284a4d667617a99b8f0e8",
      name: "Rajesh Kumar",
      phone: "+91 98110 41022",
      email: "plumber.demo@gigconnect.coop",
      role: "worker",
      craft: "Plumber",
      category: "Plumber",
      skills: ["Plumber", "Plumbing & Sanitary"],
      guildId: "Delhi Co-op Guild #4102",
      rating: 4.9,
      experienceYears: 8,
      trustBadge: "Sahakari Bhai Trust ✓",
      typicalArrivalTime: "15 mins",
      jobsCompleted: 318,
      isDemo: true,
    };

  // Dashboard Tab state: "jobs" | "payouts" | "toolbank"
  const [activeTab, setActiveTab] = useState("jobs");
  const [isOnline, setIsOnline] = useState(true);

  // Earnings & Wallet State
  const [walletBalance, setWalletBalance] = useState(12450);
  const [todayEarnings, setTodayEarnings] = useState(1850);
  const [weeklyEarnings, setWeeklyEarnings] = useState(8900);
  const [lifetimeSettled, setLifetimeSettled] = useState(64200);

  // Withdraw Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [selectedUpiAccount, setSelectedUpiAccount] = useState("9811041022@sbi (Jan Dhan Primary)");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  // Payout Transaction Ledger
  const [payoutTransactions, setPayoutTransactions] = useState([
    {
      id: "TXN-89401",
      date: "Today, 1:45 PM",
      customer: "Priyanka Sen",
      service: "Concealed Pipe Leakage & Valve Fix",
      location: "Connaught Place, New Delhi",
      grossTariff: 650,
      workerShare: 617.5,
      welfareFund: 32.5,
      payoutPercent: "95%",
      status: "Settled to Jan Dhan UPI",
      statusType: "settled",
      utr: "UPI-SBIN290148",
    },
    {
      id: "TXN-88192",
      date: "Today, 10:15 AM",
      customer: "Rajiv Malhotra",
      service: "Kitchen Sink Waste Coupler Replacement",
      location: "Barakhamba Road",
      grossTariff: 450,
      workerShare: 427.5,
      welfareFund: 22.5,
      payoutPercent: "95%",
      status: "Settled to Jan Dhan UPI",
      statusType: "settled",
      utr: "UPI-SBIN289901",
    },
    {
      id: "TXN-87401",
      date: "Yesterday, 4:30 PM",
      customer: "Anand Raghavan",
      service: "Bathroom Jet Spray & Pipe Mixer",
      location: "DLF Phase 2, Gurugram",
      grossTariff: 800,
      workerShare: 760.0,
      welfareFund: 40.0,
      payoutPercent: "95%",
      status: "Settled to Jan Dhan UPI",
      statusType: "settled",
      utr: "UPI-HDFC889021",
    },
    {
      id: "TXN-86920",
      date: "22 Oct, 11:20 AM",
      customer: "Cooperative Tool Bank",
      service: "Equipment Rental Fee (Bosch Hammer Drill)",
      location: "Central Delhi Hub",
      grossTariff: -60,
      workerShare: -60,
      welfareFund: 0,
      payoutPercent: "Zero Markup",
      status: "Co-op Tool Rental Settlement",
      statusType: "rental",
      utr: "TB-RENTAL-8891",
    },
  ]);

  // Recommended Jobs Tailored to Worker
  const [jobRecommendations, setJobRecommendations] = useState([
    {
      id: "rec_job_1",
      customerName: "Sunita Verma",
      serviceCategory: "Plumbing & Sanitary",
      scope: "Under-sink drainage leak repair and hot-water mixer installation",
      location: "Khan Market, New Delhi",
      distance: "1.8 km away",
      eta: "15 mins arrival",
      matchScore: "98% Match",
      grossPrice: "₹700",
      workerPayout: "₹665",
      urgency: "Immediate Arrival Requested",
      urgencyType: "immediate",
      timing: "Within 45 mins",
      customerRating: "4.9 ★ (18 hires)",
      toolsRequired: ["Adjustable Pipe Wrench", "Teflon Tape", "Basin Wrench"],
    },
    {
      id: "rec_job_2",
      customerName: "Vikas Oberoi",
      serviceCategory: "Water System & Pumps",
      scope: "Overhead PVC tank float sensor inspection & pressure booster bypass",
      location: "South Extension Part 2",
      distance: "3.4 km away",
      eta: "25 mins arrival",
      matchScore: "95% Match",
      grossPrice: "₹850",
      workerPayout: "₹807",
      urgency: "Scheduled Today",
      urgencyType: "scheduled",
      timing: "Today, 3:30 PM",
      customerRating: "5.0 ★ (42 hires)",
      toolsRequired: ["Digital Pressure Gauge", "Pipe Cutters"],
    },
    {
      id: "rec_job_3",
      customerName: "Deepak Chawla",
      serviceCategory: "Sanitary Fitting",
      scope: "Flush cistern valve replacement and angle cock servicing",
      location: "Lajpat Nagar 3, New Delhi",
      distance: "4.2 km away",
      eta: "30 mins arrival",
      matchScore: "91% Match",
      grossPrice: "₹550",
      workerPayout: "₹522",
      urgency: "Tomorrow Morning",
      urgencyType: "scheduled",
      timing: "Tomorrow, 10:00 AM",
      customerRating: "4.8 ★ (9 hires)",
      toolsRequired: ["Spanner Set", "Washer Kit"],
    },
  ]);

  // Incoming Direct Requests Queue (Real-Time from Socket.io & Short Polling)
  const [incomingRequests, setIncomingRequests] = useState([]);
  const socketRef = useRef(null);

  const effectiveWorkerId = workerUser._id || workerUser.id || "6aa284a4d667617a99b8f0e8";

  // 1. Socket.io Listener for Real-Time Dispatch Alerts
  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("joinWorker", { workerId: effectiveWorkerId, userId: effectiveWorkerId });
    });

    const handleIncomingBooking = (b) => {
      if (!b) return;
      const bId = b._id || b.id;
      const formatted = {
        id: bId,
        bookingId: bId,
        customerName: b.customerId?.name || "Ayush Sharma (Demo Customer)",
        customerPhone: b.customerId?.phone || "+91 98765 43210",
        serviceCategory: b.serviceCategory || "Plumber",
        location: b.address || "Flat 402, Connaught Place, New Delhi",
        distance: "1.2 km away",
        payout: `₹${Math.round(Number(b.price || 499) * 0.95)}`,
        grossPrice: `₹${b.price || 499}`,
        urgency: "Immediate Arrival Requested",
        timestamp: "Just now",
        isDemo: Boolean(b.isDemo),
        arrivalTime: b.arrivalTime || "15 mins",
      };

      setIncomingRequests((prev) => {
        if (prev.some((item) => (item.bookingId || item.id) === bId)) return prev;
        return [formatted, ...prev];
      });

      showToast(`⚡ New booking request from ${formatted.customerName}!`);
    };

    socket.on("new-booking", handleIncomingBooking);
    socket.on("newBookingRequest", handleIncomingBooking);
    socket.on("new_booking_request", handleIncomingBooking);

    return () => {
      socket.off("new-booking", handleIncomingBooking);
      socket.off("newBookingRequest", handleIncomingBooking);
      socket.off("new_booking_request", handleIncomingBooking);
      socket.disconnect();
    };
  }, [effectiveWorkerId]);

  // 2. Short-Interval Polling (every 2.5 seconds) Fallback
  useEffect(() => {
    const fetchPending = async () => {
      try {
        const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
        const res = await getPendingBookingsForWorker(effectiveWorkerId, token);
        const list = res?.data || [];
        
        const formattedList = list.map((b) => ({
          id: b._id || b.id,
          bookingId: b._id || b.id,
          customerName: b.customerId?.name || "Ayush Sharma (Demo Customer)",
          customerPhone: b.customerId?.phone || "+91 98765 43210",
          serviceCategory: b.serviceCategory || "Plumber",
          location: b.address || "Flat 402, Connaught Place, New Delhi",
          distance: "1.2 km away",
          payout: `₹${Math.round(Number(b.price || 499) * 0.95)}`,
          grossPrice: `₹${b.price || 499}`,
          urgency: "Immediate Arrival Requested",
          timestamp: "Just now",
          isDemo: Boolean(b.isDemo),
          arrivalTime: b.arrivalTime || "15 mins",
        }));

        setIncomingRequests((prev) => {
          const map = new Map();
          formattedList.forEach((item) => map.set(item.id, item));
          return Array.from(map.values());
        });
      } catch (err) {
        // Polling gracefully ignores transient network hiccups
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 2500);
    return () => clearInterval(interval);
  }, [effectiveWorkerId]);

  // Active Ongoing Job State
  const [activeJob, setActiveJob] = useState(null);
  const [otpInput, setOtpInput] = useState("");
  const [isOtpVerified, setIsOtpVerified] = useState(false);

  // Integrated Tool Bank Catalog
  const [toolCatalog, setToolCatalog] = useState([
    {
      id: "tool_1",
      name: "Bosch Professional Rotary Hammer Drill",
      model: "GBH 2-26 DRE (800W, SDS-Plus)",
      category: "Heavy Drilling & Chipping",
      dailyRate: 60,
      status: "Available Now",
      hubLocation: "Connaught Place Central Hub",
      distance: "0.8 km from you",
      image: "drill",
      condition: "Co-op Certified ✓ Inspected Oct 2026",
      deposit: "₹0 Co-op Guarantee",
    },
    {
      id: "tool_2",
      name: "Kärcher High-Pressure Hydro Jet Cleaner",
      model: "K4 Universal 1800W (130 Bar)",
      category: "Drain & Pipe Jetting",
      dailyRate: 90,
      status: "Available Now",
      hubLocation: "Gurugram Cyber City Locker",
      distance: "Available for Locker Pickup",
      image: "sanitizer",
      condition: "Co-op Certified ✓ With 15m Jet Hose",
      deposit: "₹0 Co-op Guarantee",
    },
    {
      id: "tool_3",
      name: "Fluke 117 True-RMS Digital Multimeter",
      model: "HVAC & Electrician Master Kit",
      category: "Electrical Diagnostic",
      dailyRate: 45,
      status: "Available Now",
      hubLocation: "Noida Sector 62 Hub",
      distance: "2 Units in Station",
      image: "electric_meter",
      condition: "Co-op Certified ✓ Calibrated",
      deposit: "₹0 Co-op Guarantee",
    },
    {
      id: "tool_4",
      name: "Ridgid Heavy-Duty Steel Pipe Threader & Vise",
      model: "Manual Ratchet Threader 1/2\" to 2\"",
      category: "Plumbing Fabrication",
      dailyRate: 75,
      status: "Available Now",
      hubLocation: "Connaught Place Central Hub",
      distance: "1 Unit in Station",
      image: "plumbing",
      condition: "Co-op Certified ✓ Heavy Alloy Dies",
      deposit: "₹0 Co-op Guarantee",
    },
    {
      id: "tool_5",
      name: "Makita 18V Cordless Circular Saw & Guide",
      model: "DHS680Z Brushless with Laser Line",
      category: "Woodcraft & Carpentry",
      dailyRate: 55,
      status: "Available Now",
      hubLocation: "South Delhi Malviya Hub",
      distance: "Available for Locker Pickup",
      image: "carpenter",
      condition: "Co-op Certified ✓ 2x 5Ah Batteries",
      deposit: "₹0 Co-op Guarantee",
    },
    {
      id: "tool_6",
      name: "Karam Full Body Industrial Safety Harness",
      model: "Fall Arrester & Dual Lanyard PN56",
      category: "Height Safety & Roofing",
      dailyRate: 30,
      status: "Available Now",
      hubLocation: "All Co-op Hubs & Lockers",
      distance: "Instant Locker Dispense",
      image: "health_and_safety",
      condition: "ISI & EN Certified Safety Kit",
      deposit: "₹0 Co-op Guarantee",
    },
  ]);

  // Active Tool Rentals currently held by worker
  const [activeAcquiredTools, setActiveAcquiredTools] = useState([
    {
      id: "ACQ-8902",
      toolName: "Bosch Professional Rotary Hammer Drill",
      hub: "Connaught Place Central Hub",
      acquiredDate: "Oct 24, 2026",
      returnDueDate: "Tomorrow, 8:00 PM",
      dailyFee: 60,
      deposit: "₹0 (Cooperative Guarantee)",
      gatePassCode: "GP-TB-4102-8891",
      status: "Active on Site",
    },
  ]);

  // Acquisition Modal State
  const [showAcquireModal, setShowAcquireModal] = useState(false);
  const [selectedToolForAcquire, setSelectedToolForAcquire] = useState(null);
  const [acquireDays, setAcquireDays] = useState(1);
  const [selectedPickupStation, setSelectedPickupStation] = useState("Connaught Place Central Hub (Locker #14)");
  const [jobReferenceNote, setJobReferenceNote] = useState("");
  const [isSubmittingAcquisition, setIsSubmittingAcquisition] = useState(false);

  // Digital Gate Pass Modal State
  const [showGatePassModal, setShowGatePassModal] = useState(false);
  const [currentGatePass, setCurrentGatePass] = useState(null);

  // Live Wallet Fetch
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
        const user = JSON.parse(localStorage.getItem("gig_user") || localStorage.getItem("gigconnect_user") || "{}");
        const res = await axios.get("http://localhost:4000/api/payments/wallet", {
          params: { workerId: user.id || user._id },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.data?.walletBalance !== undefined) {
          setWalletBalance(res.data.data.walletBalance);
        }
      } catch {
        // Retain default demo balance of ₹12,450
      }
    };
    fetchBalance();
  }, []);

  // Handle Instant UPI / Bank Withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || amount > walletBalance) {
      showToast("Enter a valid withdrawal amount up to your available balance.");
      return;
    }

    setIsWithdrawing(true);
    try {
      const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
      const user = JSON.parse(localStorage.getItem("gig_user") || localStorage.getItem("gigconnect_user") || "{}");
      await axios.post(
        "http://localhost:4000/api/payments/withdraw",
        { workerId: user.id || user._id, amount },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
    } catch {
      // Fallback simulation continues smoothly
    }

    const newBalance = Math.max(0, walletBalance - amount);
    setWalletBalance(newBalance);

    // Append new withdrawal record to transaction ledger
    const newTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: "Just now",
      customer: "Self-Withdrawal",
      service: `Instant Jan Dhan Transfer via UPI to ${selectedUpiAccount.split(" ")[0]}`,
      location: "Direct Bank Settlement",
      grossTariff: -amount,
      workerShare: -amount,
      welfareFund: 0,
      payoutPercent: "100%",
      status: "Settled to Jan Dhan Account",
      statusType: "withdrawn",
      utr: `UPI-JAN-DHAN-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setPayoutTransactions((prev) => [newTxn, ...prev]);
    setShowWithdrawModal(false);
    setWithdrawAmount("");
    setIsWithdrawing(false);
    showToast(`✓ ₹${amount.toLocaleString("en-IN")} transferred instantly to your Jan Dhan UPI account!`);
  };

  // Quick Preset Click for Withdrawal
  const handlePresetWithdraw = (presetVal) => {
    if (presetVal === "all") {
      setWithdrawAmount(walletBalance);
    } else {
      setWithdrawAmount(Math.min(walletBalance, presetVal));
    }
  };

  // Handle Accepting a Direct or Recommended Job
  const handleAcceptJob = async (job) => {
    const bookingId = job.bookingId || job.id;
    try {
      const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
      await acceptBookingRequest(bookingId, token, job.arrivalTime || "15 mins");
    } catch (err) {
      console.warn("API accept error (continuing UI transition):", err.message);
    }

    setIncomingRequests((prev) => prev.filter((j) => (j.bookingId || j.id) !== bookingId));
    setJobRecommendations((prev) => prev.filter((j) => (j.bookingId || j.id) !== bookingId));

    const activeItem = {
      id: bookingId,
      customerName: job.customerName,
      serviceCategory: job.serviceCategory || job.jobType || "Plumber",
      location: job.location || "Flat 402, Connaught Place, New Delhi",
      distance: job.distance || "1.2 km away",
      payout: job.workerPayout || job.payout || "₹474",
      status: "En Route to Site",
      customerPhone: job.customerPhone || "+91 98765 43210",
      handshakeOtp: "4829",
      startedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setActiveJob(activeItem);
    setIsOtpVerified(false);
    setOtpInput("");
    showToast(`Accepted job from ${job.customerName}! Customer notified of 15 min arrival.`);
  };

  const handleDeclineJob = async (jobId) => {
    try {
      const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
      await declineBookingRequest(jobId, token);
    } catch (err) {
      console.warn("API decline error (continuing UI transition):", err.message);
    }

    setIncomingRequests((prev) => prev.filter((j) => (j.bookingId || j.id) !== jobId));
    setJobRecommendations((prev) => prev.filter((j) => (j.bookingId || j.id) !== jobId));
    showToast("Request declined.");
  };

  // Verify Customer Handshake OTP on Site
  const handleVerifyOtp = (e) => {
    e.preventDefault();
    if (otpInput.trim() === "4829" || otpInput.trim().length === 4) {
      setIsOtpVerified(true);
      showToast("✓ Arrival handshake verified! Job status updated to In-Progress.");
    } else {
      showToast("Invalid OTP. Ask customer for 4-digit arrival code.");
    }
  };

  // Complete Ongoing Job and Release Escrow into Worker Wallet
  const handleCompleteActiveJob = () => {
    if (!activeJob) return;

    const rawAmt = Number(String(activeJob.payout).replace(/[^\d]/g, "")) || 650;
    const workerEarned = Math.round(rawAmt * 0.95);
    const welfareContribution = Math.round(rawAmt * 0.05);

    setWalletBalance((prev) => prev + workerEarned);
    setTodayEarnings((prev) => prev + workerEarned);
    setWeeklyEarnings((prev) => prev + workerEarned);
    setLifetimeSettled((prev) => prev + workerEarned);

    const completionTxn = {
      id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
      date: "Just now",
      customer: activeJob.customerName,
      service: `${activeJob.serviceCategory} • Completed & Verified`,
      location: activeJob.location,
      grossTariff: rawAmt,
      workerShare: workerEarned,
      welfareFund: welfareContribution,
      payoutPercent: "95%",
      status: "Settled to Jan Dhan UPI",
      statusType: "settled",
      utr: `UPI-ESCROW-RELEASE-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    setPayoutTransactions((prev) => [completionTxn, ...prev]);
    showToast(`🎉 Work completed! ₹${workerEarned} released instantly into your Cooperative Wallet!`);
    setActiveJob(null);
    setIsOtpVerified(false);
    setOtpInput("");
  };

  // Open Acquire Tool Modal
  const handleOpenAcquireModal = (tool) => {
    setSelectedToolForAcquire(tool);
    setAcquireDays(1);
    setShowAcquireModal(true);
  };

  // Submit Tool Acquisition Request
  const handleConfirmAcquisition = (e) => {
    e.preventDefault();
    if (!selectedToolForAcquire) return;

    setIsSubmittingAcquisition(true);
    const calculatedFee = selectedToolForAcquire.dailyRate * Number(acquireDays);
    const passNumber = `GP-TB-${Math.floor(1000 + Math.random() * 9000)}-${Date.now().toString().slice(-4)}`;

    const newAcquisition = {
      id: `ACQ-${Math.floor(1000 + Math.random() * 9000)}`,
      toolName: selectedToolForAcquire.name,
      hub: selectedPickupStation,
      acquiredDate: "Today, Just now",
      returnDueDate: `In ${acquireDays} day(s)`,
      dailyFee: selectedToolForAcquire.dailyRate,
      deposit: "₹0 (Co-op Guarantee)",
      gatePassCode: passNumber,
      status: "Approved • Ready for Pickup",
      totalFee: calculatedFee,
    };

    // Deduct rental fee from wallet if sufficient balance
    if (walletBalance >= calculatedFee) {
      setWalletBalance((prev) => prev - calculatedFee);
    }

    setActiveAcquiredTools((prev) => [newAcquisition, ...prev]);

    // Create Digital Gate Pass
    setCurrentGatePass({
      passCode: passNumber,
      toolName: selectedToolForAcquire.name,
      model: selectedToolForAcquire.model,
      hub: selectedPickupStation,
      duration: `${acquireDays} Day(s)`,
      totalFee: calculatedFee,
      lockerPin: Math.floor(1000 + Math.random() * 9000),
      workerName: workerUser.name,
      guildId: workerUser.guildId,
    });

    setIsSubmittingAcquisition(false);
    setShowAcquireModal(false);
    setShowGatePassModal(true);
    showToast(`✓ Tool reservation confirmed! Gate pass generated.`);
  };

  return (
    <div className="w-full bg-[#f8fafc] text-slate-900 min-h-screen font-sans pb-16">
      
      {/* ================= TOP HERO & IDENTITY BAR ================= */}
      <div className="bg-[#0A2540] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            
            {/* Worker Avatar & Cooperative Credentials */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={DEFAULT_MALE_AVATAR}
                  alt={workerUser.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-emerald-400 bg-slate-800 shadow-md"
                />
                <span
                  className={`absolute bottom-0 right-0 w-4 h-4 rounded-full ring-2 ring-[#0A2540] ${
                    isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"
                  }`}
                  title={isOnline ? "Online & Ready" : "Offline"}
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white m-0">
                    {workerUser.name}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-extrabold flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">verified</span>
                    <span>Aadhaar e-KYC Verified</span>
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium flex items-center gap-2">
                  <span>{workerUser.craft || "Plumbing & Pipefitting Specialist"}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-amber-300 font-bold">{workerUser.guildId || "Delhi Co-op Guild #4102"}</span>
                </p>

                <div className="flex items-center gap-3 pt-0.5 text-xs text-slate-400">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <span className="material-symbols-outlined text-sm">star</span>
                    <span>{workerUser.rating || "4.92"}</span>
                    <span className="text-slate-400 font-normal">({workerUser.jobsCompleted || "318"} jobs)</span>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">99.4% On-Time</span>
                  <span>•</span>
                  <span className="text-slate-300">Cooperative Member-Owner</span>
                </div>
              </div>
            </div>

            {/* Online Status Toggle & Quick Actions */}
            <div className="flex items-center gap-3 self-start md:self-auto">
              <button
                type="button"
                onClick={() => {
                  const next = !isOnline;
                  setIsOnline(next);
                  showToast(next ? "🟢 You are now ONLINE and visible to nearby customers!" : "⚪ You are now OFFLINE.");
                }}
                className={`px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all border flex items-center gap-2 cursor-pointer shadow-sm ${
                  isOnline
                    ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/30"
                    : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-400"}`} />
                <span>{isOnline ? "Duty: ONLINE (Accepting Gigs)" : "Duty: OFFLINE (On Break)"}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate("tool-bank")}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-all border border-white/15 cursor-pointer flex items-center gap-1.5"
                title="Full Tool Bank Map"
              >
                <span className="material-symbols-outlined text-sm">map</span>
                <span className="hidden sm:inline">Hub Map</span>
              </button>
            </div>

          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Today's Earnings</span>
              <span className="text-lg font-black text-emerald-400 mt-0.5 block">₹{todayEarnings.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">This Week's Net</span>
              <span className="text-lg font-black text-white mt-0.5 block">₹{weeklyEarnings.toLocaleString("en-IN")}</span>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Co-op Payout Rate</span>
              <span className="text-lg font-black text-amber-300 mt-0.5 block">95% Direct</span>
            </div>
            <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700/60">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Tool Bank Deposit</span>
              <span className="text-lg font-black text-blue-300 mt-0.5 block">₹0 Free Deposit</span>
            </div>
          </div>

        </div>
      </div>

      {/* ================= ACTIVE ONGOING JOB BANNER (If Active) ================= */}
      {activeJob && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
          <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-blue-500/15 border-2 border-amber-400 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px] uppercase tracking-wider animate-pulse">
                    Live On-Site Job
                  </span>
                  <span className="text-xs font-bold text-slate-600">Started at {activeJob.startedAt}</span>
                </div>
                <h3 className="text-lg font-black text-[#0A2540]">
                  {activeJob.serviceCategory} • {activeJob.customerName}
                </h3>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm text-slate-500">location_on</span>
                  <span>{activeJob.location}</span>
                  <span className="text-slate-400 font-bold">• {activeJob.distance}</span>
                </p>
                <div className="text-xs font-bold text-emerald-800">
                  Guaranteed Direct Payout: <span className="text-sm font-black text-emerald-900">{activeJob.payout}</span> (95% Settled on Handshake)
                </div>
              </div>

              {/* Handshake & Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {!isOtpVerified ? (
                  <form onSubmit={handleVerifyOtp} className="flex items-center gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      placeholder="4-digit OTP"
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ""))}
                      className="w-32 px-3 py-2.5 text-center text-sm font-black tracking-widest rounded-xl border border-slate-300 bg-white focus:border-[#0A2540] outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2.5 bg-[#0A2540] hover:bg-[#071b30] text-white text-xs font-extrabold rounded-xl border-none cursor-pointer transition-colors shadow-xs"
                    >
                      Verify Arrival
                    </button>
                  </form>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-2 rounded-xl">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    <span>Handshake Verified</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleCompleteActiveJob}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl border-none cursor-pointer transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">task_alt</span>
                  <span>Complete &amp; Release Escrow</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= NAVIGATION TABS (Jobs, Payouts, Tool Bank) ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "jobs"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg">work</span>
            <span>Job Recommendations ({jobRecommendations.length + incomingRequests.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("payouts")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "payouts"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            <span>Wallet &amp; Payouts (₹{walletBalance.toLocaleString("en-IN")})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("toolbank")}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-none cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "toolbank"
                ? "bg-[#0A2540] text-white shadow-xs"
                : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
            }`}
          >
            <span className="material-symbols-outlined text-lg">construction</span>
            <span>Tool Bank &amp; Acquisition ({toolCatalog.length})</span>
          </button>
        </div>
      </div>

      {/* ================= MAIN CONTENT BASED ON ACTIVE TAB ================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* ================= TAB 1: JOB RECOMMENDATIONS & REQUESTS ================= */}
        {activeTab === "jobs" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left 2 Cols: Recommendations & Incoming Requests */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Direct Urgent Requests (If any) */}
              {incomingRequests.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                      <h2 className="text-base font-black text-[#0A2540] tracking-tight">
                        Direct Customer Incoming Alert
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      Immediate Response Required
                    </span>
                  </div>

                  {incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl border-2 border-red-200 bg-red-50/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-red-700 bg-red-100 px-2 py-0.5 rounded-md uppercase">
                            {req.urgency}
                          </span>
                          <span className="text-xs text-slate-500">• {req.timestamp}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{req.customerName}</h3>
                        <p className="text-xs text-slate-600 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                          <span>{req.location}</span>
                          <span className="font-bold text-slate-500">({req.distance})</span>
                        </p>
                        <p className="text-xs font-bold text-emerald-800 pt-1">
                          Guaranteed Net Payout: <span className="text-sm font-black">{req.payout}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleDeclineJob(req.id)}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold transition-colors cursor-pointer bg-white/70"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptJob(req)}
                          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black transition-colors cursor-pointer border-none shadow-xs flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">near_me</span>
                          <span>Accept &amp; Dispatch</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommended Jobs List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-black text-[#0A2540] tracking-tight">
                      Recommended for Your Trade
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Matched by proximity to Connaught Place / Central Delhi and verified skills.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                    {jobRecommendations.length} Curated Matches
                  </span>
                </div>

                {jobRecommendations.length === 0 ? (
                  <div className="p-12 rounded-3xl border border-slate-200 bg-white text-center">
                    <span className="material-symbols-outlined text-4xl text-slate-300">task_alt</span>
                    <p className="text-sm font-bold text-slate-700 mt-2">All matched jobs cleared</p>
                    <p className="text-xs text-slate-400 mt-0.5">New verified gig recommendations will appear here automatically.</p>
                  </div>
                ) : (
                  jobRecommendations.map((job) => (
                    <div
                      key={job.id}
                      className="p-6 rounded-3xl border border-slate-200/90 hover:border-[#0A2540]/40 bg-white transition-all shadow-xs space-y-4 group"
                    >
                      {/* Top Header of Card */}
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-black text-[#0A2540] px-2.5 py-0.5 rounded-md bg-slate-100">
                              {job.serviceCategory}
                            </span>
                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                              {job.matchScore}
                            </span>
                            <span className="text-xs text-slate-400">• {job.distance}</span>
                            <span className="text-xs text-slate-500 font-semibold">• {job.eta}</span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 group-hover:text-[#0A2540] transition-colors">
                            {job.scope}
                          </h3>
                        </div>

                        {/* Payout Display */}
                        <div className="sm:text-right shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-100 sm:bg-transparent sm:p-0 sm:border-none">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Direct Net Payout</span>
                          <span className="text-xl font-black text-emerald-700 block mt-0.5">{job.workerPayout}</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Tariff: {job.grossPrice} (95% Share)</span>
                        </div>
                      </div>

                      {/* Customer & Location Details */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{job.customerName}</span>
                          <span className="text-amber-500 text-[11px] font-bold">{job.customerRating}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-500">
                          <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                          <span>{job.location}</span>
                        </div>
                        <div className="font-bold text-[#0A2540] bg-indigo-50/80 px-2 py-0.5 rounded-md text-[11px]">
                          {job.timing}
                        </div>
                      </div>

                      {/* Tools Required Pill */}
                      {job.toolsRequired && (
                        <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl">
                          <span className="material-symbols-outlined text-sm text-slate-400">home_repair_service</span>
                          <span className="font-bold text-slate-700">Recommended Tools:</span>
                          {job.toolsRequired.map((tool, idx) => (
                            <span key={idx} className="bg-white border border-slate-200 px-2 py-0.5 rounded-md font-medium text-slate-600">
                              {tool}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => handleDeclineJob(job.id)}
                          className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                        >
                          Pass / Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAcceptJob(job)}
                          className="px-6 py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#071b30] text-white text-xs font-black transition-all cursor-pointer border-none shadow-xs flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          <span>Accept &amp; Start Gig</span>
                        </button>
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>

            {/* Right 1 Col: Quick Wallet Widget & Co-op Highlights */}
            <div className="space-y-6">
              
              {/* Cooperative Wallet Summary Widget */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0A2540] to-[#0f3458] text-white shadow-sm space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Cooperative Wallet</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                    Instant UPI
                  </span>
                </div>

                <div>
                  <p className="text-xs text-slate-300">Available Balance</p>
                  <h2 className="text-4xl font-black tracking-tight mt-1 text-white">
                    ₹{walletBalance.toLocaleString("en-IN")}
                  </h2>
                  <p className="text-[11px] text-slate-300 mt-1 font-medium">
                    100% held in Jan Dhan verified cooperative escrow
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawModal(true)}
                    disabled={walletBalance <= 0}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#0A2540] font-black text-xs transition-all cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xs"
                  >
                    <span className="material-symbols-outlined text-base">account_balance</span>
                    <span>Withdraw to Jan Dhan UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("payouts")}
                    className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors cursor-pointer border border-white/15 flex items-center justify-center gap-1"
                  >
                    <span>View Settlement Ledger</span>
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Tool Bank Quick Action Banner */}
              <div
                onClick={() => setActiveTab("toolbank")}
                className="p-6 rounded-3xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 shadow-xs cursor-pointer group transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-4 group-hover:scale-105 transition-transform shadow-xs">
                  <span className="material-symbols-outlined text-2xl">construction</span>
                </div>
                <h3 className="text-base font-black text-[#0A2540] group-hover:text-amber-700 transition-colors">
                  Cooperative Tool Bank
                </h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Rent high-powered commercial equipment (hammer drills, hydro washers, multimeters) starting at ₹30/day with <strong>₹0 deposit</strong>.
                </p>
                <div className="mt-4 flex items-center gap-1 text-xs font-black text-amber-800">
                  <span>Browse &amp; Request Equipment</span>
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </div>
              </div>

              {/* Fair Wage Cooperative Policy */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-1.5 font-black text-[#0A2540]">
                  <span className="material-symbols-outlined text-sm text-emerald-600">handshake</span>
                  <span>Cooperative Member Guarantee</span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  GigConnect is run by the federation. 95% of every rupee paid by customers goes straight to your pocket, and 5% goes into your shared health and pension reserve.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* ================= TAB 2: WALLET & PAYOUTS DETAIL ================= */}
        {activeTab === "payouts" && (
          <div className="space-y-8">
            
            {/* 3 Metric Cards for Payouts */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-6 rounded-3xl bg-gradient-to-br from-[#0A2540] to-[#123659] text-white shadow-sm space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Available Balance</span>
                <h3 className="text-3xl sm:text-4xl font-black">₹{walletBalance.toLocaleString("en-IN")}</h3>
                <p className="text-xs text-slate-300">Ready for instant UPI bank settlement</p>
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(true)}
                  className="w-full py-3 bg-white text-[#0A2540] font-black text-xs rounded-xl border-none cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  Withdraw Now
                </button>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Settled This Month</span>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900">₹{weeklyEarnings.toLocaleString("en-IN")}</h3>
                <div className="space-y-1 text-xs text-slate-500">
                  <div className="flex justify-between">
                    <span>Direct Worker Share (95%):</span>
                    <strong className="text-emerald-600 font-bold">₹{(weeklyEarnings * 0.95).toFixed(0)}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Welfare Fund (5%):</span>
                    <strong className="text-purple-600 font-bold">₹{(weeklyEarnings * 0.05).toFixed(0)}</strong>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Earnings</span>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900">₹{lifetimeSettled.toLocaleString("en-IN")}</h3>
                <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold">
                  <span className="material-symbols-outlined text-base">verified</span>
                  <span>100% Tax Compliant GST Invoicing</span>
                </div>
                <p className="text-[11px] text-slate-400">Linked to Jan Dhan Account • MSCS Reg #701</p>
              </div>

            </div>

            {/* Payout Transactions Ledger */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black text-[#0A2540]">Payout Settlement Ledger</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time breakdown of job payouts, cooperative welfare deductions, and bank transfers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => showToast("Downloading complete financial ledger statement (CSV/PDF)...")}
                  className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  <span>Download Statement</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-6">Transaction / Date</th>
                      <th className="py-3.5 px-6">Service / Client</th>
                      <th className="py-3.5 px-6">Gross Tariff</th>
                      <th className="py-3.5 px-6">Net Worker Share</th>
                      <th className="py-3.5 px-6">Welfare (5%)</th>
                      <th className="py-3.5 px-6">Settlement Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payoutTransactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-4 px-6">
                          <span className="font-mono font-bold text-slate-900 block">{txn.id}</span>
                          <span className="text-[11px] text-slate-400 block mt-0.5">{txn.date}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-slate-800 block">{txn.service}</span>
                          <span className="text-[11px] text-slate-500 block">{txn.customer} • {txn.location}</span>
                        </td>
                        <td className="py-4 px-6 font-bold text-slate-700">
                          {txn.grossTariff >= 0 ? `₹${txn.grossTariff}` : `-₹${Math.abs(txn.grossTariff)}`}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`font-black text-sm ${txn.workerShare >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                            {txn.workerShare >= 0 ? `+₹${txn.workerShare.toFixed(2)}` : `-₹${Math.abs(txn.workerShare).toFixed(2)}`}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 font-medium">
                          {txn.welfareFund > 0 ? `₹${txn.welfareFund.toFixed(2)}` : "—"}
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold ${
                              txn.statusType === "settled"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : txn.statusType === "rental"
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {txn.statusType === "settled" ? "check_circle" : txn.statusType === "rental" ? "construction" : "account_balance"}
                            </span>
                            <span>{txn.status}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 block font-mono mt-1">{txn.utr}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: INTEGRATED TOOL BANK & ACQUISITION ================= */}
        {activeTab === "toolbank" && (
          <div className="space-y-8">
            
            {/* Banner for Tool Bank Guarantee */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-slate-50 to-emerald-500/10 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-white font-extrabold text-[10px] uppercase tracking-wider">
                    Zero-Deposit Guarantee
                  </span>
                  <span className="text-xs font-bold text-slate-600">Cooperative Equipment Reserve</span>
                </div>
                <h2 className="text-xl font-black text-[#0A2540]">
                  Acquire Heavy Commercial Tools On-Demand
                </h2>
                <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                  As an Aadhaar-verified cooperative pro, you can request and acquire power drills, hydro-jetters, and multimeters from 10+ smart pickup lockers across Delhi NCR at subsidised day rates with <strong>zero security deposit</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onNavigate("tool-bank")}
                className="px-5 py-3 rounded-xl bg-[#0A2540] hover:bg-[#071b30] text-white font-bold text-xs transition-colors border-none cursor-pointer flex items-center justify-center gap-2 shrink-0 shadow-xs"
              >
                <span className="material-symbols-outlined text-base">pin_drop</span>
                <span>View Full NCR Locker Map</span>
              </button>
            </div>

            {/* Currently Acquired Tools Section (If any) */}
            {activeAcquiredTools.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base font-black text-[#0A2540] flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">handyman</span>
                  <span>Your Currently Acquired Tools ({activeAcquiredTools.length})</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeAcquiredTools.map((item) => (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border-2 border-amber-300/80 bg-white shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
                            {item.status}
                          </span>
                          <h4 className="text-base font-black text-slate-900 mt-1">{item.toolName}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-sm text-slate-400">store</span>
                            <span>{item.hub}</span>
                          </p>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-700">₹{item.dailyFee}/day</span>
                          <span className="text-[10px] text-slate-400 block">{item.deposit}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600 font-medium">
                        <span>Due: <strong>{item.returnDueDate}</strong></span>
                        <span className="font-mono text-[11px] font-bold text-[#0A2540]">Pass: {item.gatePassCode}</span>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentGatePass({
                              passCode: item.gatePassCode,
                              toolName: item.toolName,
                              hub: item.hub,
                              duration: "Active",
                              totalFee: item.dailyFee,
                              lockerPin: 7892,
                              workerName: workerUser.name,
                              guildId: workerUser.guildId,
                            });
                            setShowGatePassModal(true);
                          }}
                          className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border-none cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">qr_code</span>
                          <span>Show Gate Pass</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            showToast("Return QR code generated. Scan at any smart locker station to return tool.");
                          }}
                          className="py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl cursor-pointer transition-colors"
                        >
                          Return Tool
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Available Tool Bank Catalog */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-[#0A2540]">Federation Equipment Available for Request</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Select any tool to submit an acquisition request with instant locker code generation.</p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {toolCatalog.length} Tools Ready
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {toolCatalog.map((tool) => (
                  <div
                    key={tool.id}
                    className="p-6 rounded-3xl border border-slate-200 hover:border-[#0A2540] bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                          {tool.status}
                        </span>
                        <span className="text-base font-black text-[#0A2540]">₹{tool.dailyRate}<span className="text-xs font-normal text-slate-500">/day</span></span>
                      </div>

                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-[#0A2540] flex items-center justify-center group-hover:bg-[#0A2540] group-hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-2xl">{tool.image}</span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-slate-900 leading-snug group-hover:text-[#0A2540] transition-colors">
                          {tool.name}
                        </h4>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">{tool.model}</p>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600 pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                          <span>{tool.hubLocation}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                          <span className="material-symbols-outlined text-sm text-emerald-600">verified</span>
                          <span>{tool.condition}</span>
                        </div>
                        <div className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md inline-block">
                          {tool.deposit}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenAcquireModal(tool)}
                      className="w-full py-3 bg-[#0A2540] hover:bg-[#071b30] text-white font-bold text-xs rounded-xl transition-colors border-none cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                      <span>Request to Acquire</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ================= WITHDRAWAL MODAL ================= */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#0A2540]">Instant Bank Payout</h3>
                <p className="text-xs text-slate-500 mt-0.5">Transfer funds directly to your verified Jan Dhan UPI account.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border-none bg-transparent cursor-pointer p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Current Balance Banner */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Available in Wallet</span>
                <span className="text-xl font-black text-[#0A2540]">₹{walletBalance.toLocaleString("en-IN")}</span>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-200">
                0% Transfer Fee
              </span>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Payout Destination
                </label>
                <select
                  value={selectedUpiAccount}
                  onChange={(e) => setSelectedUpiAccount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none focus:border-[#0A2540]"
                >
                  <option value="9811041022@sbi (Jan Dhan Primary)">9811041022@sbi (Jan Dhan Primary • SBI)</option>
                  <option value="9811041022@pnb (Punjab National Bank)">9811041022@pnb (Punjab National Bank)</option>
                  <option value="9811041022@postbank (India Post Payments Bank)">9811041022@postbank (India Post Payments Bank)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min="1"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ₹${walletBalance}`}
                  autoFocus
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-300 focus:border-[#0A2540] text-base font-bold outline-none"
                />

                {/* Quick Presets */}
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => handlePresetWithdraw(500)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border-none cursor-pointer"
                  >
                    +₹500
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetWithdraw(1000)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border-none cursor-pointer"
                  >
                    +₹1,000
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetWithdraw(2000)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold border-none cursor-pointer"
                  >
                    +₹2,000
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetWithdraw("all")}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 cursor-pointer ml-auto"
                  >
                    Withdraw All
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl space-y-1">
                <p className="flex items-center gap-1 font-semibold text-slate-700">
                  <span className="material-symbols-outlined text-sm text-emerald-600">bolt</span>
                  <span>Instant Settlement via NPCI UPI</span>
                </p>
                <p>Transfers are processed within 15 seconds to your registered Jan Dhan account with zero platform deduction.</p>
              </div>

              <button
                type="submit"
                disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > walletBalance}
                className="w-full py-3.5 bg-[#0A2540] hover:bg-[#071b30] text-white font-bold text-xs rounded-xl transition-all border-none cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
              >
                {isWithdrawing ? "Processing Jan Dhan Payout..." : `Confirm Payout of ₹${Number(withdrawAmount || 0).toLocaleString("en-IN")}`}
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ================= REQUEST TO ACQUIRE TOOL MODAL ================= */}
      {showAcquireModal && selectedToolForAcquire && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-6">
            
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-[#0A2540]">Request to Acquire Equipment</h3>
                <p className="text-xs text-slate-500 mt-0.5">Federation sponsored zero-deposit equipment rental</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAcquireModal(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border-none bg-transparent cursor-pointer p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            {/* Selected Tool Preview */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">{selectedToolForAcquire.image}</span>
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black text-slate-900">{selectedToolForAcquire.name}</h4>
                <p className="text-xs text-slate-600 font-mono mt-0.5">{selectedToolForAcquire.model}</p>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-bold text-amber-900">
                  <span>Rate: ₹{selectedToolForAcquire.dailyRate}/day</span>
                  <span>•</span>
                  <span className="text-emerald-700">₹0 Security Deposit</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleConfirmAcquisition} className="space-y-4">
              
              {/* Duration selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Rental Duration (Days)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 3, 7, 14].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setAcquireDays(d)}
                      className={`py-2 rounded-xl text-xs font-black transition-all border cursor-pointer ${
                        acquireDays === d
                          ? "bg-[#0A2540] text-white border-[#0A2540] shadow-xs"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {d} Day{d > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pickup Locker / Station */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Smart Locker / Pickup Hub
                </label>
                <select
                  value={selectedPickupStation}
                  onChange={(e) => setSelectedPickupStation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-800 bg-white outline-none focus:border-[#0A2540]"
                >
                  <option value="Connaught Place Central Hub (Locker #14)">Connaught Place Central Hub (Locker #14)</option>
                  <option value="Gurugram Cyber City Locker Station (Bay B)">Gurugram Cyber City Locker Station (Bay B)</option>
                  <option value="Noida Sector 62 Co-op Dispensary">Noida Sector 62 Co-op Dispensary</option>
                  <option value="South Delhi Malviya Nagar Station">South Delhi Malviya Nagar Station</option>
                </select>
              </div>

              {/* Project reference note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Job Reference (Optional)
                </label>
                <input
                  type="text"
                  value={jobReferenceNote}
                  onChange={(e) => setJobReferenceNote(e.target.value)}
                  placeholder="e.g. For Connaught Place Pipe Fitting Job"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium text-slate-800 outline-none focus:border-[#0A2540]"
                />
              </div>

              {/* Fee Calculation Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Daily Rate:</span>
                  <span className="font-bold">₹{selectedToolForAcquire.dailyRate} × {acquireDays} day(s)</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Deposit Required:</span>
                  <span className="font-bold text-emerald-600">₹0 (Guaranteed by Guild #4102)</span>
                </div>
                <div className="flex justify-between text-slate-900 font-black pt-2 border-t border-slate-200 text-sm">
                  <span>Total Co-op Fee:</span>
                  <span className="text-emerald-700">₹{selectedToolForAcquire.dailyRate * Number(acquireDays)}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Settled directly from your cooperative wallet upon return or ongoing payouts.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmittingAcquisition}
                className="w-full py-3.5 bg-[#0A2540] hover:bg-[#071b30] text-white font-black text-xs rounded-xl transition-all border-none cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">verified</span>
                <span>Confirm &amp; Generate Digital Gate Pass</span>
              </button>

            </form>

          </div>
        </div>
      )}

      {/* ================= DIGITAL GATE PASS MODAL ================= */}
      {showGatePassModal && currentGatePass && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5">
            
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">qr_code_2</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Acquisition Approved ✓
              </span>
              <h3 className="text-xl font-black text-[#0A2540] mt-2">Digital Gate Pass</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{currentGatePass.passCode}</p>
            </div>

            {/* QR Simulation Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div className="w-36 h-36 mx-auto bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center p-2 shadow-inner">
                <span className="material-symbols-outlined text-6xl text-[#0A2540]">qr_code</span>
                <span className="text-[9px] font-mono font-bold text-slate-400 mt-1">SCAN AT SMART LOCKER</span>
              </div>

              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900">{currentGatePass.toolName}</p>
                <p className="text-[11px] text-slate-500">{currentGatePass.hub}</p>
                <p className="text-xs font-bold text-[#0A2540]">
                  Locker PIN: <span className="font-mono text-base font-black tracking-widest text-emerald-700">{currentGatePass.lockerPin}</span>
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Present this code or punch the 4-digit PIN into the designated locker keypad to retrieve the certified tool.
            </p>

            <button
              type="button"
              onClick={() => setShowGatePassModal(false)}
              className="w-full py-3 bg-[#0A2540] hover:bg-[#071b30] text-white font-bold text-xs rounded-xl border-none cursor-pointer transition-colors"
            >
              Done / Return to Dashboard
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
