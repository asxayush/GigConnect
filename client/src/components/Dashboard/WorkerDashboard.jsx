import React, { useState, useEffect } from "react";
import axios from "axios";
import { showToast } from "../../toast";

export default function WorkerDashboard({ onNavigate }) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");

  const [incomingJobs, setIncomingJobs] = useState([
    {
      id: "job_1",
      customerName: "Priyanka Sen",
      location: "Connaught Place, New Delhi",
      distance: "1.4 km",
      jobType: "Plumbing Repair",
      payout: "₹600",
      urgency: "Immediate",
    },
    {
      id: "job_2",
      customerName: "Anand Raghavan",
      location: "DLF Phase 2, Gurugram",
      distance: "3.2 km",
      jobType: "Electrical Inspection",
      payout: "₹800",
      urgency: "Scheduled (2:00 PM)",
    },
  ]);

  // Fetch Wallet Balance
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
        const user = JSON.parse(localStorage.getItem("gig_user") || "{}");
        const res = await axios.get("http://localhost:4000/api/payments/wallet", {
          params: { workerId: user.id || user._id },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.data?.data?.walletBalance !== undefined) {
          setWalletBalance(res.data.data.walletBalance);
        }
      } catch {
        // Default to ₹0.00
      }
    };
    fetchBalance();
  }, []);

  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || amount > walletBalance) {
      showToast("Enter a valid withdrawal amount up to your balance.");
      return;
    }

    setIsWithdrawing(true);
    try {
      const token = localStorage.getItem("gig_token") || localStorage.getItem("gigconnect_token");
      const user = JSON.parse(localStorage.getItem("gig_user") || "{}");
      const res = await axios.post(
        "http://localhost:4000/api/payments/withdraw",
        { workerId: user.id || user._id, amount },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      setWalletBalance(res.data?.data?.remainingBalance ?? Math.max(0, walletBalance - amount));
      setShowWithdrawModal(false);
      setWithdrawAmount("");
      showToast(res.data?.message || `₹${amount} withdrawn to bank account.`);
    } catch (err) {
      showToast(err.response?.data?.message || "Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleAcceptJob = (jobId) => {
    setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId));
    showToast("Job accepted! Customer notified.");
  };

  const handleDeclineJob = (jobId) => {
    setIncomingJobs((prev) => prev.filter((j) => j.id !== jobId));
    showToast("Job declined.");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0A2540] tracking-tight">Professional Portal</h1>
        <p className="text-sm text-slate-500 mt-1">Manage incoming requests, payouts, and equipment rentals.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT 2 COLS: Incoming Jobs Queue */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#0A2540]">Incoming Job Requests</h2>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
              {incomingJobs.length} New
            </span>
          </div>

          {incomingJobs.length === 0 ? (
            <div className="p-12 rounded-2xl border border-slate-200 bg-white text-center">
              <span className="material-symbols-outlined text-4xl text-slate-300">done_all</span>
              <p className="text-sm font-semibold text-slate-700 mt-2">All requests cleared</p>
              <p className="text-xs text-slate-400 mt-0.5">New job alerts will appear here in real-time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {incomingJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-slate-300 bg-white transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#0A2540] px-2 py-0.5 rounded bg-slate-100">
                        {job.jobType}
                      </span>
                      <span className="text-xs text-slate-400">• {job.distance}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{job.customerName}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <span className="material-symbols-outlined text-sm text-slate-400">location_on</span>
                      <span>{job.location}</span>
                    </div>
                    <div className="text-xs font-semibold text-emerald-700 pt-1">
                      Direct Payout: <span className="font-extrabold">{job.payout}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDeclineJob(job.id)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAcceptJob(job.id)}
                      className="px-5 py-2.5 rounded-xl bg-[#0A2540] hover:bg-[#071b30] text-white text-xs font-semibold transition-colors cursor-pointer border-none"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT COL: The Wallet & Action Hub */}
        <div className="space-y-6">
          
          {/* SECTION A: THE WALLET */}
          <div className="p-6 rounded-3xl bg-[#0A2540] text-white shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Cooperative Wallet</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <div>
              <p className="text-xs text-slate-300">Available Balance</p>
              <h2 className="text-4xl font-extrabold tracking-tight mt-1">
                ₹{walletBalance.toFixed(2)}
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowWithdrawModal(true)}
              disabled={walletBalance <= 0}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 text-[#0A2540] font-bold text-xs transition-colors cursor-pointer border-none disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">account_balance</span>
              <span>Withdraw to Bank</span>
            </button>
          </div>

          {/* SECTION B: ACTION HUB — P2P TOOL BANK */}
          <div
            onClick={() => onNavigate("tool-bank")}
            className="p-6 rounded-3xl border border-slate-200 hover:border-slate-300 bg-white shadow-xs cursor-pointer group transition-all"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">construction</span>
            </div>
            <h3 className="text-base font-bold text-[#0A2540] group-hover:text-amber-600 transition-colors">
              Rent from Tool Bank
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Access certified power drills, pressure washers, and master tools rented directly from local customers at zero markup.
            </p>
            <div className="mt-4 flex items-center gap-1 text-xs font-bold text-[#0A2540]">
              <span>Explore Available Tools</span>
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* WITHDRAW MODAL */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#0A2540]">Withdraw to Bank</h3>
              <button
                type="button"
                onClick={() => setShowWithdrawModal(false)}
                className="text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0"
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Transfer funds instantly via Jan Dhan UPI to your registered cooperative bank account.
            </p>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  max={walletBalance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ₹${walletBalance}`}
                  autoFocus
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A2540] text-sm font-semibold outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={isWithdrawing}
                className="w-full py-3 bg-[#0A2540] hover:bg-[#071b30] text-white font-semibold text-xs rounded-xl transition-colors border-none cursor-pointer"
              >
                {isWithdrawing ? "Processing..." : "Confirm Withdrawal"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
