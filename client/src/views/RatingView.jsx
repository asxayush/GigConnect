import React, { useState } from "react";
import { motion } from "framer-motion";
import { submitRating } from "../api";
import { showToast } from "../toast";
import { DEFAULT_FEMALE_AVATAR, getAvatar } from "../assets/avatars";

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

  const workerRecord = activeBooking.worker || {};
  const workerName =
    workerRecord.name || activeBooking.workerName || "Verified professional";
  const workerRole =
    workerRecord.role ||
    activeBooking.serviceCategory ||
    activeBooking.title ||
    "Service professional";
  const isSakhi = Boolean(
    workerRecord.sakhiVerified ||
      workerRecord.isSakhiVerified ||
      activeBooking.sakhiVerified
  );
  const workerPhoto = getAvatar({
    ...workerRecord,
    name: workerName,
    avatar: workerRecord.avatar || workerRecord.image || activeBooking.avatar,
    image: workerRecord.image || workerRecord.photoUrl || activeBooking.image,
  });
  const workerInitials = workerName
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const [stars, setStars] = useState(5);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState(["Safe & Respectful", "Master Workmanship"]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [responseStats, setResponseStats] = useState(null);
  const [photoFailed, setPhotoFailed] = useState(false);

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
        workerId: workerRecord.id || workerRecord._id || activeBooking.workerId,
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

  const showPhoto = Boolean(workerPhoto) && !photoFailed;

  return (
    <div className="w-full min-h-screen bg-surface text-on-surface antialiased font-sans py-10 px-4 flex items-center justify-center">
      <div className="w-full max-w-xl">
        {isSuccess ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-container-lowest border border-border-tone/30 rounded-2xl p-8 text-center shadow-sm"
          >
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <h2 className="font-headline-md text-headline-md text-on-surface m-0">
              Review recorded
            </h2>

            <p className="text-sm text-on-surface-variant mt-2 max-w-md mx-auto leading-relaxed">
              Your feedback updates{" "}
              <strong className="text-on-surface">{workerName}&apos;s</strong> profile
              and helps the cooperative keep quality high.
            </p>

            {stars < 3 ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 my-6 text-left flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-700 text-[22px] shrink-0 mt-0.5">
                  policy
                </span>
                <div className="text-xs text-amber-900 leading-relaxed">
                  <strong className="block font-bold mb-1">
                    Support review started
                  </strong>
                  Because this job was rated under 3 stars, a quality steward will review the job logs and reach out within 24 hours.
                </div>
              </div>
            ) : (
              <div className="bg-surface-container-low border border-border-tone/30 rounded-xl p-4 my-6 text-left flex items-center justify-between">
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant block">
                    Updated worker score
                  </span>
                  <span className="text-base font-bold text-on-surface">
                    ★ {responseStats?.newRatingAvg || responseStats?.ratingAvg || 4.96} / 5.0
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                  Payment released (95%)
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => onNavigate("booking")}
                className="w-full py-3 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border-none transition-all cursor-pointer"
              >
                View my bookings
              </button>
              <button
                type="button"
                onClick={() => onNavigate("home")}
                className="w-full py-3 bg-primary hover:bg-primary-container text-on-primary font-bold text-xs rounded-xl border-none shadow-sm transition-all cursor-pointer"
              >
                Return to home
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-surface-container-lowest border border-border-tone/30 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary-container to-pink-400" />

            <div className="flex items-center justify-between pb-5 border-b border-border-tone/20">
              <div>
                <span className="font-label-sm text-label-sm text-on-surface-variant block">
                  Service completed
                </span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface m-0 mt-1">
                  Rate service &amp; safety
                </h2>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("booking")}
                className="w-8 h-8 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface flex items-center justify-center border-none cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            <div className="flex items-center gap-4 my-6 p-4 rounded-xl bg-surface-container-low border border-border-tone/30">
              <div className="relative shrink-0">
                {showPhoto ? (
                  <img
                    src={workerPhoto}
                    alt={workerName}
                    onError={() => setPhotoFailed(true)}
                    className="w-14 h-14 rounded-xl object-cover border border-border-tone/40 bg-surface-container"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-surface-container text-primary flex items-center justify-center font-bold text-sm border border-border-tone/40">
                    {workerInitials || (
                      <span className="material-symbols-outlined text-[22px]">person</span>
                    )}
                  </div>
                )}
                {isSakhi && (
                  <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-pink-600 text-white text-[10px] font-bold flex items-center justify-center">
                    ♀
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-on-surface m-0 truncate">
                    {workerName}
                  </h3>
                  {isSakhi && (
                    <span className="text-[10px] font-bold text-pink-800 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-200">
                      Sakhi verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-on-surface-variant m-0 mt-0.5 truncate">
                  {workerRole}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                            isLit ? "text-amber-500" : "text-outline-variant"
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
                  className="text-xs font-semibold text-amber-700 mt-2 text-center"
                >
                  {getStarLabel(hoveredStar || stars)}
                </motion.span>
              </div>

              <div>
                <label className="font-label-md text-label-md text-on-surface-variant block mb-2">
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
                            ? "bg-primary text-on-primary border-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface-variant border-border-tone/40 hover:bg-surface-container hover:text-on-surface"
                        }`}
                      >
                        {isSelected ? "✓ " : "+ "}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-label-md text-label-md text-on-surface-variant">
                    Additional feedback
                  </label>
                  <span className="text-[10px] text-outline">
                    {comment.length} / 500
                  </span>
                </div>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value.slice(0, 500))}
                  placeholder="Share details about punctuality, craftsmanship, safety, and fair treatment..."
                  rows={4}
                  className="w-full bg-surface-container-low border border-border-tone/40 focus:border-primary focus:ring-2 focus:ring-primary/10 rounded-xl p-3.5 text-xs md:text-sm text-on-surface placeholder:text-outline outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-surface-container-low border border-border-tone/30 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-secondary-container text-[20px] shrink-0 mt-0.5">
                  verified_user
                </span>
                <p className="text-xs text-on-surface-variant m-0 leading-relaxed">
                  <strong className="text-on-surface">Accountability:</strong> Your feedback keeps service quality and safety high. Ratings below 3 stars start a support review — not an automatic penalty.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate("booking")}
                  className="w-full py-3 bg-surface-container hover:bg-surface-container-high text-primary font-bold text-xs rounded-xl border-none transition-all cursor-pointer"
                >
                  Skip for later
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-secondary-container hover:opacity-95 active:scale-[0.98] text-on-secondary font-bold text-xs md:text-sm rounded-xl shadow-sm border-none flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Submitting review...</span>
                  ) : (
                    <>
                      <span>Submit rating</span>
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
