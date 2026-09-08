import React, { useState, useMemo, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getWorkers } from "../../api";
import VoiceAssistant from "../VoiceAssistant/VoiceAssistant";

export default function FindHelp({ onNavigate }) {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState("all");
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
    { id: "all", label: "All Crafts & Trades", icon: "handyman", count: "142 Pros" },
    { id: "plumbing", label: "Plumbing & Water Systems", icon: "plumbing", count: "38 Pros" },
    { id: "electrical", label: "Electrical & Wiring", icon: "bolt", count: "29 Pros" },
    { id: "cleaning", label: "Deep Cleaning & Sanitization", icon: "cleaning_services", count: "44 Pros" },
    { id: "carpentry", label: "Carpentry & Woodcraft", icon: "carpenter", count: "18 Pros" },
    { id: "cooking", label: "Home Cooking & Meals", icon: "skillet", count: "13 Pros" },
  ];

  const activeService = serviceOptions.find((opt) => opt.id === selectedCategory) || serviceOptions[0];

  const categoryChips = [
    { id: "all", label: "All Services (142)" },
    { id: "plumbing", label: "Plumbing (38)" },
    { id: "electrical", label: "Electrical (29)" },
    { id: "cleaning", label: "House Cleaning (44)" },
    { id: "carpentry", label: "Carpentry (18)" },
    { id: "cooking", label: "Home Cooking (13)" },
  ];

  const workers = [
    {
      id: "w1",
      name: "Rajesh Kumar Sharma",
      craft: "plumbing",
      role: "Senior Master Plumber (12 yrs exp)",
      rating: "4.92",
      jobs: "318 jobs completed",
      credential: "Co-op Member #4812",
      credentialIcon: "groups",
      skills: ["Pipe Leakage", "Water Tank Cleaning", "Sanitary Fitting"],
      rateType: "inspection fee",
      rate: "₹299",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBQ0R4FaK32-LTDKvfVqDbyhtlNTvo_KvcLnDo7QEq2LFNEPa3ce2GFfHRRyrTAl4yhcjTosOPteE20GgS63FLWuJczcBgxM_4p2cMEtDJ34T7nyNcpX9izfiVxxTl_yr_hARPmLFBf38CPBfgBJmeNuaRdry_lY3nMuJYkT11q_U6igPXB3Q9O_i8Vq_ecY_Z6BcPfwDmEV16EnjcEV6v3-l5aENVwzl6R2Zo40coHDVEywPAoDJyD",
    },
    {
      id: "w2",
      name: "Sunita Devi",
      craft: "cleaning",
      role: "Deep Cleaning Specialist (8 yrs exp)",
      rating: "4.96",
      jobs: "420 jobs completed",
      credential: "Women's Guild Lead",
      credentialIcon: "award_star",
      skills: ["Kitchen Deep Clean", "Eco Chemicals", "Balcony Scrubbing"],
      rateType: "base rate",
      rate: "₹499",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBx3bZtIOvkrmzU1IB_HpLaU24g-DoHISA3usNvoSySmiTrfRjKnCB-BZ0pOJf10x06Sj0LFsZQdGnvEEx5LpyWFF0jPb0ZtEfjXQT8ofSCOQCfatAicwvmNu-BhVu3X05Id1hub2nA0aIqQ_NdGLF2Uq-_y8HEYj4VUt8uAtSLQS6cYO1y4_47K3_lhh7WbW9hL61TCoLOiKvVH2UdwS8nZrvbpdqXUe3S_ytlb3wbnmsh63xD_x5P",
    },
    {
      id: "w3",
      name: "Arun V. Nair",
      craft: "electrical",
      role: "Licensed Electrician & Wireman",
      rating: "4.88",
      jobs: "195 jobs completed",
      credential: "Govt Wireman Certified",
      credentialIcon: "bolt",
      skills: ["Short Circuit Fix", "MCB Installation", "Inverter Wiring"],
      rateType: "callout fee",
      rate: "₹249",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDpGcH2m6LYp_L9jB1K9F7XCAzu9JxxYHgqMBvdMRcMYGYoNQ-vuMAQfinYPp7esxMJiyuxVVdELqL8p66zGzvqDmok8VuStHzHQFqSnYlKtelD1KkVFyTkGQyzHfNN9xgZ_NeJEL5Wm6vKoeobhkQZyMWLZdqhZDQ5savHG8mekHkDTcTdlq8bi431ORaXUNSLPapigBk21sYcP0pskayAET-F6lxoJP1QLFtAUzdOGL5i5bcyN7uy",
    },
    {
      id: "w4",
      name: "Mohammed Farhan",
      craft: "carpentry",
      role: "Furniture & Woodwork Carpenter",
      rating: "4.90",
      jobs: "160 jobs completed",
      credential: "Co-op Guild Craftsman",
      credentialIcon: "construction",
      skills: ["Hinges & Locks", "Custom Shelving", "Door Realignment"],
      rateType: "visiting charge",
      rate: "₹349",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDttoC6oVuk-88XfJZ2nIikZJs-Vb26l_Y1nN2B4taLU-jyufmMV7K8qSA4Eap3Zq0yIMB4-Lh9YFd_gaBz7MFFucUvvGPr6CQtIn7PpB4QgFAted_Z9GG1ywQpVqUtGZN1P9lvuRSCGK2-lvJ9LJ072Hw3qrPaYO7bl7xoXyWnRtqx8TTNLg2iyMjyzNybITkPVvZKtcqmz_BWtvRbPKhjZycAbWjIOgaPiYAihCoFjVPVyg-cY7XL",
    },
    {
      id: "w5",
      name: "Meenakshi Sundaram",
      craft: "cooking",
      role: "Home Cook & Meal Prep Specialist",
      rating: "4.95",
      jobs: "280 jobs completed",
      credential: "FSSAI Hygiene Certified",
      credentialIcon: "restaurant",
      skills: ["North/South Indian", "Party Meals", "Low-Oil Diet"],
      rateType: "/ 2 meals",
      rate: "₹500",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBioy9ew74UbITNWkkCYICLGE6BDrWpLvybuaP6SKIeqeNRsj-614oomwBlPAEYDWz_PW_TBcQmGiZRsgea1IqxVcUR58QTKZeHg3ESri8Q2k4n9CepE3VmwPBcRfawv_tO3HyXfHEGPtuvraDhYT4LiZvuWKCE-THtNUvkVsdjF5FCzn0G2bpO9wHxydVHIXITT0kXtOENAK8rKMvbfzwb4A6tywTD4sOQ7CfWGcEWy_rdfVDiA2yP",
    },
    {
      id: "w6",
      name: "Vikram Jadhav",
      craft: "electrical",
      role: "Appliance & AC Technician",
      rating: "4.85",
      jobs: "142 jobs completed",
      credential: "Co-op Safety Certified",
      credentialIcon: "security",
      skills: ["PCB Diagnostics", "Gas Refill", "Deep Foam Wash"],
      rateType: "diagnostic fee",
      rate: "₹399",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDraV3l21wZjUKStRWkznSj-tI4g7Fd4EnxSoXcLKpv9zobJ89g_JXFo4bmR2jNUFd7RmAo8n-MllGvh1v0-vvtnoNNyaTQAWTHpazr60Qveoq0lHxwRQQViG2RDCRX5HksLHyOGjBQhUP7si0-QG3ZKXL3XirTcSsRYhBzpXrO_8x7zx67MisJizaikX4OdtfufSM02ouX9COB-0lnx13VNe0QCVlR1YMGr1Nkfpt9lGvxwKH7YDcG",
    },
  ];

  const [apiWorkers, setApiWorkers] = useState([]);

  useEffect(() => {
    const skillMap = {
      all: "",
      plumbing: "Plumber",
      electrical: "Electrician",
      cleaning: "Domestic help",
      carpentry: "Carpenter",
      cooking: "Home Cooking",
      driver: "Driver",
      gardener: "Gardener",
    };
    const targetSkill = skillMap[selectedCategory] || "";
    getWorkers(targetSkill)
      .then((res) => {
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          const mapped = res.data.map((p) => {
            const rawSkill = p.skills?.[0]?.toLowerCase() || "";
            const derivedCraft = rawSkill.includes("plumb") ? "plumbing"
              : rawSkill.includes("elect") ? "electrical"
              : rawSkill.includes("clean") || rawSkill.includes("domestic") ? "cleaning"
              : rawSkill.includes("carp") ? "carpentry"
              : rawSkill.includes("cook") ? "cooking"
              : "all";

            return {
              id: p._id,
              userId: p.userId?._id,
              name: p.userId?.name || "Verified Cooperative Tradesperson",
              craft: selectedCategory === "all" ? derivedCraft : selectedCategory,
              role: `${p.skills?.join(" • ") || "Master Tradesperson"}`,
              rating: Number(p.ratingAvg || 4.92).toFixed(2),
              jobs: `${p.jobsCompleted || 120} jobs completed`,
              credential: "Co-op Verified Member",
              credentialIcon: "verified",
              skills: p.skills || [],
              rateType: "co-op floor rate",
              rate: "₹349",
              image: p.photoUrl || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80",
            };
          });
          setApiWorkers(mapped);
        }
      })
      .catch((err) => {
        console.warn("Workers fetch fallback to curated list:", err.message);
      });
  }, [selectedCategory]);

  const activeWorkerList = apiWorkers.length > 0 ? apiWorkers : workers;

  const filteredWorkers = useMemo(() => {
    if (selectedCategory === "all") return activeWorkerList;
    return activeWorkerList.filter((w) => w.craft === selectedCategory || w.role?.toLowerCase()?.includes(selectedCategory));
  }, [selectedCategory, activeWorkerList]);

  const handleBook = (worker) => {
    onNavigate?.("booking", {
      name: worker.name,
      userId: worker.userId || worker.id,
      skills: [worker.role],
      price: worker.rate,
      prefilledDate: selectedDate.toISOString(),
    });
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setLoadingMore(false);
      setAllLoaded(true);
    }, 800);
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen">
      <div className="flex flex-col w-full relative">
        {/* Ambient Corner Grid Geometry */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 overflow-hidden opacity-[0.05] -z-10 select-none">
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
          {/* Sub-header Breadcrumb & Operational Trust Strip */}
          <div className="flex flex-wrap items-center justify-between gap-space-4 mb-space-6">
            <div className="flex items-center gap-space-2 font-label-md text-label-md text-on-surface-variant">
              <button
                type="button"
                onClick={() => onNavigate?.("home")}
                className="hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer text-on-surface-variant font-label-md"
              >
                Federation
              </button>
              <span>/</span>
              <span className="text-primary font-semibold">Verified Guild Directory</span>
              <span className="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block" />
              <span className="text-secondary font-medium">Delhi NCR Central Hub • Connaught Place</span>
            </div>

            {/* Live Collective Rate Guarantee Pill */}
            <div className="flex items-center gap-space-2 px-space-3 py-space-1 bg-surface-container-high rounded-full shadow-sm text-on-surface">
              <span className="material-symbols-outlined text-[16px] text-tertiary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified_user
              </span>
              <span className="font-label-sm text-label-sm tracking-wide">
                100% Worker-Owned • Minimum Floor Wage Protected
              </span>
            </div>
          </div>

          {/* Sticky Integrated Search & Filter Hub */}
          <section className="sticky top-20 z-40 mb-space-8">
            <div className="bg-surface-container-lowest rounded-2xl shadow-md p-space-4 border border-border-tone/40">
              <form
                className="grid grid-cols-1 lg:grid-cols-12 gap-space-3 items-center"
                onSubmit={(e) => {
                  e.preventDefault();
                }}
              >
                {/* Custom Service Category Picker Dropdown */}
                <div ref={dropdownRef} className="relative lg:col-span-4">
                  <button
                    type="button"
                    onClick={() => setIsServiceDropdownOpen((prev) => !prev)}
                    className="w-full flex items-center justify-between bg-surface-container-low hover:bg-surface-container rounded-full px-space-4 py-space-2 cursor-pointer transition-colors border-none text-left select-none"
                    aria-haspopup="listbox"
                    aria-expanded={isServiceDropdownOpen}
                  >
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="material-symbols-outlined text-primary text-[20px] mr-space-2 shrink-0">
                        {activeService.icon}
                      </span>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant leading-none">
                          Service Type
                        </span>
                        <span className="font-body-md text-body-md text-on-surface font-semibold truncate pt-0.5">
                          {activeService.label}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`material-symbols-outlined text-[20px] transition-transform duration-200 shrink-0 ml-1 ${
                        isServiceDropdownOpen ? "rotate-180 text-primary" : "text-on-surface-variant"
                      }`}
                    >
                      expand_more
                    </span>
                  </button>

                  {/* Custom Dropdown Options Listbox Floating Menu */}
                  {isServiceDropdownOpen && (
                    <div
                      role="listbox"
                      className="absolute top-[calc(100%+8px)] left-0 right-0 w-full min-w-[270px] bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-[0_16px_36px_rgba(0,53,72,0.18)] z-[100] py-2 overflow-hidden"
                      style={{ backdropFilter: "blur(12px)" }}
                    >
                      <div className="px-3.5 py-1.5 text-[10px] font-bold text-on-surface-variant uppercase tracking-wider border-b border-surface-container-high/60 mb-1">
                        Select Cooperative Trade
                      </div>
                      {serviceOptions.map((opt) => {
                        const isSelected = selectedCategory === opt.id;
                        return (
                          <div
                            key={opt.id}
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              setSelectedCategory(opt.id);
                              setIsServiceDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-secondary-container/10 text-secondary font-bold"
                                : "text-on-surface hover:bg-surface-container-low"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span
                                className={`material-symbols-outlined text-[18px] ${
                                  isSelected ? "text-secondary" : "text-primary"
                                }`}
                              >
                                {opt.icon}
                              </span>
                              <span className="font-body-md text-body-md truncate">{opt.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 pl-2">
                              <span className="text-[11px] font-semibold text-on-surface-variant/80">
                                {opt.count}
                              </span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[16px] text-secondary">
                                  check
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Location Field */}
                <div className="lg:col-span-3 flex items-center bg-surface-container-low rounded-full px-space-4 py-space-2">
                  <span className="material-symbols-outlined text-secondary text-[20px] mr-space-2">location_on</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <label className="font-label-sm text-label-sm text-on-surface-variant leading-none" htmlFor="locationInput">
                      Locality / Pincode
                    </label>
                    <input
                      id="locationInput"
                      type="text"
                      value={searchLocation}
                      onChange={(e) => setSearchLocation(e.target.value)}
                      className="bg-transparent font-body-md text-body-md text-on-surface focus:outline-none truncate border-none pt-0.5"
                    />
                  </div>
                </div>

                {/* Date & Time Slot */}
                <div className="lg:col-span-3 flex items-center bg-surface-container-low rounded-full px-space-4 py-space-2">
                  <span className="material-symbols-outlined text-primary text-[20px] mr-space-2">calendar_today</span>
                  <div className="flex flex-col flex-1 min-w-0">
                    <label className="font-label-sm text-label-sm text-on-surface-variant leading-none" htmlFor="timeSlotInput">
                      {t("findHelp.serviceWindow", "Service Window")}
                    </label>
                    <DatePicker
                      id="timeSlotInput"
                      selected={selectedDate}
                      onChange={(date) => setSelectedDate(date || new Date())}
                      showTimeSelect
                      timeFormat="h:mm aa"
                      timeIntervals={30}
                      dateFormat="EEE, d MMM · h:mm aa"
                      minDate={new Date()}
                      className="bg-transparent font-body-md text-body-md text-on-surface focus:outline-none truncate border-none pt-0.5 w-full cursor-pointer"
                    />
                  </div>
                </div>

                {/* Action CTA */}
                <div className="lg:col-span-2 flex items-center justify-end">
                  <button
                    type="submit"
                    className="w-full h-12 inline-flex items-center justify-center gap-space-2 px-space-4 bg-primary-container text-on-primary font-label-lg text-label-lg rounded-full shadow-sm hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer font-bold"
                  >
                    <span className="material-symbols-outlined text-[18px]">tune</span>
                    <span>Filter Workers</span>
                  </button>
                </div>
              </form>
            </div>
          </section>

          {/* Category Filter Chips Horizontal Scroller & Voice Search */}
          <section aria-label="Craft Categories" className="mb-space-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-4">
            <div className="flex items-center gap-space-2 overflow-x-auto pb-space-2 min-w-0 flex-1">
              {categoryChips.map((chip) => {
                const isActive = selectedCategory === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setSelectedCategory(chip.id)}
                    className={`px-space-4 py-space-2 rounded-full font-label-md text-label-md transition-all shadow-sm border-none cursor-pointer shrink-0 ${
                      isActive
                        ? "bg-primary-container text-on-primary font-bold"
                        : "bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
            <VoiceAssistant onServiceDetected={(cat) => setSelectedCategory(cat)} className="shrink-0" />
          </section>

          {/* Cooperative Transparency Banner */}
          <div className="bg-surface-container rounded-xl p-space-4 mb-space-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-space-4 shadow-sm">
            <div className="flex items-center gap-space-3">
              <div className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">balance</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-primary font-bold">100% Zero-Commission Guarantee</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Your payment goes straight to verified cooperative members. Platform expenses are democratically funded via member dividends.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-space-3 shrink-0">
              <span className="font-label-sm text-label-sm px-space-3 py-space-1 bg-surface-container-lowest rounded-full text-on-surface font-semibold shadow-sm">
                Average Arrival: 32 mins
              </span>
            </div>
          </div>

          {/* Worker Profile Grid (3 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-6" id="workerCardsGrid">
            {filteredWorkers.map((worker) => (
              <article
                key={worker.id}
                className="bg-surface-container-lowest rounded-2xl p-space-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col justify-between border border-border-tone/30"
              >
                <div>
                  {/* Top Row: Photo, Badges, Header info */}
                  <div className="flex items-start gap-space-4 mb-space-4">
                    <div className="relative shrink-0">
                      <img className="w-16 h-16 rounded-full object-cover shadow-inner" src={worker.image} alt={worker.name} />
                      <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-on-tertiary-container text-on-tertiary rounded-full flex items-center justify-center text-[12px] shadow-sm font-bold">
                        ✓
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-space-1">
                        <h3 className="font-title-md text-title-md text-on-surface font-bold truncate m-0">{worker.name}</h3>
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant font-medium mt-1 mb-0">{worker.role}</p>
                      <div className="flex items-center gap-space-1 mt-space-1 text-secondary">
                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                        <span className="font-label-md text-label-md font-bold text-on-surface">{worker.rating}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">({worker.jobs})</span>
                      </div>
                    </div>
                  </div>

                  {/* Credential Pills */}
                  <div className="flex flex-wrap gap-space-2 mb-space-4">
                    <span className="inline-flex items-center gap-space-1 px-space-3 py-1 bg-surface-container-high text-tertiary-container rounded-full font-label-sm text-label-sm font-bold">
                      <span className="material-symbols-outlined text-[14px]">verified</span> Aadhaar Verified ✓
                    </span>
                    <span className="inline-flex items-center gap-space-1 px-space-3 py-1 bg-surface-container-low text-primary rounded-full font-label-sm text-label-sm font-semibold">
                      <span className="material-symbols-outlined text-[14px]">{worker.credentialIcon}</span> {worker.credential}
                    </span>
                  </div>

                  {/* Skill Badges */}
                  <div className="flex flex-wrap gap-space-2 mb-space-6">
                    {worker.skills.map((skill) => (
                      <span key={skill} className="px-space-2 py-0.5 bg-surface-container text-on-surface-variant rounded font-label-sm text-label-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Row: Price & Booking Action */}
                <div className="pt-space-4 bg-surface-container-low/50 -mx-space-6 -mb-space-6 p-space-6 rounded-b-2xl flex items-center justify-between mt-space-2 border-t border-border-tone/20">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Floor Standard
                    </span>
                    <span className="font-headline-sm text-headline-sm text-primary font-bold">
                      {worker.rate}{" "}
                      <span className="font-body-sm text-body-sm font-normal text-on-surface-variant">
                        {worker.rateType}
                      </span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBook(worker)}
                    className="px-space-4 py-space-2 bg-secondary-container text-on-secondary font-label-lg text-label-lg rounded-full shadow-[0_4px_14px_rgba(253,101,30,0.3)] hover:opacity-95 active:scale-95 transition-all inline-flex items-center gap-space-1 font-bold border-none cursor-pointer"
                  >
                    <span>Book Now</span>
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </article>
            ))}
          </div>

          {/* Cooperative Escrow Trust Guarantee Footer Card */}
          <div className="mt-space-12 p-space-6 bg-surface-container-low rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-space-6 border border-border-tone/30">
            <div className="flex items-center gap-space-4">
              <div className="w-12 h-12 rounded-2xl bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm shrink-0">
                <span className="material-symbols-outlined text-[28px]">lock</span>
              </div>
              <div className="flex flex-col">
                <span className="font-title-md text-title-md text-on-surface font-bold">
                  Aadhaar Bio-Authenticated Escrow Guarantee
                </span>
                <p className="font-body-sm text-body-sm text-on-surface-variant max-w-2xl m-0 mt-1">
                  Funds remain held in your secure cooperative wallet until you confirm completion with your one-time digital signature. No hidden platform markups or arbitrary surges.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-space-2 shrink-0">
              <span className="material-symbols-outlined text-[20px] text-tertiary-container">verified</span>
              <span className="font-label-sm text-label-sm font-bold text-on-surface">RBI Regulated Escrow</span>
            </div>
          </div>

          {/* Pagination / Load More Pill Button */}
          <div className="flex flex-col items-center justify-center mt-space-12 mb-space-8">
            <button
              type="button"
              id="loadMoreBtn"
              onClick={handleLoadMore}
              disabled={allLoaded}
              className={`px-space-8 py-space-3 bg-surface-container-lowest text-primary-container font-label-lg text-label-lg rounded-full shadow-sm hover:bg-surface-container active:scale-95 transition-all flex items-center gap-space-2 border-none cursor-pointer ${
                allLoaded ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {loadingMore ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                  <span>Fetching verified records...</span>
                </>
              ) : allLoaded ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">done</span>
                  <span>All Local Guilds Loaded</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">expand_more</span>
                  <span>Load 24 More Verified Workers</span>
                </>
              )}
            </button>
            <span className="font-label-sm text-label-sm text-on-surface-variant mt-space-2">
              Showing {filteredWorkers.length} of 142 Cooperative Service Members in Delhi NCR
            </span>
          </div>
        </div>
      </div>

      {/* Floating 24x7 Help Button */}
      <aside className="fixed bottom-6 left-6 z-50">
        <button
          className="flex items-center gap-space-2 px-space-4 py-space-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-full shadow-lg hover:opacity-95 active:scale-95 transition-all border-none cursor-pointer"
          type="button"
          onClick={() => onNavigate?.("admin")}
        >
          <span className="material-symbols-outlined text-[18px]">chat</span>
          <span>Need Help? | 24x7 Cooperative Sahayata</span>
        </button>
      </aside>
    </div>
  );
}
