import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import WorkerRadarMap from "../Map/WorkerRadarMap";
import { showToast } from "../../toast";
import { DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR } from "../../assets/avatars";

export default function StitchHome({ onNavigate }) {
  const { t } = useTranslation();

  // Delhi NCR Verified Workers Dataset (Realistic coordinates across Delhi, Gurugram, Noida, Faridabad, Ghaziabad)
  const ncrWorkers = [
    {
      id: "w1",
      name: "Rajesh Kumar Sharma",
      role: "Master Plumber & Pipefitter",
      craft: "plumbing",
      rating: "4.92",
      jobs: "318 jobs completed",
      rate: "₹600",
      mapRate: "₹600",
      rateUnit: "/day",
      distance: "1.4 km",
      area: "Connaught Place",
      city: "New Delhi, Delhi NCR",
      experience: "5 years",
      workType: "On-site",
      jobNature: "Full Time",
      fixedPrice: "₹600/day",
      lat: 28.6315,
      lng: 77.2167,
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w2",
      name: "Sunita Devi",
      role: "Master Cook & Nutritionist",
      craft: "cooking",
      rating: "4.96",
      jobs: "420 jobs completed",
      rate: "₹450",
      mapRate: "₹450",
      rateUnit: "/visit",
      distance: "2.1 km",
      area: "Cyber City, DLF Phase 2",
      city: "Gurugram, Haryana",
      experience: "8 years",
      workType: "On-site",
      jobNature: "Part Time",
      fixedPrice: "₹450/visit",
      lat: 28.4952,
      lng: 77.0895,
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w3",
      name: "Arun V. Nair",
      role: "Licensed Master Electrician",
      craft: "electrical",
      rating: "4.88",
      jobs: "195 jobs completed",
      rate: "₹800",
      mapRate: "₹800",
      rateUnit: "/day",
      distance: "3.2 km",
      area: "Sector 62",
      city: "Noida, Uttar Pradesh",
      experience: "7 years",
      workType: "On-site",
      jobNature: "Full Time",
      fixedPrice: "₹800/day",
      lat: 28.628,
      lng: 77.3649,
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w4",
      name: "Pooja Hegde",
      role: "Deep Cleaning Specialist",
      craft: "cleaning",
      rating: "4.95",
      jobs: "280 jobs completed",
      rate: "₹350",
      mapRate: "₹350",
      rateUnit: "/service",
      distance: "1.8 km",
      area: "Saket & Malviya Nagar",
      city: "South Delhi, Delhi NCR",
      experience: "4 years",
      workType: "On-site",
      jobNature: "Part Time",
      fixedPrice: "₹350/service",
      lat: 28.5245,
      lng: 77.2066,
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w5",
      name: "Kavitha Murthy",
      role: "Sanitation & Housekeeping",
      craft: "cleaning",
      rating: "4.91",
      jobs: "380 jobs completed",
      rate: "₹500",
      mapRate: "₹500",
      rateUnit: "/day",
      distance: "2.6 km",
      area: "Indirapuram",
      city: "Ghaziabad, Uttar Pradesh",
      experience: "6 years",
      workType: "On-site",
      jobNature: "Full Time",
      fixedPrice: "₹500/day",
      lat: 28.6415,
      lng: 77.3712,
      image: DEFAULT_FEMALE_AVATAR,
    },
    {
      id: "w6",
      name: "Vikram Singh Rathore",
      role: "Master Carpenter & Woodcraft",
      craft: "carpentry",
      rating: "4.89",
      jobs: "214 jobs completed",
      rate: "₹750",
      mapRate: "₹750",
      rateUnit: "/day",
      distance: "4.1 km",
      area: "NIT Faridabad",
      city: "Faridabad, Haryana",
      experience: "9 years",
      workType: "On-site",
      jobNature: "Full Time",
      fixedPrice: "₹750/day",
      lat: 28.4089,
      lng: 77.3178,
      image: DEFAULT_MALE_AVATAR,
    },
    {
      id: "w7",
      name: "Amit Verma",
      role: "Appliance Repair Specialist",
      craft: "appliances",
      rating: "4.93",
      jobs: "340 jobs completed",
      rate: "₹450",
      mapRate: "₹450",
      rateUnit: "/service",
      distance: "2.3 km",
      area: "Karol Bagh",
      city: "West Delhi, Delhi NCR",
      experience: "6 years",
      workType: "On-site",
      jobNature: "Part Time",
      fixedPrice: "₹450/service",
      lat: 28.652,
      lng: 77.1906,
      image: DEFAULT_MALE_AVATAR,
    },
  ];

  // Alias for backward-compatibility with radar/map references
  const radarWorkers = ncrWorkers;

  const [selectedWorker, setSelectedWorker] = useState(ncrWorkers[0]);

  const categories = [
    { name: "Electricians", icon: "bolt", count: "340+ Pros" },
    { name: "Plumbers", icon: "plumbing", count: "280+ Pros" },
    { name: "Carpenters", icon: "carpenter", count: "190+ Pros" },
    { name: "Painters", icon: "format_paint", count: "165+ Pros" },
    { name: "Domestic Helpers", icon: "home_work", count: "510+ Pros", highlight: true },
    { name: "Caregivers", icon: "health_and_safety", count: "140+ Pros" },
    { name: "Drivers", icon: "directions_car", count: "320+ Pros" },
    { name: "Gardeners", icon: "yard", count: "125+ Pros" },
    { name: "Cleaners", icon: "cleaning_services", count: "480+ Pros" },
    { name: "Technicians", icon: "mode_fan", count: "290+ Pros" },
  ];

  const testimonials = [
    {
      quote:
        "“Knowing that 92% of what I pay goes directly to Ramesh in Connaught Place instead of a venture capital broker makes me feel genuinely good. The quality of work is 10x better because the workers are owners.”",
      name: "Priyanka Sen",
      location: "Connaught Place, New Delhi",
      initials: "PS",
      stars: 5,
    },
    {
      quote:
        "“Sunita arrived right on time at our Gurugram flat with proper identity credentials shown in the Sahakari app. Her food is healthy, authentic, and the pricing has zero hidden platform surge charges.”",
      name: "Anand Raghavan",
      location: "DLF Phase 2, Gurugram",
      initials: "AR",
      stars: 5,
    },
    {
      quote:
        "“As an apartment association secretary in Noida Sector 62, we now route all electrical and plumbing maintenance requests exclusively through GigConnect. The Police clearance documentation gives residents peace of mind.”",
      name: "Meera Deshmukh",
      location: "Sector 62, Noida",
      initials: "MD",
      stars: 4.5,
    },
  ];

  const handleHireWorker = (worker) => {
    onNavigate?.("booking", {
      name: worker.name,
      skills: [worker.role],
      price: worker.rate,
      prefilledDate: "Tomorrow, 09:30 AM",
    });
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen">
      {/* 1. TOP DUAL-PANE DISPATCH HERO (Fluid responsive flow - no artificial box wrapper) */}
      <section className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop pt-4 sm:pt-6 pb-10 sm:pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch">
          {/* LEFT PANE */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              {/* Badge + Hero Headline & Register CTA Button (Redundant tab row removed) */}
              <div className="flex items-center justify-between gap-4 mb-5 sm:mb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary-container/10 border border-secondary-container/20 rounded-full mb-2.5">
                    <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
                    <span className="text-[11px] font-bold text-secondary tracking-wide uppercase">
                      Live Delhi NCR Cooperative Network
                    </span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-primary leading-[1.12] tracking-tight font-headline-lg">
                    Let’s Find Your <br />
                    <span className="text-secondary-container">Perfect Match</span>
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate("register")}
                  className="w-12 h-12 rounded-full bg-secondary-container hover:bg-secondary active:scale-95 text-on-secondary flex items-center justify-center font-bold text-2xl shadow-md shadow-secondary-container/25 transition-all border-none cursor-pointer flex-shrink-0"
                  title="Register as Worker or Post Job"
                >
                  +
                </button>
              </div>

              {/* Interactive Dashboard Cards Row (Stacks to single column on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6">
                {/* Card 1: Manage Jobs & Applicants */}
                <div
                  onClick={() => onNavigate("booking")}
                  className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between min-h-[135px]"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                      Manage
                    </span>
                    <span className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center text-xs font-bold">
                      ≡
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-primary leading-tight">
                      Jobs & Applicants
                    </h3>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">5 active • 12 bookings</p>
                  </div>
                </div>

                {/* Card 2: Find Daily Worker (Secondary Container Card) */}
                <div
                  onClick={() => onNavigate("find-help")}
                  className="bg-secondary-container p-4 rounded-2xl shadow-md shadow-secondary-container/20 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[135px] text-on-secondary"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                      Find
                    </span>
                    <span className="w-6 h-6 rounded-full bg-black/15 text-on-secondary flex items-center justify-center text-xs">
                      👤
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-secondary leading-tight">
                      Daily Worker
                    </h3>
                    <p className="text-[11px] text-on-secondary/85 mt-0.5">14 active nearby</p>
                  </div>
                </div>

                {/* Card 3: Post Full/Part-Time (Primary Navy Card) */}
                <div
                  onClick={() => onNavigate("register")}
                  className="bg-primary p-4 rounded-2xl shadow-md shadow-primary/20 hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between min-h-[135px] text-on-primary"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-primary-container text-on-primary text-[10px] font-bold rounded-full">
                      Post
                    </span>
                    <span className="w-6 h-6 rounded-full bg-white/15 text-on-primary flex items-center justify-center text-xs">
                      ✎
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-on-primary leading-tight">
                      Full/Part-Time
                    </h3>
                    <p className="text-[11px] text-on-primary-container mt-0.5">7 gigs listed</p>
                  </div>
                </div>
              </div>

              {/* Applicants / Verified Workers Reel Header */}
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-primary">Nearby Verified Workers</span>
                <div className="flex items-center -space-x-2">
                  {ncrWorkers.map((w, idx) => (
                    <img
                      key={idx}
                      src={w.image}
                      alt={w.name}
                      onClick={() => setSelectedWorker(w)}
                      className="w-7 h-7 rounded-full object-cover border-2 border-surface-container-lowest cursor-pointer hover:scale-110 transition-transform"
                    />
                  ))}
                  <div className="w-7 h-7 rounded-full bg-surface-container text-primary text-[10px] font-bold border-2 border-surface-container-lowest flex items-center justify-center shadow-sm">
                    +{ncrWorkers.length}
                  </div>
                </div>
              </div>

              {/* Split Row: Mini Specs Card + Spotlight Worker Card */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
                {/* Left Mini Specs Card */}
                <div className="sm:col-span-5 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-high shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-2.5 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                        Job Profile
                      </span>
                      <span className="w-5 h-5 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center text-[10px]">
                        ✎
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-primary">
                      {selectedWorker.role}
                    </h4>
                    <p className="text-[10px] text-on-surface-variant mb-2">
                      {selectedWorker.city}
                    </p>
                    <div className="space-y-1 text-[10px] text-on-surface">
                      <div>
                        <strong>{selectedWorker.jobNature}</strong>
                        <p className="text-[9px] text-on-surface-variant">Employment Type</p>
                      </div>
                      <div>
                        <strong className="text-primary font-bold">{selectedWorker.fixedPrice}</strong>
                        <p className="text-[9px] text-on-surface-variant">Direct Base Rate</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-surface-container-high text-[10px] text-on-surface-variant font-medium">
                    {selectedWorker.experience} experience
                  </div>
                </div>

                {/* Right Spotlight Worker Card (Secondary Container - Cooperative Palette) */}
                <div className="sm:col-span-7 bg-secondary-container p-5 rounded-2xl shadow-lg shadow-secondary-container/25 text-on-secondary flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-0.5 bg-primary/25 text-on-secondary text-[10px] font-bold rounded-full">
                      {selectedWorker.rate}
                    </span>
                    <button
                      type="button"
                      onClick={() => showToast(`Saved ${selectedWorker.name} to bookmarks`)}
                      className="bg-transparent border-none cursor-pointer text-on-secondary hover:scale-110 transition-transform p-0"
                    >
                      <span className="material-symbols-outlined text-[18px]">bookmark</span>
                    </button>
                  </div>

                  {/* Centered Avatar with Radial Blur */}
                  <div className="flex flex-col items-center text-center my-1">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-on-secondary/40 shadow-md mb-2">
                      <img
                        src={selectedWorker.image}
                        alt={selectedWorker.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h4 className="font-bold text-sm text-on-secondary leading-tight">
                      {selectedWorker.name}
                    </h4>
                    <p className="text-[11px] text-on-secondary/90 font-medium">
                      {selectedWorker.role}
                    </p>
                  </div>

                  {/* Quick Action Pills (Chat, Phone, Mail) in Surface-Lowest / Primary */}
                  <div className="flex items-center justify-center gap-2 my-2.5">
                    <button
                      type="button"
                      onClick={() => onNavigate("messages", selectedWorker)}
                      title="Direct WhatsApp Chat"
                      className="w-8 h-8 rounded-full bg-[#00a884]/15 text-[#008069] flex items-center justify-center hover:bg-[#00a884]/25 hover:scale-105 shadow-sm transition-transform border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">chat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`Calling ${selectedWorker.name} via masked IVR...`)}
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center hover:bg-surface-container hover:scale-105 shadow-sm transition-transform border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">call</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`Sharing inquiry email with ${selectedWorker.name}`)}
                      className="w-8 h-8 rounded-full bg-surface-container-lowest text-primary flex items-center justify-center hover:bg-surface-container hover:scale-105 shadow-sm transition-transform border-none cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">mail</span>
                    </button>
                  </div>

                  {/* Tags Row */}
                  <div className="flex items-center justify-center gap-1.5 flex-wrap mb-3 text-[10px] font-semibold text-on-secondary/90">
                    <span className="px-2 py-0.5 bg-primary/20 rounded-full">{selectedWorker.workType}</span>
                    <span className="px-2 py-0.5 bg-primary/20 rounded-full">{selectedWorker.jobNature}</span>
                    <span className="px-2 py-0.5 bg-primary/20 rounded-full">{selectedWorker.experience}</span>
                    <span className="px-2 py-0.5 bg-primary/20 rounded-full">{selectedWorker.distance}</span>
                  </div>

                  {/* Deep Navy "Hire Now" Button */}
                  <button
                    type="button"
                    onClick={() => handleHireWorker(selectedWorker)}
                    className="w-full py-2.5 bg-primary hover:bg-primary-container active:scale-[0.98] text-on-primary font-bold text-xs rounded-full shadow-md transition-all border-none cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Hire Now</span>
                    <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT PANE: REAL-TIME NCR INTERACTIVE MAP */}
          <div className="lg:col-span-6 h-full min-h-[460px] sm:min-h-[540px] lg:min-h-[640px] flex flex-col">
            <WorkerRadarMap
              workers={ncrWorkers}
              selectedWorker={selectedWorker}
              onSelectWorker={setSelectedWorker}
              onNavigate={onNavigate}
            />
          </div>
        </div>
      </section>

      {/* 2. POPULAR TRADE CATEGORIES CAROUSEL */}
      <section className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">
              Explore Disciplines
            </span>
            <h2 className="text-2xl font-bold text-primary tracking-tight mt-0.5">
              Popular Cooperative Services
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("find-help")}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <span>View All Services</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {categories.map((cat, idx) => (
            <div
              key={idx}
              onClick={() => onNavigate("find-help")}
              className={`p-4 rounded-2xl text-center cursor-pointer transition-all ${cat.highlight
                  ? "bg-secondary-container text-on-secondary shadow-md scale-105"
                  : "bg-surface-container-lowest text-primary hover:shadow-md border border-surface-container-high"
                }`}
            >
              <div
                className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${cat.highlight ? "bg-white/20 text-white" : "bg-surface-container text-primary"
                  }`}
              >
                <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
              </div>
              <h4 className="font-bold text-xs truncate">{cat.name}</h4>
              <p
                className={`text-[10px] mt-0.5 ${cat.highlight ? "text-white/80" : "text-on-surface-variant"
                  }`}
              >
                {cat.count}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. COOPERATIVE TRANSPARENCY: 0% PLATFORM FEE & 95% DIRECT PAYOUT */}
      <section className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-10">
        <div className="rounded-3xl bg-primary text-on-primary p-8 md:p-12 relative overflow-hidden shadow-xl">
          <div className="max-w-2xl relative z-10">
            <span className="text-xs font-bold text-secondary-fixed uppercase tracking-wider">
              Democratic Economic Model
            </span>
            <h3 className="text-2xl md:text-3xl font-extrabold text-white mt-2 mb-4 tracking-tight">
              Where Your Payment Actually Goes
            </h3>
            <p className="text-sm text-primary-fixed-dim mb-8 leading-relaxed">
              Unlike venture-backed aggregators taking 25–35% in hidden commissions, GigConnect operates with a 0% Platform Fee and is owned 100% by its member tradespeople.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-white/15">
              <div>
                <div className="text-3xl font-extrabold text-secondary-fixed">95%</div>
                <div className="text-xs font-bold text-white mt-1">Direct to Worker</div>
                <p className="text-[11px] text-primary-fixed-dim mt-0.5">Jan Dhan or UPI daily settlement</p>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-on-tertiary-container">5%</div>
                <div className="text-xs font-bold text-white mt-1">Mutual Welfare Fund</div>
                <p className="text-[11px] text-primary-fixed-dim mt-0.5">Emergency healthcare & insurance</p>
              </div>
              <div>
                <div className="text-3xl font-extrabold text-slate-300">0%</div>
                <div className="text-xs font-bold text-white mt-1">Platform Fee (Zero Commission)</div>
                <p className="text-[11px] text-primary-fixed-dim mt-0.5">Digital public infrastructure</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. VERIFIED COMMUNITY TESTIMONIALS */}
      <section className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-8 pb-16">
        <div className="text-center mb-8">
          <span className="text-xs font-bold text-secondary uppercase tracking-wider">
            Real Stories
          </span>
          <h2 className="text-2xl font-bold text-primary tracking-tight mt-1">
            Voices of Our Cooperative Community
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-high shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="mb-4">
                <div className="flex items-center gap-1 text-secondary-container text-sm mb-3">
                  {"★".repeat(Math.floor(item.stars))}
                </div>
                <p className="text-xs text-on-surface leading-relaxed font-normal italic">
                  {item.quote}
                </p>
              </div>
              <div className="flex items-center gap-3 pt-3 border-t border-surface-container-high">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                  {item.initials}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-primary">{item.name}</h4>
                  <p className="text-[10px] text-on-surface-variant">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
