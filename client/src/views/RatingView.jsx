import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { submitRating } from "../api";
import { showToast } from "../toast";
import { DEFAULT_FEMALE_AVATAR } from "../assets/avatars";

export default function RatingView({ booking, onNavigate }) {
  const activeBooking = booking || {
    id: "GC-88421",
    serviceCategory: "Full Home Deep Cleaning & Sanitization",
    price: 1499,
    worker: {
      id: "w-sunita-devi",
      name: "Sunita Devi",
      role: "Lead Sanitation Specialist & Guild Steward",
      sakhiVerified: true,
      image: DEFAULT_FEMALE_AVATAR,
    },
  };

  const isSakhi = Boolean(activeBooking.worker?.sakhiVerified || activeBooking.worker?.isSakhiVerified);

  const [stars, setStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState(["Safe & Respectful", "Master Workmanship"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseStats, setResponseStats] = useState(null);

  const qualityTags = [
    "Safe & Respectful",
    "On-Time Arrival",
    "Master Workmanship",
    "Fair Living Wage Tariff",
    "♀ Sakhi Trust Compliant",
    "Clean & Sanitized Worksite",
    "Accurate Diagnostic",
  ];

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const getStarLabel = (rating) => {
    switch (rating) {
      case 5:
        return "5.0 — Outstanding & Exemplary Workmanship";
      case 4:
        return "4.0 — Very Good & Reliable Service";
      case 3:
        return "3.0 — Satisfactory / Standard Execution";
      case 2:
        return "2.0 — Subpar / Requires Federation Quality Audit";
      case 1:
        return "1.0 — Safety or Severe Quality Issue (Emergency Review)";
      default:
        return "";
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("gigconnect_token");
      const payload = {
        bookingId: activeBooking.id || activeBooking._id,
        workerId: activeBooking.worker?.id || activeBooking.worker?._id,
        stars,
        safetyRating: stars,
        comment,
        tags: selectedTags,
      };

      const result = await submitRating(payload, token);
      setResponseStats(result?.data);
      setIsSuccess(true);
      showToast(
        stars < 3
          ? "Low rating logged: Federation Desk mediation initiated."
          : "Thank you! Feedback recorded & worker ownership rewarded."
      );
    } catch (err) {
      showToast("Failed to submit review: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#090d16] text-[#e6edf3] font-sans antialiased py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl">
        
        {/* SUCCESS STATE */}
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#161b22] border border-[#30363d] rounded-2xl p-8 text-center shadow-2xl"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight m-0">
              Cooperative Review Recorded
            </h2>

            <p className="text-sm text-[#8b949e] mt-2 max-w-md mx-auto leading-relaxed">
              Your feedback directly updates{" "}
              <strong className="text-white">{activeBooking.worker?.name}&apos;s</strong> verified profile
              and determines annual guild bonus allocations.
            </p>

            {/* Federation Audit Callout if < 3 stars */}
            {stars < 3 ? (
              <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-4 my-6 text-left flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-400 text-[22px] shrink-0 mt-0.5">
                  policy
                </span>
                <div className="text-xs text-amber-200 leading-relaxed">
                  <strong className="block text-amber-300 font-bold mb-1">
                    Federation Desk Mediation Initiated
                  </strong>
                  Because this job was rated under 3 stars, our Ward Quality Steward will review the job logs and reach out within 24 hours. No arbitrary account bans are issued; workers undergo peer-led upskilling.
                </div>
              </div>
            ) : (
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 my-6 text-left flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#8b949e] block font-bold">
                    Updated Worker Score
                  </span>
                  <span className="text-base font-extrabold text-white">
                    ★ {responseStats?.newRatingAvg || 4.96} / 5.0
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                  Escrow Settled (95%)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => onNavigate("booking")}
                className="w-full py-3 bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs rounded-xl border border-[#30363d] transition-all cursor-pointer"
              >
                View My Bookings
              </button>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="w-full py-3 bg-[#003548] hover:bg-[#0e4d64] text-[#bfe8ff] font-bold text-xs rounded-xl border border-[#bfe8ff]/30 shadow-lg transition-all cursor-pointer"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        ) : (
          
          /* ACTIVE RATING MODAL / CARD */
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Top Accent Gradient */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#003548] via-[#fd651e] to-pink-500"></div>

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-5 border-b border-[#21262d]">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8b949e] font-bold block">
                  Service Concluded • #{activeBooking.id}
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white tracking-tight m-0 mt-1">
                  Rate Service &amp; Safety
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("booking")}
                className="w-8 h-8 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-white flex items-center justify-center border border-[#30363d] cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Worker Summary Banner */}
            <div className="flex items-center gap-4 my-6 p-4 rounded-xl bg-[#0d1117] border border-[#21262d]">
              <div className="relative">
                <img
                  src={activeBooking.worker?.image}
                  alt={activeBooking.worker?.name}
                  className="w-14 h-14 rounded-xl object-cover border border-[#30363d]"
                />
                {isSakhi && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-pink-600 text-white text-[10px] font-black flex items-center justify-center">
                    ♀
                  </span>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-white m-0">
                    {activeBooking.worker?.name}
                  </h3>
                  {isSakhi && (
                    <span className="text-[10px] font-bold text-pink-300 bg-pink-950/80 px-2 py-0.5 rounded-md border border-pink-500/30">
                      ♀ Sakhi Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8b949e] m-0 mt-0.5">
                  {activeBooking.serviceCategory}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* INTERACTIVE 5-STAR RATING WITH FRAMER MOTION */}
              <div className="flex flex-col items-center justify-center py-2">
                <div className="flex items-center gap-3">
                  {[1, 2, 3, 4, 5].map((starValue) => {
                    const isLit = (hoveredStar || stars) >= starValue;
                    return (
                      <motion.button
                        key={starValue}
                        type="button"
                        whileHover={{ scale: 1.25 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHoveredStar(starValue)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => setStars(starValue)}
                        className="bg-transparent border-none cursor-pointer p-1 text-3xl md:text-4xl transition-colors"
                      >
                        <span
                          className={`material-symbols-outlined select-none transition-all ${
                            isLit
                              ? "text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)] font-variation-fill"
                              : "text-[#30363d]"
                          }`}
                          style={{ fontVariationSettings: isLit ? "'FILL' 1" : "'FILL' 0" }}
                        >
                          star
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <motion.span
                  key={hoveredStar || stars}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs font-mono font-bold text-amber-400 mt-2 text-center"
                >
                  {getStarLabel(hoveredStar || stars)}
                </motion.span>
              </div>

              {/* QUICK QUALITY & SAFETY TAGS */}
              <div>
                <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider block mb-2 font-mono">
                  Quality &amp; Trust Highlights
                </label>
                <div className="flex flex-wrap gap-2">
                  {qualityTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#003548] text-[#bfe8ff] border-[#bfe8ff]/40 shadow-xs"
                            : "bg-[#0d1117] text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-white"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* DETAILED FEEDBACK TEXTAREA */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#8b949e] uppercase tracking-wider font-mono">
                    Detailed Cooperative Feedback
                  </label>
                  <span className="text-[10px] text-[#8b949e] font-mono">
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Share details about punctuality, craftsmanship, safety protocols, and fair treatment..."
                  rows={4}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-[#bfe8ff] focus:ring-1 focus:ring-[#bfe8ff] rounded-xl p-3.5 text-xs md:text-sm text-white placeholder-[#484f58] outline-none transition-all resize-none"
                />
              </div>

              {/* TRUST MANDATORY CALLOUT BANNER */}
              <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#fd651e] text-[20px] shrink-0 mt-0.5">
                  verified_user
                </span>
                <p className="text-xs text-[#8b949e] m-0 leading-relaxed">
                  <strong className="text-[#c9d1d9]">Cooperative Accountability:</strong> Your feedback ensures cooperative quality and safety. Low ratings (below 3 stars) will trigger an automatic Federation Desk review with no arbitrary algorithmic penalties.
                </p>
              </div>

              {/* SUBMISSION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate("booking")}
                  className="w-full py-3 bg-[#21262d] hover:bg-[#30363d] text-white font-bold text-xs rounded-xl border border-[#30363d] transition-all cursor-pointer"
                >
                  Skip for Later
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-[#fd651e] hover:bg-[#e05413] active:scale-[0.98] text-white font-black text-xs md:text-sm rounded-xl shadow-[0_0_20px_rgba(253,101,30,0.3)] border border-[#fd651e]/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting Review...</span>
                  ) : (
                    <>
                      <span>Submit Verified Rating</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}
