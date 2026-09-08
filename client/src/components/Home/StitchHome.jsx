import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function StitchHome({ onNavigate }) {
  const { t } = useTranslation();
  const [selectedService, setSelectedService] = useState("cleaning");
  const [pincode, setPincode] = useState("Indiranagar Stage II, BLR");
  const [slot, setSlot] = useState("Tomorrow, 09:30 AM");
  const [activeCategory, setActiveCategory] = useState("Deep Clean");

  const categories = [
    { name: "Plumbing", icon: "plumbing", count: "340+ Pros" },
    { name: "Electrical", icon: "bolt", count: "280+ Pros" },
    { name: "Deep Clean", icon: "cleaning_services", count: "Most Booked", highlight: true },
    { name: "Cooking", icon: "skillet", count: "510+ Pros" },
    { name: "Carpentry", icon: "carpenter", count: "190+ Pros" },
    { name: "Appliances", icon: "mode_fan", count: "420+ Pros" },
    { name: "Painting", icon: "format_paint", count: "165+ Pros" },
  ];

  const popularServices = [
    { title: "House Deep Cleaning", icon: "sanitizer" },
    { title: "Ceiling Fan Repair", icon: "toys" },
    { title: "Furniture Assembly", icon: "chair" },
    { title: "RO Water Purifier Service", icon: "water_drop" },
    { title: "Daily Home Cook", icon: "soup_kitchen" },
    { title: "Switchboard Fixing", icon: "power" },
    { title: "Sofa Shampooing", icon: "living" },
    { title: "Bathroom Leakage Fix", icon: "shower" },
    { title: "Wall Crack Putty", icon: "brush" },
    { title: "AC Filter Deep Wash", icon: "ac_unit" },
  ];

  const featuredWorkers = [
    {
      name: "Sunita Devi",
      role: "Master Cook • North & South Cuisine",
      rating: "4.94",
      jobs: "420+ completed gigs",
      rate: "₹350",
      rateUnit: "/visit",
      unit: "Co-op Unit #BLR-402",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuC47C1-igLvcaZfPuU6EpH-Byy9NcKNL2oCySKEpLvXjYmuOHvQTlfrS-qBv0f6O1wtarJQhmICS9l1DVi92_s3ERr-72-85Tfwcpib2li6c9-lUJK7MDF6mdOe8RKlcQHPu8Tt0JQlVqpSBInacUnV-LadsJvvqEwPrtC9eE8EQ92Ql05UWAq7zoytsxvwkcOAteYhhvY6qQPGGb-n4mMEyBLROXcdTktxABXV-vSMHmrYg4EwXsYD",
    },
    {
      name: "Ramesh Kumar",
      role: "Licensed Master Electrician • Inverters & Mains",
      rating: "4.98",
      jobs: "610+ completed gigs",
      rate: "₹299",
      rateUnit: "/service",
      unit: "Co-op Unit #BLR-118",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuDCQMJAooztXiuzQcwVpaALbMmxNmhFPVVln6oF6k_0Ml0ZLr4-OvV_ZCR1HcsqbPXRlrJtLPfMKEK-8Vg0rC-9ZH2G5aLx0E6XTKHyFxY0TyBTrXjC258Yrbq16SptzF2500VxbHpBixfUmsd3I7acpOz9ykGvXrcFmDNCkD-IxO60LCeR28axd0eVirOTgtXr_67qBmFLsMG1EpBLkXkUpt42X_WE_jbsK2CqCRXlTr3fmtqYNPFU",
    },
    {
      name: "Kavitha M.",
      role: "Deep Cleaning Specialist • Steam Sanitation",
      rating: "4.91",
      jobs: "380+ completed gigs",
      rate: "₹549",
      rateUnit: "/base rate",
      unit: "Co-op Unit #BLR-205",
      image:
        "https://lh3.googleusercontent.com/aida-public/AB6AXuBqjucqamkZdtyEhy66RwDBiPyC6GzAHfCd0PvlhIOaPEfc1qJXxqwvotGaJdSDA8ZLwNJV1wPNC4MQfWSYNks8K92L5G507VvpprMRUyvmy4PM9Kea2CVJ2EoCF-TW-ctUKMZL7XPT2UDseg9pk28AGq95F289gvgVPel11vPAO-6Yv5IO74p0tAj4NfeXhaNANaara6uLIBdeDo9P1YXYa1x4SMUIRkFhtFuXQKfulci5haftWlIy",
    },
  ];

  const testimonials = [
    {
      quote:
        "“Knowing that 92% of what I pay goes directly to Ramesh instead of a venture capital broker makes me feel genuinely good. The quality of work is 10x better because the workers are owners.”",
      name: "Priyanka Sen",
      location: "Koramangala, Bengaluru",
      initials: "PS",
      stars: 5,
    },
    {
      quote:
        "“Sunita arrived right on time with proper identity credentials shown in the Sahakari app. Her food is healthy, authentic, and the pricing has zero hidden platform surge charges.”",
      name: "Anand Raghavan",
      location: "Indiranagar, Bengaluru",
      initials: "AR",
      stars: 5,
    },
    {
      quote:
        "“As an apartment association secretary, we now route all electrical and plumbing maintenance requests exclusively through GigConnect. The Police clearance documentation gives residents peace of mind.”",
      name: "Meera Deshmukh",
      location: "HSR Layout, Bengaluru",
      initials: "MD",
      stars: 4.5,
    },
  ];

  const handleBookNow = () => {
    onNavigate?.("booking", {
      skills: [selectedService],
      prefilledDate: slot,
    });
  };

  const handleBookWorker = (worker) => {
    onNavigate?.("booking", {
      name: worker.name,
      skills: [worker.role],
      price: worker.rate,
      prefilledDate: slot,
    });
  };

  return (
    <div className="w-full bg-surface text-on-surface antialiased">
      <div className="flex flex-col w-full relative overflow-hidden">
        {/* Decorative Ambient Corner Anchors */}
        <div className="absolute -top-12 -right-12 w-96 h-96 pointer-events-none opacity-[0.06] text-primary-container z-0 select-none">
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 200 200">
            <path
              d="M42.7,-72.8C54.9,-67.2,64,-55.8,70.9,-43.1C77.8,-30.4,82.5,-16.4,81.4,-2.8C80.3,10.8,73.4,24.1,65.2,36C57,47.9,47.5,58.4,36,65.8C24.5,73.2,11,77.5,-2.9,82.5C-16.8,87.6,-31.2,93.4,-44.6,88.7C-58,84,-70.4,68.8,-77.3,52.3C-84.2,35.8,-85.6,18,-83.4,1.3C-81.2,-15.4,-75.4,-31,-65.7,-43.3C-56,-55.6,-42.4,-64.6,-28.9,-69.5C-15.4,-74.4,-2,-75.2,10.9,-72.1L42.7,-72.8Z"
              transform="translate(100 100)"
            />
          </svg>
        </div>
        <div className="absolute bottom-40 -left-16 w-80 h-80 pointer-events-none opacity-[0.05] text-primary z-0 select-none">
          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 200 200">
            <circle cx="100" cy="100" fill="none" r="80" stroke="currentColor" strokeDasharray="6,6" strokeWidth="1.5" />
            <circle cx="100" cy="100" fill="none" r="60" stroke="currentColor" strokeWidth="1" />
            <circle cx="100" cy="100" fill="none" r="40" stroke="currentColor" strokeDasharray="4,4" strokeWidth="1.5" />
            <path d="M20,100 L180,100 M100,20 L100,180" stroke="currentColor" strokeWidth="0.75" />
          </svg>
        </div>

        {/* Hero Section */}
        <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop pt-space-8 md:pt-space-12 pb-space-8 w-full">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Eyebrow Pill */}
            <div className="inline-flex items-center gap-space-2 px-space-4 py-space-1 bg-secondary-fixed/50 text-secondary rounded-full shadow-sm mb-space-4">
              <span className="w-2 h-2 rounded-full bg-secondary-container animate-pulse" />
              <span className="font-label-sm text-label-sm tracking-wider uppercase font-bold text-secondary">
                Cooperative-Owned Service Network
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display text-headline-lg-mobile md:text-display text-primary tracking-tight font-extrabold max-w-3xl mb-space-4 leading-tight">
              Reliable help from workers your neighbourhood trusts.
            </h1>

            {/* Subtext */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed mb-space-8">
              India’s first democratic worker-owned cooperative federation. Verified domestic professionals, transparent living-wage tariffs, and 0% exploitative platform intermediary commissions.
            </p>

            {/* Search & Booking Card Widget */}
            <div className="w-full bg-surface-container-lowest rounded-xl shadow-xl p-space-4 md:p-space-6 flex flex-col lg:flex-row items-stretch lg:items-center gap-space-4">
              {/* Service Input */}
              <div className="flex-1 flex items-center gap-space-3 bg-surface-container-low px-space-4 py-space-3 rounded-xl">
                <span className="material-symbols-outlined text-primary text-[22px]">home_repair_service</span>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <label className="font-label-sm text-label-sm text-on-surface-variant leading-none" htmlFor="service-selector">
                    Service Type
                  </label>
                  <select
                    id="service-selector"
                    className="bg-transparent font-label-lg text-label-lg text-on-surface focus:outline-none cursor-pointer pt-0.5 w-full truncate border-none"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="cleaning">Deep Home Cleaning</option>
                    <option value="plumbing">Plumbing Diagnostics & Repair</option>
                    <option value="electrical">Electrical Wire & Appliance</option>
                    <option value="carpentry">Custom Furniture & Carpentry</option>
                    <option value="cooking">Daily Home Cook & Nutrition</option>
                    <option value="appliances">AC & RO Purifier Maintenance</option>
                  </select>
                </div>
              </div>

              {/* Locality / Pincode */}
              <div className="flex-1 flex items-center gap-space-3 bg-surface-container-low px-space-4 py-space-3 rounded-xl">
                <span className="material-symbols-outlined text-secondary-container text-[22px]">location_on</span>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <label className="font-label-sm text-label-sm text-on-surface-variant leading-none" htmlFor="pincode-input">
                    Locality or Pincode
                  </label>
                  <input
                    id="pincode-input"
                    type="text"
                    className="bg-transparent font-label-lg text-label-lg text-on-surface placeholder:text-outline focus:outline-none pt-0.5 w-full truncate border-none"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. Indiranagar, 560038"
                  />
                </div>
              </div>

              {/* Date & Slot */}
              <div className="flex-1 flex items-center gap-space-3 bg-surface-container-low px-space-4 py-space-3 rounded-xl">
                <span className="material-symbols-outlined text-primary-container text-[22px]">calendar_month</span>
                <div className="flex flex-col text-left flex-1 min-w-0">
                  <label className="font-label-sm text-label-sm text-on-surface-variant leading-none" htmlFor="slot-input">
                    Preferred Slot
                  </label>
                  <input
                    id="slot-input"
                    type="text"
                    className="bg-transparent font-label-lg text-label-lg text-on-surface placeholder:text-outline focus:outline-none pt-0.5 w-full truncate border-none"
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    placeholder="Today / Tomorrow"
                  />
                </div>
              </div>

              {/* CTA Button */}
              <button
                type="button"
                onClick={handleBookNow}
                className="flex items-center justify-center gap-space-2 px-space-8 py-space-4 bg-secondary-container text-on-secondary font-label-lg text-label-lg rounded-xl shadow-md hover:opacity-95 active:scale-98 transition-all shrink-0 cursor-pointer border-none font-bold"
              >
                <span>Book Now</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            {/* Quick Micro Guarantees */}
            <div className="flex flex-wrap items-center justify-center gap-space-6 mt-space-4 text-on-surface-variant">
              <span className="flex items-center gap-space-1 font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container">verified_user</span> 100% Aadhaar Verified Staff
              </span>
              <span className="flex items-center gap-space-1 font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container">account_balance</span> 92% Payout to Co-op Workers
              </span>
              <span className="flex items-center gap-space-1 font-label-sm text-label-sm">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container">history</span> Free Reschedule & Escrow Protect
              </span>
            </div>
          </div>
        </section>

        {/* Service Categories Horizontal Bar */}
        <section className="w-full max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-space-3">
            {categories.map((cat) => {
              const isActive = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setSelectedService(cat.name.toLowerCase());
                  }}
                  className={`group flex flex-col items-center text-center p-space-4 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-none cursor-pointer ${
                    isActive ? "shadow-md -translate-y-0.5 ring-2 ring-secondary-container" : ""
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center mb-space-3 transition-colors ${
                      isActive || cat.highlight
                        ? "bg-secondary-fixed text-secondary"
                        : "bg-surface-container-low text-primary-container group-hover:bg-primary-container group-hover:text-on-primary"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[26px]">{cat.icon}</span>
                  </div>
                  <span className={`font-label-lg text-label-lg font-semibold ${isActive || cat.highlight ? "text-secondary font-bold" : "text-on-surface"}`}>
                    {cat.name}
                  </span>
                  <span className={`font-body-sm text-body-sm mt-0.5 ${isActive || cat.highlight ? "text-secondary font-medium" : "text-on-surface-variant"}`}>
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Popular On-Demand Services Pill-Tag Grid */}
        <section className="w-full max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-6">
          <div className="bg-surface-container-low rounded-xl p-space-6 md:p-space-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-space-2 mb-space-6">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-bold">
                  Quick Direct Bookings
                </span>
                <h2 className="font-headline-md text-headline-md text-primary font-bold">
                  Popular On-Demand Services in Your Sector
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate?.("find-help")}
                className="inline-flex items-center gap-space-1 font-label-lg text-label-lg text-primary-container hover:text-primary font-bold underline transition-colors bg-transparent border-none cursor-pointer self-start sm:self-auto"
              >
                <span>See All 45+ Services</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
            <div className="flex flex-wrap gap-space-2 md:gap-space-3">
              {popularServices.map((srv) => (
                <button
                  key={srv.title}
                  type="button"
                  onClick={() => {
                    setSelectedService(srv.title);
                    handleBookNow();
                  }}
                  className="inline-flex items-center gap-space-2 px-space-4 py-space-2 bg-surface-container-lowest text-on-surface rounded-full shadow-sm hover:bg-primary-container hover:text-on-primary transition-all text-sm font-medium border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">{srv.icon}</span>
                  <span>{srv.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Visual Bento & Featured Federation Professionals Showcase */}
        <section className="w-full max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4 mb-space-8">
            <div>
              <div className="inline-flex items-center gap-space-2 text-primary-container font-label-md text-label-md font-bold mb-space-1">
                <span className="material-symbols-outlined text-[18px]">co_present</span>
                <span>MEMBER-OWNER ROSTER</span>
              </div>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Top-rated cooperative professionals near you
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("find-help")}
              className="text-secondary-container hover:text-secondary font-label-lg text-label-lg font-bold flex items-center gap-space-1 self-start md:self-auto bg-transparent border-none cursor-pointer"
            >
              <span>Explore All Cooperatives</span>
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>

          {/* Worker Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
            {featuredWorkers.map((worker) => (
              <div
                key={worker.name}
                className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-space-3 mb-space-4">
                    <div className="relative">
                      <img
                        className="w-16 h-16 rounded-full object-cover shadow-inner"
                        src={worker.image}
                        alt={worker.name}
                      />
                      <span className="absolute -bottom-1 -right-1 bg-tertiary-fixed text-on-tertiary-fixed p-0.5 rounded-full shadow-sm flex items-center justify-center">
                        <span className="material-symbols-outlined text-[14px] block">verified</span>
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-space-3 py-0.5 bg-surface-container text-tertiary font-label-sm text-label-sm rounded-full font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">shield</span> Aadhaar Active
                      </span>
                      <span className="text-on-surface-variant font-label-sm text-label-sm mt-1">{worker.unit}</span>
                    </div>
                  </div>
                  <h3 className="font-title-md text-title-md font-bold text-on-surface m-0">{worker.name}</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-3 mt-1">{worker.role}</p>
                  <div className="flex items-center gap-space-3 mb-space-4 pb-space-4 bg-surface-container-low/50 p-space-2 rounded-lg">
                    <div className="flex items-center text-secondary">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                      <span className="font-label-lg text-label-lg font-bold ml-1">{worker.rating}</span>
                    </div>
                    <span className="text-outline-variant font-label-sm">•</span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{worker.jobs}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-space-2">
                  <div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">Cooperative Standard</span>
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">
                      {worker.rate}
                      <span className="font-body-sm text-body-sm text-on-surface-variant font-normal">{worker.rateUnit}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleBookWorker(worker)}
                    className="px-space-4 py-space-2 bg-secondary-container text-on-secondary font-label-md text-label-md rounded-xl hover:opacity-90 font-bold transition-all shadow-sm border-none cursor-pointer"
                  >
                    Book {worker.name.split(" ")[0]}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Trust & Verification Section (3 Callout Cards) */}
        <section className="w-full bg-surface-container-low py-space-16">
          <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop">
            <div className="text-center max-w-2xl mx-auto mb-space-12">
              <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                Democratic Security Architecture
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold mt-space-1">
                Why your neighbourhood chooses a cooperative
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-2">
                Unlike private venture-backed gig apps that squeeze worker margins and cut safety corners, GigConnect is legally co-owned by workers and patrons.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
              {/* Trust Card 1 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-tertiary-fixed/30 text-tertiary-container flex items-center justify-center mb-space-6">
                    <span className="material-symbols-outlined text-[28px]">verified_user</span>
                  </div>
                  <div className="inline-flex items-center gap-space-1 px-space-3 py-1 bg-surface-container text-tertiary font-label-sm text-label-sm rounded-full font-bold mb-space-3">
                    <span className="material-symbols-outlined text-[14px]">fingerprint</span>
                    <span>UIDAI Biometric Authenticated</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-2 m-0">
                    100% Aadhaar & Police Verified
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Every service professional undergoes mandatory residential address background checks, live biometric identity clearance, and local ward cooperative peer-sponsoring before their first assignment.
                  </p>
                </div>
                <div className="pt-space-6 mt-space-6 flex items-center gap-space-2 text-tertiary font-label-md text-label-md font-bold border-t border-surface-container">
                  <span className="material-symbols-outlined text-[18px]">verified</span> Zero unvetted sub-contracting
                </div>
              </div>

              {/* Trust Card 2 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-fixed text-primary-container flex items-center justify-center mb-space-6">
                    <span className="material-symbols-outlined text-[28px]">groups</span>
                  </div>
                  <div className="inline-flex items-center gap-space-1 px-space-3 py-1 bg-primary-fixed/40 text-primary-container font-label-sm text-label-sm rounded-full font-bold mb-space-3">
                    <span className="material-symbols-outlined text-[14px]">how_to_vote</span>
                    <span>Democratic Shareholding</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-2 m-0">
                    14,800+ Verified Worker-Owners
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Active across 6 metro clusters. Service providers elect their own board of directors, vote annually on algorithm transparency rules, and collectively govern peak hour service guidelines.
                  </p>
                </div>
                <div className="pt-space-6 mt-space-6 flex items-center gap-space-2 text-primary font-label-md text-label-md font-bold border-t border-surface-container">
                  <span className="material-symbols-outlined text-[18px]">hub</span> Multi-State Cooperative Society Registered
                </div>
              </div>

              {/* Trust Card 3 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center mb-space-6">
                    <span className="material-symbols-outlined text-[28px]">savings</span>
                  </div>
                  <div className="inline-flex items-center gap-space-1 px-space-3 py-1 bg-secondary-fixed/50 text-secondary font-label-sm text-label-sm rounded-full font-bold mb-space-3">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    <span>Fair Wage Standard</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold mb-space-2 m-0">
                    Cooperative Ownership Guarantee
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    92% of your booking fee transfers straight into the worker’s UPI bank account upon PIN clearance. The remaining 8% finances community health insurance, maternity relief, and children’s education corpus.
                  </p>
                </div>
                <div className="pt-space-6 mt-space-6 flex items-center gap-space-2 text-secondary font-label-md text-label-md font-bold border-t border-surface-container">
                  <span className="material-symbols-outlined text-[18px]">favorite</span> Community pension protected
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cooperative Transparency & Escrow Infographic Card */}
        <section className="w-full max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-12">
          <div className="bg-primary-container text-on-primary rounded-xl p-space-8 md:p-space-12 shadow-xl flex flex-col lg:flex-row items-center gap-space-8 relative overflow-hidden">
            {/* Background SVG Jaali Pattern Accent */}
            <div className="absolute right-0 top-0 w-96 h-96 opacity-10 pointer-events-none text-on-primary">
              <svg fill="currentColor" viewBox="0 0 100 100">
                <pattern id="jaali-pattern" patternUnits="userSpaceOnUse" width="20" height="20">
                  <path d="M 0 10 L 10 0 L 20 10 L 10 20 Z" fill="none" stroke="currentColor" strokeWidth="1" />
                  <circle cx="10" cy="10" r="2" fill="currentColor" />
                </pattern>
                <rect width="100" height="100" fill="url(#jaali-pattern)" />
              </svg>
            </div>

            <div className="flex-1 z-10">
              <span className="px-space-3 py-1 bg-surface-container-lowest/15 rounded-full font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-semibold">
                Financial Transparency Audit
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-primary mt-space-3 mb-space-4">
                Where does your ₹100 spend go?
              </h2>
              <p className="font-body-md text-body-md text-on-primary-container max-w-lg mb-space-6">
                Compare GigConnect’s democratic model against private venture gig platforms taking up to 35% commission with zero health or pension protection.
              </p>
              <div className="flex flex-col gap-space-3 max-w-md">
                {/* Item 1 */}
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-primary mb-1">
                    <span className="font-semibold">₹92.00 Direct Worker Bank Account</span>
                    <span className="text-tertiary-fixed font-bold">92%</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest/20 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-tertiary-fixed h-full rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
                {/* Item 2 */}
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-primary mb-1">
                    <span>₹5.00 Workers Welfare & Health Shield</span>
                    <span className="text-secondary-fixed font-bold">5%</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest/20 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-secondary-fixed h-full rounded-full" style={{ width: "5%" }} />
                  </div>
                </div>
                {/* Item 3 */}
                <div>
                  <div className="flex justify-between font-label-sm text-label-sm text-on-primary mb-1">
                    <span>₹3.00 Server Ops & SMS Dispatch</span>
                    <span className="text-on-primary-container font-bold">3%</span>
                  </div>
                  <div className="w-full bg-surface-container-lowest/20 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-primary-fixed h-full rounded-full" style={{ width: "3%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Escrow Assurance Box */}
            <div className="w-full lg:w-96 bg-surface-container-lowest text-on-surface rounded-xl p-space-6 shadow-md z-10">
              <div className="flex items-center gap-space-3 mb-space-4">
                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">lock_clock</span>
                </div>
                <div>
                  <span className="font-title-md text-title-md font-bold block text-primary">Escrow Trust Release</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">Biometric 4-Digit PIN Handshake</span>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-4">
                Your payment is held safely by the Cooperative Custodian until the worker completes the task and you verbally share the one-time job completion code.
              </p>
              <div className="p-space-3 bg-surface-container-low rounded-lg flex items-center justify-between text-xs font-bold text-on-surface">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">security</span> Instant Dispute Arbitration
                </span>
                <span className="text-secondary-container">Learn More</span>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Banner with Safety Ratings */}
        <section className="w-full max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-12 mb-space-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4 mb-space-8">
            <div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-bold tracking-wider">
                Patron Experiences
              </span>
              <h2 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary font-bold">
                Trusted by over 45,000 households
              </h2>
            </div>
            <div className="flex items-center gap-space-2 bg-surface-container-low px-space-4 py-space-2 rounded-full">
              <div className="flex text-secondary">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span key={s} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                ))}
              </div>
              <span className="font-label-lg text-label-lg font-bold text-on-surface">4.89 / 5.0 Global Rating</span>
            </div>
          </div>

          {/* Testimonial Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
            {testimonials.map((review) => (
              <div
                key={review.name}
                className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-space-4">
                    <div className="flex text-secondary">
                      {[1, 2, 3, 4].map((s) => (
                        <span key={s} className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          star
                        </span>
                      ))}
                      <span
                        className="material-symbols-outlined text-[16px]"
                        style={{ fontVariationSettings: review.stars === 5 ? "'FILL' 1" : "'FILL' 0" }}
                      >
                        {review.stars === 5 ? "star" : "star_half"}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-tertiary flex items-center gap-1 font-bold">
                      <span className="material-symbols-outlined text-[14px]">verified</span> Verified Booking
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface italic mb-space-6">{review.quote}</p>
                </div>
                <div className="flex items-center gap-space-3 pt-space-4 border-t border-surface-container">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center font-bold text-primary">
                    {review.initials}
                  </div>
                  <div>
                    <span className="font-title-md text-title-md font-bold block text-on-surface">{review.name}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{review.location}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom Interactive Cooperative Callout Strip */}
        <section className="w-full bg-surface-container py-space-8 mb-0">
          <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop flex flex-col sm:flex-row items-center justify-between gap-space-4">
            <div className="flex items-center gap-space-3">
              <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
              </span>
              <div>
                <span className="font-title-md text-title-md font-bold text-primary block">
                  Are you a skilled domestic or home maintenance worker?
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Join 14,800+ equals. Receive health coverage, democratic share equity, and daily payouts.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigate?.("register")}
              className="px-space-6 py-space-2.5 bg-primary text-on-primary font-label-md text-label-md rounded-xl hover:bg-primary-container active:scale-98 transition-all shrink-0 font-bold border-none cursor-pointer"
            >
              Register as Worker-Owner
            </button>
          </div>
        </section>
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
