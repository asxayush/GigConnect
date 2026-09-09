import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import BookingForm from "../BookingTicket/BookingForm";

export default function MyBookings({ onNavigate, selectedWorker }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("upcoming");
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookingModal, setShowBookingModal] = useState(Boolean(selectedWorker));
  const [invoiceToast, setInvoiceToast] = useState("");

  useEffect(() => {
    if (selectedWorker) {
      setShowBookingModal(true);
    }
  }, [selectedWorker]);

  const initialSampleBookings = [
    {
      id: "GC-88421",
      category: "upcoming",
      coopTag: "Sanitation Co-op",
      title: "Full Home Deep Cleaning & Sanitization",
      status: "Confirmed ✓",
      statusType: "confirmed",
      worker: {
        name: "Sunita Devi",
        memberId: "Member #2910",
        rating: "4.96",
        jobs: "420 verified jobs",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuD3Cu21x_foINbb___0CZs4Uz0XOU8pEiCH0n5gZBtPuY1UbTsv-Ncwi3G2_6umXqQ6iRIl9FayYgyV092RxJek2_gB2ujiTNPO8OArodVaP1gEh3ZrLxowFu18y8ghf2MeIZwpRxG1Z4AJFA6exrcxlsFb4z9WYroTXLMDMlm96hMo_rDURoCwmFmdm7DwKm1B6lbWaqQJAofTSY2P_gkwLgUZDF_M5eOyubk3tAbkU1fnkMYMvIQD",
        badges: ["Aadhaar Verified", "ESI Protected"],
      },
      schedule: "Tomorrow, Oct 24",
      time: "10:00 AM – 1:00 PM (3 Hours)",
      address: "Flat 402, DLF Phase 2, Cyber City Corridor, Gurugram, Delhi NCR, 122002",
      price: "₹1,499",
      priceLabel: "Co-op Guaranteed Tariff",
      priceSub: "Fair living wage model",
      hasEscrowBanner: true,
    },
    {
      id: "GC-89014",
      category: "upcoming",
      coopTag: "Plumbing Guild",
      title: "Kitchen Sink Pipe & Tap Replacement",
      status: "Worker Matching",
      statusType: "matching",
      worker: null,
      matchingInfo: {
        title: "Matching Co-op Plumber",
        desc: "Assigning nearest verified plumbing member in Cyber City Corridor, Gurugram.",
        avgTime: "Average match time: 14 mins",
        icon: "plumbing",
      },
      schedule: "Friday, Oct 25",
      time: "03:30 PM – 05:00 PM",
      address: "DLF Phase 2, Cyber City Corridor, Gurugram, Delhi NCR",
      price: "₹349",
      priceLabel: "Base Estimate",
      priceSub: "Parts charged at actual MRP",
      hasEscrowBanner: false,
    },
    {
      id: "GC-81209",
      category: "completed",
      coopTag: "Electrical Cooperative",
      title: "Ceiling Fan Rewiring & Switchboard Repair",
      status: "Completed",
      statusType: "completed",
      worker: {
        name: "Arun V. Nair",
        memberId: "Member #1408",
        rating: "5.0 by you",
        jobs: "Service concluded on Oct 18, 2024",
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDSdTkJDu1RZtr_jCtXLvZx8nPf88RFyHMunFkAxvddGR-1zTkOCpNFcp0iH9SLxqOighcgEIb44HkV3T22NZZUa5wrxQ7_ENxKn7pbV01plvHB3c6xjnqADDEN_4qsvQqi6FdPvZ-vbhy24xNrxt-OzNDGAMw6Jwq0eSc6DFlSTlp8FyvOpDZQwMFNqYWxg3QgtfMGpmUtveyjMwOvSx5PStAGt0Shg-wOEv5rF1s0N7E9-QJ9lTDw",
        badges: ["Aadhaar Verified"],
      },
      schedule: "Executed: Oct 18, 2024 • 11:30 AM",
      time: "Paid ₹450 via UPI • Trans ID #UPI8892019",
      address: "Worker received ₹405 directly (90% payout)",
      price: "₹450",
      priceLabel: "Settled Total",
      priceSub: "Paid • GST Receipt",
      hasEscrowBanner: false,
    },
  ];

  const [bookingsList, setBookingsList] = useState(initialSampleBookings);

  const filteredBookings = bookingsList
    .filter((b) => (activeTab === "all" ? true : b.category === activeTab))
    .filter((b) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        b.id.toLowerCase().includes(q) ||
        b.title.toLowerCase().includes(q) ||
        (b.worker?.name && b.worker.name.toLowerCase().includes(q))
      );
    });

  const handleDownloadInvoice = (id) => {
    setInvoiceToast(`GST Invoice #${id}.pdf downloaded successfully!`);
    setTimeout(() => setInvoiceToast(""), 3000);
  };

  const handleNewBookingCreated = (data) => {
    if (data) {
      const newBookingItem = {
        id: data._id || data.id || `GC-${Math.floor(10000 + Math.random() * 90000)}`,
        category: "upcoming",
        coopTag: "Cooperative Service",
        title: data.serviceCategory || "Domestic Cooperative Service",
        status: "Confirmed ✓",
        statusType: "confirmed",
        worker: {
          name: selectedWorker?.name || "Rameshwar Kumar",
          memberId: selectedWorker?.coopId || "Member #2910",
          rating: selectedWorker?.rating || "4.9",
          jobs: "Verified Co-op Guild Member",
          image: selectedWorker?.avatar || selectedWorker?.image || "/illustrations/plumber.jpg",
          badges: ["Aadhaar Verified", "Co-op Certified"],
        },
        schedule: `Scheduled: ${data.scheduledAt ? new Date(data.scheduledAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Today • Immediate"}`,
        time: "Cooperative Direct Payout • 0% Surge Rate",
        address: data.address || "Delhi-NCR",
        price: `₹${data.price || 249}`,
        priceLabel: "Settled Tariff",
        priceSub: "Escrow & Guarantee Protected",
        hasEscrowBanner: true,
      };
      setBookingsList((prev) => [newBookingItem, ...prev]);
    }
    setShowBookingModal(false);
    setActiveTab("upcoming");
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen">
      <div className="flex flex-col w-full relative">
        {/* Subtle Ambient Corner Grid Geometry */}
        <div className="absolute top-0 right-0 w-96 h-96 pointer-events-none opacity-[0.035] overflow-hidden -z-10 select-none">
          <svg className="w-full h-full text-primary" fill="currentColor" viewBox="0 0 200 200">
            <pattern id="coop-jaali-grid-bookings" patternUnits="userSpaceOnUse" width="20" height="20" x="0" y="0">
              <path d="M 0 10 L 10 0 L 20 10 L 10 20 Z" fill="none" stroke="currentColor" strokeWidth="0.75" />
              <circle cx="10" cy="10" fill="currentColor" r="1.5" />
            </pattern>
            <rect width="200" height="200" fill="url(#coop-jaali-grid-bookings)" />
          </svg>
        </div>

        {invoiceToast && (
          <div className="fixed top-24 right-6 z-50 bg-tertiary-container text-on-tertiary px-space-4 py-space-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold animate-bounce">
            <span className="material-symbols-outlined text-[18px]">download_done</span>
            <span>{invoiceToast}</span>
          </div>
        )}

        <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-8 w-full">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-6 pb-space-8">
            <div className="flex flex-col gap-space-2 max-w-2xl">
              <div className="flex items-center gap-space-2 text-primary font-label-sm text-label-sm uppercase tracking-wider">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary-container" />
                <span>Sahakari Member Portal • Delhi NCR Central Hub</span>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface m-0 font-bold">
                My Bookings &amp; Service History
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant m-0">
                Track your active domestic service requests, scheduled worker visits, and cooperative service receipts.
              </p>
            </div>

            {/* Trust Indicator Capsule & New Booking Action */}
            <div className="flex flex-wrap items-center gap-space-3">
              <div className="flex items-center gap-space-3 bg-surface-container-low px-space-4 py-space-3 rounded-xl border border-border-tone/30">
                <div className="w-10 h-10 rounded-lg bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-[24px]">verified_user</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">Protection Status</span>
                  <span className="font-label-lg text-label-lg text-on-surface font-bold">100% Escrow &amp; Insurance</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                className="px-space-4 py-space-3 bg-secondary-container text-on-secondary font-label-md text-label-md rounded-xl font-bold shadow-md hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                <span>New Booking</span>
              </button>
            </div>
          </div>

          {/* Filter & Tab Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-space-4 pb-space-6">
            <div className="inline-flex p-1.5 bg-surface-container rounded-full shadow-sm">
              <button
                type="button"
                onClick={() => setActiveTab("upcoming")}
                className={`px-space-4 py-space-2 rounded-full font-label-lg text-label-lg transition-all duration-200 border-none cursor-pointer ${activeTab === "upcoming"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface font-medium bg-transparent"
                  }`}
              >
                Upcoming (2)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("completed")}
                className={`px-space-4 py-space-2 rounded-full font-label-lg text-label-lg transition-all duration-200 border-none cursor-pointer ${activeTab === "completed"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface font-medium bg-transparent"
                  }`}
              >
                Past Completed (8)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("cancelled")}
                className={`px-space-4 py-space-2 rounded-full font-label-lg text-label-lg transition-all duration-200 border-none cursor-pointer ${activeTab === "cancelled"
                  ? "bg-primary-container text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface font-medium bg-transparent"
                  }`}
              >
                Cancelled (1)
              </button>
            </div>

            <div className="flex items-center gap-space-3">
              <div className="relative hidden sm:block">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by booking ID or worker..."
                  className="w-64 bg-surface-container-lowest text-on-surface placeholder:text-outline font-body-sm text-body-sm pl-9 pr-3 py-2 rounded-full shadow-sm focus:bg-surface focus:outline-none border border-border-tone/30"
                />
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-outline">
                  search
                </span>
              </div>
              <button
                type="button"
                className="flex items-center gap-space-1.5 px-space-3 py-space-2 bg-surface-container-lowest rounded-full shadow-sm text-on-surface-variant hover:text-on-surface font-label-md text-label-md border border-border-tone/30 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">filter_list</span>
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Bookings Listing Container */}
          <div className="flex flex-col gap-space-6">
            {filteredBookings.length === 0 ? (
              <div className="bg-surface-container-lowest rounded-xl p-space-12 text-center flex flex-col items-center justify-center border border-border-tone/30">
                <span className="material-symbols-outlined text-[48px] text-outline mb-space-3">inbox</span>
                <h3 className="font-title-md text-title-md text-on-surface font-bold">No bookings in this tab</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-sm mt-1">
                  You have no {activeTab} service requests at this time. Book a verified co-op worker whenever you need help.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate("find-help")}
                  className="mt-space-4 px-space-6 py-space-2.5 bg-secondary-container text-on-secondary rounded-xl font-bold text-sm shadow-md hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer"
                >
                  Explore Verified Directory
                </button>
              </div>
            ) : (
              filteredBookings.map((b) => (
                <article
                  key={b.id}
                  className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm flex flex-col gap-space-6 transition-all duration-200 hover:shadow-md border border-border-tone/30"
                >
                  {/* Top Status Row */}
                  <div className="flex flex-wrap items-start justify-between gap-space-4 pb-space-4 bg-surface-container-lowest border-b border-border-tone/20">
                    <div className="flex flex-col gap-space-1">
                      <div className="flex items-center gap-space-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-primary font-label-sm text-label-sm uppercase font-semibold">
                          {b.coopTag}
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">ID: #{b.id}</span>
                      </div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold m-0">{b.title}</h2>
                    </div>

                    <div className="flex items-center gap-space-3">
                      {b.statusType === "confirmed" && (
                        <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 rounded-full bg-surface-container-low text-tertiary-container font-label-sm text-label-sm font-bold shadow-sm">
                          <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
                            check_circle
                          </span>
                          <span>{b.status}</span>
                        </span>
                      )}
                      {b.statusType === "matching" && (
                        <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold shadow-sm animate-pulse">
                          <span className="material-symbols-outlined text-[16px]">sync</span>
                          <span>{b.status}</span>
                        </span>
                      )}
                      {b.statusType === "completed" && (
                        <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm font-semibold">
                          <span className="material-symbols-outlined text-[16px] text-tertiary-container">done_all</span>
                          <span>{b.status}</span>
                        </span>
                      )}
                      <button
                        type="button"
                        className="text-outline hover:text-on-surface p-1 rounded-full hover:bg-surface-container-low transition-colors bg-transparent border-none cursor-pointer"
                        title="Booking options"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    </div>
                  </div>

                  {/* Middle Detail Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-6 bg-surface-container-low p-space-4 rounded-xl">
                    {/* Worker Info / Matching Info (5 cols) */}
                    <div className="lg:col-span-5 flex items-start gap-space-4">
                      {b.worker ? (
                        <>
                          <div className="relative shrink-0">
                            <img
                              className="w-16 h-16 rounded-full object-cover shadow-sm"
                              src={b.worker.image}
                              alt={b.worker.name}
                            />
                            <span
                              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shadow font-bold text-xs"
                              title="Aadhaar Biometric Authenticated"
                            >
                              ✓
                            </span>
                          </div>
                          <div className="flex flex-col gap-space-1">
                            <div className="flex items-center gap-space-2">
                              <span className="font-title-md text-title-md text-on-surface font-bold">
                                {b.worker.name}
                              </span>
                              <span className="font-label-sm text-label-sm text-outline">({b.worker.memberId})</span>
                            </div>
                            <div className="flex items-center gap-space-2 font-label-md text-label-md text-on-surface-variant">
                              <span className="flex items-center gap-1 text-secondary font-bold">
                                <span
                                  className="material-symbols-outlined text-[16px]"
                                  style={{ fontVariationSettings: "'FILL' 1" }}
                                >
                                  star
                                </span>
                                {b.worker.rating}
                              </span>
                              <span className="text-outline">•</span>
                              <span>{b.worker.jobs}</span>
                            </div>
                            <div className="pt-1 flex flex-wrap gap-space-2">
                              {b.worker.badges.map((badge) => (
                                <span
                                  key={badge}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-highest text-primary font-label-sm text-label-sm"
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {badge.includes("Aadhaar") ? "fingerprint" : "shield"}
                                  </span>
                                  {badge}
                                </span>
                              ))}
                            </div>
                          </div>
                        </>
                      ) : b.matchingInfo ? (
                        <div className="flex items-center gap-space-4">
                          <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0 relative">
                            <span className="material-symbols-outlined text-[28px]">{b.matchingInfo.icon}</span>
                            <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-secondary-container" />
                          </div>
                          <div className="flex flex-col gap-space-1">
                            <span className="font-title-md text-title-md text-on-surface font-bold">
                              {b.matchingInfo.title}
                            </span>
                            <p className="font-body-sm text-body-sm text-on-surface-variant m-0">{b.matchingInfo.desc}</p>
                            <span className="font-label-sm text-label-sm text-outline flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">timer</span>
                              {b.matchingInfo.avgTime}
                            </span>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {/* Schedule & Address (4 cols) */}
                    <div className="lg:col-span-4 flex flex-col justify-center gap-space-2.5">
                      <div className="flex items-start gap-space-2 text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                          schedule
                        </span>
                        <div className="flex flex-col">
                          <span className="font-label-lg text-label-lg font-bold">{b.schedule}</span>
                          <span className="font-body-md text-body-md text-on-surface-variant">{b.time}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-space-2 text-on-surface">
                        <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">
                          pin_drop
                        </span>
                        <p className="font-body-sm text-body-sm text-on-surface-variant m-0 line-clamp-2">{b.address}</p>
                      </div>
                    </div>

                    {/* Pricing Block (3 cols) */}
                    <div className="lg:col-span-3 flex flex-col justify-center items-start lg:items-end bg-surface-container-lowest p-space-3 rounded-lg shadow-sm border border-border-tone/20">
                      <span className="font-label-sm text-label-sm text-outline">{b.priceLabel}</span>
                      <span className="font-headline-md text-headline-md text-primary font-bold">{b.price}</span>
                      <span className="font-label-sm text-label-sm text-on-tertiary-fixed-variant flex items-center gap-1 font-semibold">
                        <span className="material-symbols-outlined text-[14px]">balance</span>
                        {b.priceSub}
                      </span>
                    </div>
                  </div>

                  {/* Escrow Protection Micro-banner if applicable */}
                  {b.hasEscrowBanner && (
                    <div className="flex items-center justify-between px-space-4 py-space-2 bg-surface-container rounded-lg text-on-surface-variant font-label-sm text-label-sm">
                      <div className="flex items-center gap-space-2">
                        <span className="material-symbols-outlined text-primary text-[18px]">lock</span>
                        <span>Escrow Guarantee: Payment holds safely until Sunita completes your service checklist.</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate("admin")}
                        className="text-primary font-bold hover:underline hidden sm:inline bg-transparent border-none p-0 cursor-pointer text-xs"
                      >
                        Co-op Escrow Policy
                      </button>
                    </div>
                  )}

                  {/* Bottom Actions Row */}
                  <div className="flex flex-wrap items-center justify-between gap-space-4 pt-space-2">
                    <div className="flex items-center gap-space-3">
                      {b.statusType === "completed" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDownloadInvoice(b.id)}
                            className="px-space-3 py-space-1.5 rounded-full font-label-md text-label-md text-primary hover:bg-surface-container-low transition-colors flex items-center gap-1.5 border border-border-tone/40 bg-transparent cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            <span>Download GST Invoice</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("admin")}
                            className="px-space-3 py-space-1.5 rounded-full font-label-md text-label-md text-outline hover:text-on-surface transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">support_agent</span>
                            <span>Raise Issue</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            className="px-space-4 py-space-2 rounded-full font-label-md text-label-md text-primary bg-surface-container-low hover:bg-surface-container font-semibold transition-colors flex items-center gap-1.5 border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
                            <span>Reschedule Time</span>
                          </button>
                          <button
                            type="button"
                            className="px-space-3 py-space-2 rounded-full font-label-md text-label-md text-outline hover:text-error transition-colors bg-transparent border-none cursor-pointer"
                          >
                            Cancel Booking
                          </button>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-space-3">
                      {b.statusType === "completed" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onNavigate("rating", b)}
                            className="px-space-4 py-space-2 rounded-full font-label-md text-label-md text-primary bg-surface-container-low hover:bg-surface-container font-semibold transition-colors flex items-center gap-1 border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">rate_review</span>
                            <span>Edit Review</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("find-help")}
                            className="px-space-5 py-space-2 rounded-full font-label-md text-label-md bg-secondary-container text-on-secondary font-bold shadow-[0_4px_14px_rgba(253,101,30,0.25)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-2 border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">replay</span>
                            <span>Book Again</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => onNavigate("active-booking", b)}
                            className="px-space-4 py-space-2 rounded-xl font-label-md text-label-md bg-red-600/10 hover:bg-red-600/20 text-red-600 border border-red-500/30 font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            <span className="material-symbols-outlined text-[18px] text-red-600 animate-pulse">near_me</span>
                            <span>Live Tracking &amp; SOS</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("messages", b.worker)}
                            className="px-space-4 py-space-2 rounded-xl font-label-md text-label-md bg-[#00a884]/15 text-[#008069] hover:bg-[#00a884]/25 font-bold transition-all flex items-center gap-1.5 border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">chat</span>
                            <span>WhatsApp Chat</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onNavigate("active-booking", b)}
                            className="px-space-5 py-space-2 rounded-xl font-label-md text-label-md bg-secondary-container text-on-secondary font-bold shadow-[0_4px_14px_rgba(253,101,30,0.25)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-1.5 border-none cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            <span>Track Job</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          {/* Cooperative Sahayata Emergency Help Banner Card */}
          <div className="mt-space-12 bg-primary-container text-on-primary rounded-xl p-space-6 shadow-md relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-surface-tint opacity-20 pointer-events-none" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-6">
              <div className="flex items-start gap-space-4">
                <div className="w-12 h-12 rounded-full bg-surface-container-lowest/15 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px] text-primary-fixed">emergency_home</span>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm uppercase font-bold">
                      24x7 Support
                    </span>
                    <h3 className="font-title-md text-title-md font-bold text-on-primary m-0">
                      Need emergency service change?
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-primary-container max-w-2xl m-0">
                    Our Cooperative Sahayata desk is available 24/7. Instant ticket resolution, worker replacement
                    reassignment, or dispute settlement backed by the Multi-State Cooperative Federation.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-space-3 shrink-0">
                <button
                  type="button"
                  className="px-space-4 py-space-2 rounded-full bg-surface-container-lowest text-primary font-label-lg text-label-lg font-bold hover:bg-surface-container-low active:scale-95 transition-all flex items-center gap-2 border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px] text-secondary-container">call</span>
                  <span>Dial 1800-SAHAYATA</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate("admin")}
                  className="px-space-4 py-space-2 rounded-full bg-surface-container-lowest/10 text-on-primary hover:bg-surface-container-lowest/20 font-label-lg text-label-lg font-semibold transition-all border-none cursor-pointer"
                >
                  Desk FAQs
                </button>
              </div>
            </div>
          </div>

          {/* Cooperative Dividend & Transparent Margin Widget */}
          <div className="mt-space-6 grid grid-cols-1 md:grid-cols-3 gap-space-4">
            <div className="bg-surface-container-lowest p-space-4 rounded-xl shadow-sm flex items-center gap-space-3 border border-border-tone/30">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">payments</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Cooperative Platform Fee</span>
                <span className="font-title-md text-title-md font-bold text-on-surface">5% Flat (Vs 25-30% Commercial)</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-4 rounded-xl shadow-sm flex items-center gap-space-3 border border-border-tone/30">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">volunteer_activism</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Worker Social Welfare Pool</span>
                <span className="font-title-md text-title-md font-bold text-on-surface">₹142 Contributed via Bookings</span>
              </div>
            </div>

            <div className="bg-surface-container-lowest p-space-4 rounded-xl shadow-sm flex items-center gap-space-3 border border-border-tone/30">
              <div className="w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[22px]">verified</span>
              </div>
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm text-outline">Aadhaar &amp; Police Verification</span>
                <span className="font-title-md text-title-md font-bold text-on-surface">100% Federation Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Form Modal when opened */}
      {showBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-navy-anchor/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto overflow-x-hidden border border-border-tone/40">
            <BookingForm
              worker={selectedWorker}
              prefilledDate={selectedWorker?.prefilledDate}
              onCreated={handleNewBookingCreated}
              onCancel={() => setShowBookingModal(false)}
            />
          </div>
        </div>
      )}

      {/* Floating 24x7 Help Button */}
      <aside className="fixed bottom-6 left-6 z-50">
        <button
          className="flex items-center gap-space-2 px-space-4 py-space-2 bg-[#008069] text-white font-label-md text-label-md rounded-full shadow-lg hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer"
          type="button"
          onClick={() => onNavigate?.("messages")}
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Live Worker & Co-op Chat | 24x7 Support</span>
        </button>
      </aside>
    </div>
  );
}
