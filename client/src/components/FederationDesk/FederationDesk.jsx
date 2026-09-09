import React, { useState } from "react";
import { showToast } from "../../toast";
import AdminDashboard from "../AdminDashboard/AdminDashboard";
import { DEFAULT_MALE_AVATAR, DEFAULT_FEMALE_AVATAR } from "../../assets/avatars";

export default function FederationDesk({ onNavigate }) {
  const [activeTab, setActiveTab] = useState("charter"); // 'charter' | 'operations'
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const handleDownloadBylaws = () => {
    showToast("Downloading GigConnect Federation Constitution & Bylaws (PDF)...");
  };

  const handleSahayataClick = () => {
    showToast("24x7 Cooperative Sahayata Hotline: 1800-GIG-COOP (Toll Free) or chat with ward steward.");
  };

  const directors = [
    {
      name: "Rameshwar K. Sharma",
      tenure: "4 Yrs",
      role: "Plumber Guild Rep & Federation Trustee",
      desc: "Master pipefitter with 22 years of trade practice. Spearheaded the National Emergency Tool Replacement Guarantee and pension endowment program.",
      mandate: "4,200 Votes",
      zone: "Western Zone",
      badge: "Director • Board Member",
      img: DEFAULT_MALE_AVATAR,
    },
    {
      name: "Kavita S. Murthy",
      tenure: "3 Yrs",
      role: "Cleaners Union Rep & Welfare Chair",
      desc: "Pioneered maternity grants and domestic worker wage normalization across southern metro hubs. Oversees the 50/50 customer-worker grievance council.",
      mandate: "5,850 Votes",
      zone: "Southern Metro Zone",
      badge: "Vice President • Federation",
      img: DEFAULT_FEMALE_AVATAR,
    },
    {
      name: "Arun K. Sen",
      tenure: "2 Yrs",
      role: "Electricians Collective Steward",
      desc: "Master industrial wireman with high-voltage certification. Championed cooperative safety standards, subsidized insulated tool purchases, and apprentice programs.",
      mandate: "3,920 Votes",
      zone: "Eastern Zone",
      badge: "Director • Board Member",
      img: DEFAULT_MALE_AVATAR,
    },
  ];

  const faqs = [
    {
      q: "What makes a cooperative platform different from standard venture-backed gig apps?",
      a: "Standard gig platforms extract 20% to 35% commission to maximize returns for outside shareholders, while using opaque algorithms to suppress pay and prevent collective bargaining. In GigConnect, the platform is registered under the Multi-State Co-operative Societies Act. Workers own voting shares, pay an audited flat cost-recovery fee (8%), and all annual operating surpluses are rebated back to member workers as dividends.",
    },
    {
      q: "How are customer dispute claims handled fairly without algorithmic penalties?",
      a: "When a booking conflict arises, client funds remain protected in Escrow Trust. Instead of auto-blocking workers, the matter is assigned to a ward-level peer mediation tribunal with one customer advocate and one experienced trade steward. Workers are granted 48 hours to provide documentation or photographic proof. Over 94% of cases achieve mutual amicable settlement without punitive markdowns.",
    },
    {
      q: "Can existing local trade associations or informal unions affiliate with GigConnect?",
      a: "Yes. Any registered trade union, self-help group (SHG), or informal mohalla workers collective with 10 or more members can affiliate as a chartered guild unit. Affiliation provides collective digital dispatch tools, mutual health fund coverage, and direct seat allocations in the regional electoral college.",
    },
  ];

  return (
    <div className="w-full bg-surface text-on-surface antialiased min-h-screen">
      {/* Optional Mode Toggle bar: Federation Charter vs Live Ops Dashboard */}
      <div className="bg-surface-container-low border-b border-border-tone/40 py-2 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-max-content-width mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-secondary">gavel</span>
            <span className="font-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              Federation Portal Mode
            </span>
          </div>
          <div className="inline-flex p-1 bg-surface-container rounded-full gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("charter")}
              className={`px-3 py-1 rounded-full font-label-md text-label-md border-none cursor-pointer transition-all ${
                activeTab === "charter"
                  ? "bg-primary text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface bg-transparent"
              }`}
            >
              Charter & Governance
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("operations")}
              className={`px-3 py-1 rounded-full font-label-md text-label-md border-none cursor-pointer transition-all ${
                activeTab === "operations"
                  ? "bg-primary text-on-primary font-bold shadow-sm"
                  : "text-on-surface-variant hover:text-on-surface bg-transparent"
              }`}
            >
              Operations & Verification
            </button>
          </div>
        </div>
      </div>

      {activeTab === "operations" ? (
        <div className="max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-6">
          <AdminDashboard />
        </div>
      ) : (
        <div className="relative w-full overflow-hidden">
          {/* Subtle Ambient Corner Grid Motifs */}
          <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none opacity-[0.04] text-primary-container z-0 select-none">
            <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 200 200">
              <pattern id="jaali-grid-tr" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 20 M 0 0 L 20 20" />
                <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              </pattern>
              <rect width="200" height="200" fill="url(#jaali-grid-tr)" />
            </svg>
          </div>
          <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-[0.04] text-primary-container z-0 select-none">
            <svg className="w-full h-full" fill="none" stroke="currentColor" strokeWidth="1.2" viewBox="0 0 200 200">
              <pattern id="jaali-grid-bl" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 20 M 0 0 L 20 20" />
                <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="0.8" />
              </pattern>
              <rect width="200" height="200" fill="url(#jaali-grid-bl)" />
            </svg>
          </div>

          {/* Header Section */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop pt-space-12 pb-space-8 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-space-2 px-space-4 py-space-1 bg-secondary-fixed text-on-secondary-fixed rounded-full mb-space-4 shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">account_balance</span>
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                Democratic Governance & Charter
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-primary max-w-3xl mb-space-4 font-bold tracking-tight">
              The Federation Desk: How Our Cooperative Works
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl text-center">
              GigConnect is owned 100% by its member tradespeople and domestic workers. Here is how governance, dispute resolution, and fair pay are democratically managed.
            </p>

            {/* Live Governance Ticker / Pill Strip */}
            <div className="mt-space-8 flex flex-wrap items-center justify-center gap-space-4 py-space-2 px-space-6 bg-surface-container-lowest rounded-full shadow-sm border border-border-tone/40">
              <div className="flex items-center gap-space-2">
                <span className="w-2.5 h-2.5 rounded-full bg-tertiary-fixed-dim animate-pulse" />
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Federation Assembly Cycle: <strong className="text-primary font-bold">Q2 Voting Active</strong>
                </span>
              </div>
              <span className="text-outline-variant">•</span>
              <div className="flex items-center gap-space-1 text-on-surface-variant font-label-md text-label-md">
                <span className="material-symbols-outlined text-[16px] text-secondary">how_to_vote</span>
                <span>
                  Quorum Reached: <strong className="text-primary font-bold">89.4%</strong>
                </span>
              </div>
              <span className="text-outline-variant">•</span>
              <div className="flex items-center gap-space-1 text-on-surface-variant font-label-md text-label-md">
                <span className="material-symbols-outlined text-[16px] text-primary-container">gavel</span>
                <span>
                  Charter Version: <strong className="text-primary font-bold">4.2 (Ratified 2024)</strong>
                </span>
              </div>
            </div>
          </section>

          {/* Key Metrics / Stat Callout Grid */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-6">
              {/* Stat 1 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-tone/40">
                <div className="flex items-center justify-between mb-space-4">
                  <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-bold">
                    Guild Ecosystem
                  </span>
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-[20px]">groups_3</span>
                  </div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-primary tracking-tight mb-space-1 font-bold">
                    128
                  </div>
                  <div className="font-title-md text-title-md text-on-surface font-semibold mb-space-1">
                    Member Guilds
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Local trade unions and worker collectives across 14 cities
                  </p>
                </div>
              </div>

              {/* Stat 2 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-tone/40">
                <div className="flex items-center justify-between mb-space-4">
                  <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-bold">
                    Shared Ownership
                  </span>
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[20px]">badge</span>
                  </div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-secondary tracking-tight mb-space-1 font-bold">
                    14,800+
                  </div>
                  <div className="font-title-md text-title-md text-on-surface font-semibold mb-space-1">
                    Worker-Owners
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Equal voting shareholders with one member, one vote policy
                  </p>
                </div>
              </div>

              {/* Stat 3 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-tone/40">
                <div className="flex items-center justify-between mb-space-4">
                  <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-bold">
                    Direct Payouts
                  </span>
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary-container">
                    <span className="material-symbols-outlined text-[20px]">payments</span>
                  </div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-primary tracking-tight mb-space-1 font-bold">
                    ₹42.6 Cr
                  </div>
                  <div className="font-title-md text-title-md text-on-surface font-semibold mb-space-1">
                    Direct Earnings
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    92% client payments distributed directly, 0% platform extraction
                  </p>
                </div>
              </div>

              {/* Stat 4 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-tone/40">
                <div className="flex items-center justify-between mb-space-4">
                  <span className="font-label-sm text-label-sm uppercase tracking-wide text-on-surface-variant font-bold">
                    Social Security Net
                  </span>
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-tertiary-container">
                    <span className="material-symbols-outlined text-[20px]">health_and_safety</span>
                  </div>
                </div>
                <div>
                  <div className="font-headline-lg text-headline-lg text-primary tracking-tight mb-space-1 font-bold">
                    ₹3.8 Cr
                  </div>
                  <div className="font-title-md text-title-md text-on-surface font-semibold mb-space-1">
                    Mutual Welfare Fund
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Community emergency healthcare, accident insurance, and pensions
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Cooperative Principles & Governance Pillars */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-8 gap-space-4">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                  The Tripartite Guarantee
                </span>
                <h2 className="font-headline-md text-headline-md text-primary mt-space-1 font-bold">
                  Cooperative Principles & Core Pillars
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Unlike investor-owned aggregator apps, federation rules cannot be altered unilaterally. Every protocol is drafted, debated, and affirmed by working members.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
              {/* Pillar 1 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all border border-border-tone/40">
                <div className="flex flex-col gap-space-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 bg-surface-container text-primary font-label-sm text-label-sm rounded-full font-semibold">
                      <span className="material-symbols-outlined text-[14px]">ballot</span>
                      Elected Representation
                    </span>
                    <span className="font-headline-md text-headline-md text-outline-variant font-bold">01</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-space-2">
                    <span className="material-symbols-outlined text-[28px]">hub</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Democratic Worker Councils
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Monthly chapter meetings at municipal ward centers give every trade guild legislative control. Trade stewards are elected annually to review algorithm changes, surge parameters, and working hours.
                  </p>
                  <ul className="flex flex-col gap-space-2 pt-space-2 text-on-surface font-body-sm text-body-sm list-none p-0">
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Ward-level grievance chapters</span>
                    </li>
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>One-Member, One-Vote constitutional parity</span>
                    </li>
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Open algorithmic auditing ledger</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-6 pt-space-4 bg-surface-container-low p-space-4 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Recent Resolution:
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface font-medium">
                    #GC-2024-88: Heatwave safety pause stipends approved unanimously across 14 cities.
                  </p>
                </div>
              </div>

              {/* Pillar 2 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all border border-border-tone/40">
                <div className="flex flex-col gap-space-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 bg-surface-container text-secondary font-label-sm text-label-sm rounded-full font-semibold">
                      <span className="material-symbols-outlined text-[14px]">money_off</span>
                      Zero Commission Policy
                    </span>
                    <span className="font-headline-md text-headline-md text-outline-variant font-bold">02</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary mb-space-2">
                    <span className="material-symbols-outlined text-[28px]">calculate</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Fair-Pay Standard & Living Wage Formula
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Rates are governed by cost-of-living data rather than exploitative market auctioning. Formulas integrate local inflation indices, tool amortization, round-trip transit allowances, and statutory dignified wage floors.
                  </p>
                  <ul className="flex flex-col gap-space-2 pt-space-2 text-on-surface font-body-sm text-body-sm list-none p-0">
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Transparent hourly base wage indices</span>
                    </li>
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>8% federation operational fee (flat, capped)</span>
                    </li>
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Direct daily settlement to UPI/Jan Dhan bank accounts</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-6 pt-space-4 bg-surface-container-low p-space-4 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                      Take-home Ratio vs Tech Aggregators
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-bold">92% vs 65%</span>
                  </div>
                  <div className="w-full h-2 bg-surface-container-highest rounded-full overflow-hidden">
                    <div className="h-full bg-secondary-container rounded-full" style={{ width: "92%" }} />
                  </div>
                </div>
              </div>

              {/* Pillar 3 */}
              <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm flex flex-col justify-between relative group hover:shadow-md transition-all border border-border-tone/40">
                <div className="flex flex-col gap-space-4">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-space-1 px-space-3 py-space-1 bg-surface-container text-tertiary font-label-sm text-label-sm rounded-full font-semibold">
                      <span className="material-symbols-outlined text-[14px]">balance</span>
                      Impartial Mediation
                    </span>
                    <span className="font-headline-md text-headline-md text-outline-variant font-bold">03</span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container mb-space-2">
                    <span className="material-symbols-outlined text-[28px]">gavel</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                    Peer-Review Quality & Safety Oversight
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    No robotic deactivations. Grievances and dispute redresses are assessed by a bipartisan bench composed equally of 50% veteran master tradespeople and 50% customer council ombudsmen.
                  </p>
                  <ul className="flex flex-col gap-space-2 pt-space-2 text-on-surface font-body-sm text-body-sm list-none p-0">
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Zero arbitrary star-rating algorithmic bans</span>
                    </li>
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Right-to-be-heard peer arbitration process</span>
                    </li>
                    <li className="flex items-center gap-space-2">
                      <span className="material-symbols-outlined text-tertiary-container text-[18px]">check_circle</span>
                      <span>Federation upskilling & master mentorship</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-space-6 pt-space-4 bg-surface-container-low p-space-4 rounded-lg">
                  <span className="font-label-sm text-label-sm text-on-surface-variant block mb-1 font-bold">
                    Redress Resolution Time:
                  </span>
                  <p className="font-body-sm text-body-sm text-on-surface font-medium">
                    Under 24 hours with written findings shared with both parties.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Governance Flow Visualization */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-6">
            <div className="bg-primary text-on-primary rounded-xl p-space-8 relative overflow-hidden shadow-md">
              <div className="absolute -right-12 -bottom-12 w-64 h-64 opacity-10 pointer-events-none">
                <svg className="w-full h-full" fill="currentColor" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" />
                </svg>
              </div>
              <div className="max-w-2xl mb-space-8">
                <span className="font-label-sm text-label-sm text-primary-fixed uppercase tracking-wider font-bold">
                  Democratic Flow
                </span>
                <h3 className="font-headline-md text-headline-md text-on-primary mt-space-1 font-bold">
                  How Resolutions Turn Into Policy
                </h3>
                <p className="font-body-md text-body-md text-on-primary-container mt-space-2">
                  Every policy initiative originates on the ground with trade workers, undergoes committee impact modeling, and is ratified by universal membership ballot.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
                <div className="bg-surface-container-lowest/10 p-space-4 rounded-lg backdrop-blur-sm">
                  <div className="font-headline-sm text-headline-sm text-secondary-fixed mb-space-1 font-bold">Step 1</div>
                  <div className="font-title-md text-title-md font-semibold text-on-primary mb-space-1">Guild Motion</div>
                  <p className="font-body-sm text-body-sm text-on-primary-container">
                    At least 25 members co-sign a procedural improvement or price floor request.
                  </p>
                </div>
                <div className="bg-surface-container-lowest/10 p-space-4 rounded-lg backdrop-blur-sm">
                  <div className="font-headline-sm text-headline-sm text-secondary-fixed mb-space-1 font-bold">Step 2</div>
                  <div className="font-title-md text-title-md font-semibold text-on-primary mb-space-1">Impact Study</div>
                  <p className="font-body-sm text-body-sm text-on-primary-container">
                    Financial auditors and labor economists evaluate feasibility within 14 working days.
                  </p>
                </div>
                <div className="bg-surface-container-lowest/10 p-space-4 rounded-lg backdrop-blur-sm">
                  <div className="font-headline-sm text-headline-sm text-secondary-fixed mb-space-1 font-bold">Step 3</div>
                  <div className="font-title-md text-title-md font-semibold text-on-primary mb-space-1">Universal Ballot</div>
                  <p className="font-body-sm text-body-sm text-on-primary-container">
                    Secure mobile SMS & Aadhaar OTP ballot open to all active verified members.
                  </p>
                </div>
                <div className="bg-surface-container-lowest/10 p-space-4 rounded-lg backdrop-blur-sm">
                  <div className="font-headline-sm text-headline-sm text-secondary-fixed mb-space-1 font-bold">Step 4</div>
                  <div className="font-title-md text-title-md font-semibold text-on-primary mb-space-1">App Implementation</div>
                  <p className="font-body-sm text-body-sm text-on-primary-container">
                    Platform engineering team writes approved rules into the production dispatch engine.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Federation Board & Leadership Snapshot */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-space-8 gap-space-4">
              <div>
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                  Worker Directorship
                </span>
                <h2 className="font-headline-md text-headline-md text-primary mt-space-1 font-bold">
                  Federation Board & Leadership Snapshot
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                Elected worker directors hold 60% of the federation board voting seats, ensuring executive compensation and technical decisions remain subservient to worker prosperity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
              {directors.map((dir, idx) => (
                <div
                  key={idx}
                  className="bg-surface-container-lowest rounded-xl p-space-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between border border-border-tone/40"
                >
                  <div>
                    <div className="relative w-full h-56 rounded-lg overflow-hidden mb-space-4 bg-surface-container">
                      <img
                        className="w-full h-full object-cover"
                        src={dir.img}
                        alt={dir.name}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                            dir.name
                          )}&background=0e4d64&color=ffffff&size=256`;
                        }}
                      />
                      <div className="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-space-3 py-space-1 rounded-full flex items-center gap-space-1 shadow-sm">
                        <span className="material-symbols-outlined text-[14px] text-tertiary-container">
                          verified
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                          {dir.badge}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-space-1">
                      <h3 className="font-title-md text-title-md text-primary font-bold">{dir.name}</h3>
                      <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">
                        Tenure: {dir.tenure}
                      </span>
                    </div>
                    <p className="font-label-md text-label-md text-secondary font-semibold mb-space-3">
                      {dir.role}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-4 leading-relaxed">
                      {dir.desc}
                    </p>
                  </div>
                  <div className="pt-space-4 bg-surface-container-low p-space-3 rounded-lg flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-medium">
                      Mandate: {dir.mandate}
                    </span>
                    <span className="font-label-sm text-label-sm text-primary font-bold">
                      {dir.zone}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Interactive Charter Inquiries Accordion */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-6">
            <div className="bg-surface-container-lowest rounded-xl p-space-8 shadow-sm border border-border-tone/40">
              <div className="mb-space-6">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                  Frequently Asked Inquiries
                </span>
                <h3 className="font-headline-sm text-headline-sm text-primary mt-space-1 font-bold">
                  Frequently Examined Federation Bylaws
                </h3>
              </div>
              <div className="flex flex-col gap-space-3">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaq === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-surface-container-low rounded-lg p-space-4 cursor-pointer transition-all border border-border-tone/30"
                      onClick={() => toggleFaq(idx)}
                    >
                      <div className="flex items-center justify-between font-title-md text-title-md text-primary font-semibold select-none">
                        <span>{faq.q}</span>
                        <span
                          className={`material-symbols-outlined transition-transform duration-200 text-primary-container ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        >
                          expand_more
                        </span>
                      </div>
                      {isOpen && (
                        <p className="mt-space-3 font-body-md text-body-md text-on-surface-variant leading-relaxed pt-2 border-t border-border-tone/20">
                          {faq.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Bottom CTA Card */}
          <section className="relative z-10 max-w-max-content-width mx-auto px-margin-mobile md:px-margin-desktop py-space-12">
            <div className="rounded-2xl bg-surface-container-low p-space-8 md:p-space-12 text-center flex flex-col items-center justify-center gap-space-4 shadow-sm relative overflow-hidden border border-border-tone/40">
              {/* Subtle internal emblem */}
              <div className="w-14 h-14 rounded-full bg-surface-container-lowest flex items-center justify-center text-primary-container mb-space-1 shadow-sm">
                <span className="material-symbols-outlined text-[32px]">handshake</span>
              </div>
              <h3 className="font-headline-md text-headline-md text-primary max-w-xl font-bold">
                Are you a trade worker or collective looking to join the federation?
              </h3>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl text-center leading-relaxed">
                Bring your guild or register as an individual master worker today. Free onboarding, mutual insurance coverage, and zero predatory commissions.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-space-4 mt-space-4 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => onNavigate("register")}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-space-2 px-space-6 py-space-3 bg-secondary-container text-on-secondary font-label-lg text-label-lg rounded-full shadow-md hover:shadow-lg hover:opacity-95 active:scale-95 transition-all font-bold border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">how_to_reg</span>
                  <span>Register as a Worker-Owner</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadBylaws}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-space-2 px-space-6 py-space-3 bg-surface-container-lowest text-primary-container font-label-lg text-label-lg rounded-full shadow-sm hover:bg-surface-container transition-all font-bold border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  <span>Download Cooperative Bylaws (PDF)</span>
                </button>
              </div>
              {/* Compliance & Regulatory Note */}
              <div className="flex items-center gap-space-2 mt-space-4 text-on-surface-variant font-label-sm text-label-sm font-medium">
                <span className="material-symbols-outlined text-[16px] text-tertiary-container">verified_user</span>
                <span>Registered under the Multi-State Co-operative Societies Act 2002 • Certificate #MSCS/CR/2024/701</span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
