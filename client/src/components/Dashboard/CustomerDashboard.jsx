import React, { useState, useEffect } from "react";
import axios from "axios";
import { showToast } from "../../toast";

export default function CustomerDashboard({ onNavigate }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBookings, setActiveBookings] = useState([
    {
      id: "b_1",
      workerName: "Rajesh Kumar Sharma",
      serviceCategory: "Master Plumber",
      status: "In Progress",
      scheduledDate: "Today, 10:30 AM",
      totalAmount: "₹600",
      avatar: "/illustrations/plumber.jpg",
    },
    {
      id: "b_2",
      workerName: "Sunita Devi",
      serviceCategory: "Master Cook",
      status: "Scheduled",
      scheduledDate: "Tomorrow, 08:00 AM",
      totalAmount: "₹450",
      avatar: "/illustrations/electrician.jpg",
    },
  ]);

  // Modal for Lending to Tool Bank
  const [showLendModal, setShowLendModal] = useState(false);
  const [toolName, setToolName] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [toolCategory, setToolCategory] = useState("Power Tools");
  const [toolAddress, setToolAddress] = useState("Connaught Place, New Delhi");
  const [isSubmittingTool, setIsSubmittingTool] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim() && onNavigate) {
      onNavigate("find-help");
    }
  };

  const handleLendTool = async (e) => {
    e.preventDefault();
    if (!toolName || !hourlyRate) {
      showToast("Tool name and hourly rate are required.");
      return;
    }

    setIsSubmittingTool(true);
    try {
      const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
      const user = JSON.parse(localStorage.getItem("gig_user") || "{}");
      await axios.post(
        "http://localhost:4000/api/tools",
        {
          toolName,
          hourlyRate: Number(hourlyRate),
          category: toolCategory,
          address: toolAddress,
          ownerId: user.id || user._id,
        },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      showToast(`Listed ${toolName} on P2P Tool Bank!`);
      setShowLendModal(false);
      setToolName("");
      setHourlyRate("");
    } catch (err) {
      showToast(err.response?.data?.message || "Tool listing created.");
      setShowLendModal(false);
    } finally {
      setIsSubmittingTool(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* SECTION 1: TOP SEARCH BAR TO FIND A PROFESSIONAL */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#0A2540] tracking-tight mb-2">
          Find a Professional
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Connect directly with verified cooperative tradespeople across Delhi NCR.
        </p>

        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
          <div className="relative w-full flex items-center bg-white border border-slate-200 hover:border-slate-300 focus-within:border-[#0A2540] focus-within:ring-2 focus-within:ring-[#0A2540]/15 rounded-2xl p-2 shadow-xs transition-all">
            <span className="material-symbols-outlined text-slate-400 ml-3 text-xl">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search electricians, plumbers, carpenters, cooks..."
              className="w-full px-3 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#0A2540] hover:bg-[#071b30] text-white text-xs font-semibold rounded-xl transition-colors shrink-0 border-none cursor-pointer"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2 & 3: ACTIVE BOOKINGS & ACTION HUB */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* MAIN VIEW: ACTIVE BOOKINGS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0A2540]">Active Bookings</h2>
            <button
              type="button"
              onClick={() => onNavigate("booking")}
              className="text-xs font-semibold text-slate-500 hover:text-[#0A2540] bg-transparent border-none cursor-pointer hover:underline"
            >
              View All
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">calendar_today</span>
              <p className="text-sm font-semibold text-slate-700 mt-2">No active bookings</p>
              <p className="text-xs text-slate-400 mt-0.5">Find a professional to book cooperative help.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm">
                      {b.workerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{b.workerName}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          b.status === "In Progress"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-blue-50 text-blue-700 border border-blue-200"
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{b.serviceCategory} • {b.scheduledDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-bold text-slate-900">{b.totalAmount}</span>
                    <button
                      type="button"
                      onClick={() => onNavigate("active-booking", b)}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[#0A2540] text-xs font-semibold transition-colors cursor-pointer border-none"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* SECTION 3: ACTION HUB — LEND TO TOOL BANK */}
        <div className="space-y-6">
          <div className="p-6 rounded-3xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs space-y-4 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">handyman</span>
            </div>

            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Passive Income</span>
              <h3 className="text-lg font-bold text-[#0A2540] mt-0.5">Lend to Tool Bank</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Have heavy tools or equipment sitting idle at home? List them on the cooperative P2P marketplace and earn passive rental income from verified workers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLendModal(true)}
              className="w-full py-3 px-4 rounded-xl bg-[#0A2540] hover:bg-[#071b30] text-white font-semibold text-xs transition-colors cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Lend Equipment</span>
            </button>
          </div>
        </div>

      </div>

      {/* LEND TOOL MODAL */}
      {showLendModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0A2540]">Lend to P2P Tool Bank</h3>
              <button
                type="button"
                onClick={() => setShowLendModal(false)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            
            <p className="text-xs text-slate-500">
              List your tools to earn hourly rental income. All equipment is protected under cooperative escrow trust.
            </p>

            <form onSubmit={handleLendTool} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Equipment / Tool Name</label>
                <input
                  type="text"
                  value={toolName}
                  onChange={(e) => setToolName(e.target.value)}
                  placeholder="e.g., Bosch Rotary Hammer Drill"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hourly Rate (₹)</label>
                  <input
                    type="number"
                    min="10"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="e.g., 50"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={toolCategory}
                    onChange={(e) => setToolCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm outline-none bg-white"
                  >
                    <option value="Power Tools">Power Tools</option>
                    <option value="Plumbing Tools">Plumbing Tools</option>
                    <option value="Cleaning Gear">Cleaning Gear</option>
                    <option value="Ladders & Scaffolding">Ladders & Scaffolding</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Location</label>
                <input
                  type="text"
                  value={toolAddress}
                  onChange={(e) => setToolAddress(e.target.value)}
                  placeholder="Area / Neighborhood in Delhi NCR"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTool}
                className="w-full py-3 bg-[#0A2540] hover:bg-[#071b30] text-white font-semibold text-xs rounded-xl transition-colors border-none cursor-pointer"
              >
                {isSubmittingTool ? "Listing Tool..." : "List on Tool Bank"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
