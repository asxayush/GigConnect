import React, { useState } from "react";

export default function WorkerRadarMap({
  workers = [],
  selectedWorker = null,
  onSelectWorker = () => {},
  onNavigate = () => {},
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Indiranagar, Bengaluru");
  const [isLocating, setIsLocating] = useState(false);

  const handleLocateMe = () => {
    setIsLocating(true);
    setTimeout(() => {
      setIsLocating(false);
      setCurrentLocation("Current GPS Location (Active)");
    }, 600);
  };

  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.craft?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative w-full h-full min-h-[600px] lg:min-h-[680px] bg-[#002432] text-on-primary rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-primary-container/30 select-none">
      {/* Background Stylized Tactical Map Layer */}
      <div
        className="absolute inset-0 pointer-events-none transition-transform duration-300"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        <svg
          className="w-full h-full opacity-30"
          viewBox="0 0 800 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Subtle street grid lines */}
          <path
            d="M 50,0 V 800 M 150,0 V 800 M 250,0 V 800 M 350,0 V 800 M 450,0 V 800 M 550,0 V 800 M 650,0 V 800 M 750,0 V 800"
            stroke="#0e4d64"
            strokeWidth="0.75"
          />
          <path
            d="M 0,50 H 800 M 0,150 H 800 M 0,250 H 800 M 0,350 H 800 M 0,450 H 800 M 0,550 H 800 M 0,650 H 800 M 0,750 H 800"
            stroke="#0e4d64"
            strokeWidth="0.75"
          />

          {/* Curved arterial avenues */}
          <path
            d="M 0,220 Q 280,180 400,320 T 800,420"
            stroke="#1c5d76"
            strokeWidth="2.5"
            strokeDasharray="4 4"
          />
          <path
            d="M 120,0 Q 260,340 400,400 T 700,800"
            stroke="#1c5d76"
            strokeWidth="2.5"
          />
          <path
            d="M 0,540 Q 320,500 480,360 T 800,200"
            stroke="#287391"
            strokeWidth="2"
          />
          <path
            d="M 300,800 C 350,550 500,450 800,300"
            stroke="#1c5d76"
            strokeWidth="1.5"
          />
          <path
            d="M 50,750 Q 250,600 400,400 T 750,50"
            stroke="#1c5d76"
            strokeWidth="1"
          />

          {/* Road labels */}
          <text x="440" y="240" fill="#89bdd8" fontSize="11" transform="rotate(-40 440,240)">
            100 Feet Rd
          </text>
          <text x="350" y="440" fill="#89bdd8" fontSize="11" transform="rotate(85 350,440)">
            Indiranagar Central
          </text>
          <text x="460" y="360" fill="#89bdd8" fontSize="10" transform="rotate(35 460,360)">
            CMH Road
          </text>
          <text x="490" y="420" fill="#89bdd8" fontSize="9" transform="rotate(-15 490,420)">
            HAL 2nd Stage
          </text>
          <text x="210" y="480" fill="#89bdd8" fontSize="9" transform="rotate(30 210,480)">
            Koramangala Link
          </text>
        </svg>

        {/* Tactical Neighborhood Watermarks */}
        <div className="absolute top-[28%] left-[44%] -translate-x-1/2 -translate-y-1/2 text-primary-fixed/60 font-bold tracking-wide text-xs uppercase select-none pointer-events-none">
          Bengaluru Urban Ward
        </div>
        <div className="absolute top-[68%] left-[45%] text-primary-fixed-dim/50 font-semibold tracking-wider text-[11px] uppercase pointer-events-none">
          Cooperative District 04
        </div>

        {/* Radar Concentric Rings with Palette-calibrated Secondary Tangerine Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          {/* Outermost Radar Ring */}
          <div className="w-[480px] h-[480px] rounded-full border border-secondary-container/20 animate-[spin_24s_linear_infinite]" />
          
          {/* Mid Radar Ring with Sector Shade */}
          <div className="absolute inset-0 m-auto w-[340px] h-[340px] rounded-full border border-secondary-container/30 bg-secondary-container/[0.03] shadow-[0_0_80px_rgba(253,101,30,0.12)]" />
          
          {/* Inner Kinetic Sweep Layer */}
          <div className="absolute inset-0 m-auto w-[220px] h-[220px] rounded-full border border-secondary-container/50 bg-gradient-to-tr from-secondary-container/15 via-transparent to-transparent animate-pulse" />

          {/* Center Point - User's Live GPS Pinpoint */}
          <div className="absolute inset-0 m-auto w-4 h-4 bg-white rounded-full ring-4 ring-secondary-container/60 shadow-[0_0_16px_#fd651e] z-10 flex items-center justify-center">
            <div className="w-1.5 h-1.5 bg-secondary-container rounded-full" />
          </div>
        </div>

        {/* Worker Pins Placed Around Radar */}
        {filteredWorkers.map((worker) => {
          const isSelected = selectedWorker?.id === worker.id;
          return (
            <div
              key={worker.id}
              onClick={() => onSelectWorker(worker)}
              style={{
                top: `${worker.radarY}%`,
                left: `${worker.radarX}%`,
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer group transition-all duration-300 ${
                isSelected ? "scale-125 z-30" : "hover:scale-115"
              }`}
            >
              {/* Floating Worker Avatar Pin with Price Pill */}
              <div className="relative flex items-center">
                {/* Glow ring */}
                <div
                  className={`absolute -inset-1.5 rounded-full transition-all ${
                    isSelected
                      ? "bg-secondary-container/70 blur-sm animate-pulse"
                      : "group-hover:bg-secondary-container/40 group-hover:blur-[2px]"
                  }`}
                />

                {/* Worker Avatar Image */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-surface-container-lowest bg-primary-container shadow-lg">
                  <img
                    src={worker.image}
                    alt={worker.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                        worker.name
                      )}&background=fd651e&color=ffffff`;
                    }}
                  />
                </div>

                {/* Secondary Container Price Pill Badge */}
                <div
                  className={`ml-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-md transition-all whitespace-nowrap ${
                    isSelected
                      ? "bg-secondary-container text-on-secondary shadow-secondary-container/50 scale-105"
                      : "bg-secondary-container text-on-secondary group-hover:bg-secondary"
                  }`}
                >
                  {worker.mapRate || worker.rate || "₹500"}
                </div>
              </div>

              {/* Tooltip on Hover */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-primary/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-primary-container text-center shadow-xl pointer-events-none whitespace-nowrap z-40">
                <span className="text-xs font-bold text-on-primary">{worker.name}</span>
                <span className="text-[10px] text-secondary-fixed font-semibold">{worker.role}</span>
                <span className="text-[9px] text-primary-fixed-dim">★ {worker.rating} • {worker.distance || "1.8 km"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top Header Bar Overlay */}
      <div className="relative z-30 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input pill */}
        <div className="relative flex-1 max-w-[220px] sm:max-w-[260px]">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-primary-container text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search worker or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full text-xs font-medium text-white placeholder:text-on-primary-container focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
          />
        </div>

        {/* Center: Location Filter Pill */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm">
          <div className="w-6 h-6 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[14px]">tune</span>
          </div>
          <div className="flex flex-col leading-tight pr-1">
            <span className="text-[9px] text-primary-fixed uppercase font-semibold">Location</span>
            <span className="text-xs font-bold text-white max-w-[120px] sm:max-w-[180px] truncate">
              {currentLocation}
            </span>
          </div>
        </div>

        {/* Right: Quick Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert("No new notifications")}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all relative border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-secondary-container rounded-full ring-2 ring-[#002432]" />
          </button>
          <button
            type="button"
            onClick={() => onNavigate("find-help")}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all border-none cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">settings</span>
          </button>
          <div
            className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-secondary-container cursor-pointer"
            onClick={() => onNavigate("auth")}
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>

      {/* Map Interactive Float Controls (Left: Zoom +/- | Right: GPS / Fullscreen) */}
      <div className="relative z-30 px-5 flex items-center justify-between pointer-events-none">
        {/* Zoom Controls */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 1.4))}
            className="w-9 h-9 rounded-full bg-primary/80 hover:bg-primary backdrop-blur-xl border border-primary-container text-white flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all border-none cursor-pointer"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.75))}
            className="w-9 h-9 rounded-full bg-primary/80 hover:bg-primary backdrop-blur-xl border border-primary-container text-white flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all border-none cursor-pointer"
          >
            −
          </button>
        </div>

        {/* Locate & Fullscreen Controls */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => onNavigate("find-help")}
            className="w-9 h-9 rounded-full bg-primary/80 hover:bg-primary backdrop-blur-xl border border-primary-container text-white flex items-center justify-center shadow-lg active:scale-95 transition-all border-none cursor-pointer"
            title="Expand Full Grid"
          >
            <span className="material-symbols-outlined text-[18px]">fullscreen</span>
          </button>
          <button
            type="button"
            onClick={handleLocateMe}
            className={`w-9 h-9 rounded-full bg-secondary-container hover:bg-secondary text-on-secondary flex items-center justify-center shadow-lg shadow-secondary-container/30 active:scale-95 transition-all border-none cursor-pointer ${
              isLocating ? "animate-spin" : ""
            }`}
            title="Center on my location"
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
          </button>
        </div>
      </div>

      {/* Bottom Horizontal Worker Cards Carousel Overlay */}
      <div className="relative z-30 p-4 sm:p-5">
        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-none snap-x">
          {filteredWorkers.map((worker) => {
            const isSelected = selectedWorker?.id === worker.id;
            return (
              <div
                key={worker.id}
                onClick={() => onSelectWorker(worker)}
                className={`flex-shrink-0 w-[240px] p-3 rounded-2xl transition-all cursor-pointer snap-start border ${
                  isSelected
                    ? "bg-surface-container-lowest text-on-surface shadow-xl ring-2 ring-secondary-container border-transparent scale-[1.02]"
                    : "bg-surface-container-lowest/95 text-on-surface hover:bg-surface-container-lowest border-surface-container-high shadow-md hover:scale-[1.01]"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={worker.image}
                      alt={worker.name}
                      className="w-9 h-9 rounded-full object-cover ring-1 ring-border-tone/40"
                    />
                    <div className="leading-tight">
                      <h4 className="text-xs font-bold text-primary truncate max-w-[110px]">
                        {worker.name}
                      </h4>
                      <p className="text-[10px] text-on-surface-variant truncate max-w-[110px]">
                        {worker.role}
                      </p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-primary text-on-primary text-[10px] font-bold rounded-full">
                    {worker.mapRate || worker.rate || "₹500"}
                  </span>
                </div>

                {/* Subtitle & Location */}
                <div className="text-[10px] text-on-surface-variant font-medium mb-2 truncate">
                  {worker.city || "Bengaluru, India"} • {worker.distance || "1.8 km"}
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-surface-container-low text-primary rounded-md text-[10px] font-semibold border border-surface-container-high">
                    {worker.workType || "On-site"}
                  </span>
                  <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed rounded-md text-[10px] font-semibold">
                    {worker.jobNature || "Full Time"}
                  </span>
                  <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-md text-[10px] font-semibold">
                    {worker.experience || "3 years"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
