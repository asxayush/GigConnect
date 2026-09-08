import React, { useEffect, useRef, useState, useId } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { showToast } from "../../toast";

export default function WorkerRadarMap({
  workers = [],
  selectedWorker = null,
  onSelectWorker = () => {},
  onNavigate = () => {},
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const markersMapRef = useRef({});

  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState("Delhi NCR Central");
  const [isLocating, setIsLocating] = useState(false);

  // Delhi NCR default center
  const NCR_CENTER = [28.6139, 77.209]; // New Delhi
  const DEFAULT_ZOOM = 11;

  // Filter workers based on search query
  const filteredWorkers = workers.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.craft?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.area?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 1. Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return; // already initialized

    // Create Map
    const map = L.map(mapContainerRef.current, {
      center: NCR_CENTER,
      zoom: DEFAULT_ZOOM,
      zoomControl: false, // We provide custom styled controls
      attributionControl: true,
      minZoom: 9,
      maxZoom: 18,
    });

    // Standard OpenStreetMap tiles (100% free, open, no watermark or API key)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ["a", "b", "c"],
      maxZoom: 19,
    }).addTo(map);

    // Feature group for worker markers
    const markersGroup = L.featureGroup().addTo(map);
    markersGroupRef.current = markersGroup;
    mapInstanceRef.current = map;

    // Handle popup click delegation for "Hire Now" button
    const handlePopupClick = (e) => {
      const hireBtn = e.target.closest(".popup-hire-btn");
      if (hireBtn) {
        const workerId = hireBtn.getAttribute("data-worker-id");
        const worker = workers.find((w) => w.id === workerId);
        if (worker) {
          onNavigate("booking", {
            name: worker.name,
            skills: [worker.role],
            price: worker.rate,
            prefilledDate: "Tomorrow, 09:30 AM",
          });
        }
      }
    };

    mapContainerRef.current.addEventListener("click", handlePopupClick);

    // Resize observer to ensure map renders smoothly on container layout changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    });
    resizeObserver.observe(mapContainerRef.current);

    return () => {
      resizeObserver.disconnect();
      if (mapContainerRef.current) {
        mapContainerRef.current.removeEventListener("click", handlePopupClick);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Plot & Update Worker Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    markersMapRef.current = {};

    filteredWorkers.forEach((worker) => {
      if (worker.lat == null || worker.lng == null) return;

      const isSelected = selectedWorker?.id === worker.id;

      // Custom DivIcon for the worker pin
      const customIcon = L.divIcon({
        className: "custom-leaflet-marker",
        iconSize: [44, 44],
        iconAnchor: [22, 22],
        popupAnchor: [0, -20],
        html: `
          <div class="worker-marker-pin ${isSelected ? "is-active" : ""}">
            <div class="worker-marker-pulse"></div>
            <div class="worker-marker-img-wrap">
              <img src="${worker.image}" alt="${worker.name}" class="worker-marker-img" />
            </div>
            <div class="worker-marker-badge">${worker.mapRate || worker.rate || "₹500"}</div>
          </div>
        `,
      });

      const marker = L.marker([worker.lat, worker.lng], { icon: customIcon });

      // Custom Popup HTML matching Stitch Card Tokens
      const popupHtml = `
        <div class="worker-map-popup-card">
          <div class="popup-top">
            <img src="${worker.image}" alt="${worker.name}" class="popup-avatar" />
            <div class="popup-info">
              <div class="popup-badge">
                <span class="popup-badge-dot"></span>
                <span>Verified Sahakari</span>
              </div>
              <h4 class="popup-name">${worker.name}</h4>
              <p class="popup-role">${worker.role}</p>
              <div class="popup-meta">
                <span class="popup-rating">★ ${worker.rating}</span>
                <span class="popup-dot">•</span>
                <span class="popup-loc">${worker.area || worker.city}</span>
              </div>
            </div>
          </div>
          <div class="popup-divider"></div>
          <div class="popup-bottom">
            <div>
              <span class="popup-rate-label">Direct Member Rate</span>
              <div class="popup-rate-val">${worker.rate} <span class="popup-rate-unit">${worker.rateUnit || "/day"}</span></div>
            </div>
            <button type="button" class="popup-hire-btn" data-worker-id="${worker.id}">
              <span>Hire Now</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        maxWidth: 280,
        className: "custom-worker-leaflet-popup",
      });

      marker.on("click", () => {
        onSelectWorker(worker);
      });

      marker.addTo(markersGroup);
      markersMapRef.current[worker.id] = marker;
    });
  }, [filteredWorkers, selectedWorker]);

  // 3. Pan to selected worker when selectedWorker changes
  useEffect(() => {
    if (!selectedWorker || !mapInstanceRef.current) return;
    const marker = markersMapRef.current[selectedWorker.id];
    if (marker && selectedWorker.lat && selectedWorker.lng) {
      mapInstanceRef.current.flyTo([selectedWorker.lat, selectedWorker.lng], 13.5, {
        duration: 1.0,
      });
      // Open popup after fly animation completes
      setTimeout(() => {
        marker.openPopup();
      }, 500);
    }
  }, [selectedWorker]);

  // 4. Custom Geolocation: Locate Me in NCR
  const handleLocateMe = () => {
    setIsLocating(true);
    if (!navigator.geolocation) {
      showToast("Geolocation is not supported by your browser");
      setIsLocating(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setIsLocating(false);
        setCurrentLocation("Live NCR Geolocation");

        if (mapInstanceRef.current) {
          // Add or move user location marker
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            const userIcon = L.divIcon({
              className: "custom-user-marker",
              iconSize: [28, 28],
              iconAnchor: [14, 14],
              html: `
                <div class="user-location-pin">
                  <div class="user-pulse"></div>
                  <div class="user-dot"></div>
                </div>
              `,
            });
            userMarkerRef.current = L.marker([latitude, longitude], {
              icon: userIcon,
              zIndexOffset: 1000,
            })
              .bindPopup("<div class='user-popup-content'><strong>You are here</strong><br/>Scanning Delhi NCR hub...</div>")
              .addTo(mapInstanceRef.current);
          }

          mapInstanceRef.current.flyTo([latitude, longitude], 13.5, { duration: 1.4 });
          showToast("Centered on your current location");
        }
      },
      (error) => {
        setIsLocating(false);
        // Fallback gracefully to central Delhi NCR with clear notification
        showToast("GPS access denied. Defaulting to Delhi Central Hub.");
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(NCR_CENTER, DEFAULT_ZOOM, { duration: 1.2 });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Reset to full Delhi NCR overview
  const handleResetNCR = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(NCR_CENTER, DEFAULT_ZOOM, { duration: 1 });
      setCurrentLocation("Delhi NCR Central");
      showToast("View reset to Delhi NCR region");
    }
  };

  return (
    <div className="relative w-full h-full min-h-[460px] sm:min-h-[540px] lg:min-h-[640px] bg-[#002432] text-on-primary rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between border border-primary-container/30 select-none">
      {/* 1. TOP HEADER OVERLAY */}
      <div className="relative z-[400] p-3 sm:p-5 flex flex-wrap items-center justify-between gap-2.5 bg-gradient-to-b from-[#002432]/95 via-[#002432]/60 to-transparent pointer-events-none">
        {/* Search Worker / Skill Input */}
        <div className="relative flex-1 min-w-[200px] max-w-[280px] pointer-events-auto">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-primary-container text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search worker or skill..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 sm:h-10 pl-10 pr-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full text-xs font-medium text-white placeholder:text-on-primary-container/80 focus:outline-none focus:ring-2 focus:ring-secondary-container transition-all"
          />
        </div>

        {/* Center / Right: Location Badge */}
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-xl border border-white/20 px-3 py-1.5 rounded-full text-xs font-medium text-white shadow-sm pointer-events-auto">
          <div className="w-5 h-5 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-[13px]">location_on</span>
          </div>
          <div className="flex flex-col leading-tight pr-1">
            <span className="text-[9px] text-primary-fixed uppercase font-semibold">Active Region</span>
            <span className="text-[11px] sm:text-xs font-bold text-white max-w-[130px] sm:max-w-[170px] truncate">
              {currentLocation}
            </span>
          </div>
        </div>

        {/* Quick Hub Reset Button */}
        <button
          type="button"
          onClick={handleResetNCR}
          className="pointer-events-auto px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1 transition-all border-none cursor-pointer"
          title="Reset to Delhi NCR view"
        >
          <span className="material-symbols-outlined text-[14px]">my_location</span>
          <span className="hidden sm:inline">NCR Hub</span>
        </button>
      </div>

      {/* 2. LEAFLET INTERACTIVE MAP CANVAS */}
      <div className="absolute inset-0 z-0">
        <div ref={mapContainerRef} className="w-full h-full" />
      </div>

      {/* 3. FLOATING MAP CONTROLS (Zoom +/- & Locate Me) */}
      <div className="relative z-[400] px-4 sm:px-5 flex items-center justify-between pointer-events-none my-auto">
        {/* Zoom Controls */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            className="w-9 h-9 rounded-full bg-[#003548]/90 hover:bg-[#003548] backdrop-blur-xl border border-white/20 text-white flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all border-none cursor-pointer"
            title="Zoom In"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            className="w-9 h-9 rounded-full bg-[#003548]/90 hover:bg-[#003548] backdrop-blur-xl border border-white/20 text-white flex items-center justify-center font-bold text-lg shadow-lg active:scale-95 transition-all border-none cursor-pointer"
            title="Zoom Out"
          >
            −
          </button>
        </div>

        {/* Locate Me Button (Geolocation) */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <button
            type="button"
            onClick={handleLocateMe}
            className={`w-9 h-9 rounded-full bg-secondary-container hover:bg-secondary text-on-secondary flex items-center justify-center shadow-lg shadow-secondary-container/35 active:scale-95 transition-all border-none cursor-pointer ${
              isLocating ? "animate-spin" : ""
            }`}
            title="Locate me within Delhi NCR"
          >
            <span className="material-symbols-outlined text-[18px]">near_me</span>
          </button>
        </div>
      </div>

      {/* 4. BOTTOM HORIZONTAL-SCROLL WORKER CARDS STRIP */}
      <div className="relative z-[400] p-3 sm:p-5 bg-gradient-to-t from-[#002432]/95 via-[#002432]/70 to-transparent">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-white/90 uppercase tracking-wider">
            {filteredWorkers.length} Workers Plotted in NCR
          </span>
          <span className="text-[10px] text-white/60">Click card to pan map</span>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto pb-1.5 scrollbar-none snap-x">
          {filteredWorkers.map((worker) => {
            const isSelected = selectedWorker?.id === worker.id;
            return (
              <div
                key={worker.id}
                onClick={() => onSelectWorker(worker)}
                className={`flex-shrink-0 w-[230px] sm:w-[250px] p-3 rounded-2xl transition-all cursor-pointer snap-start border ${
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

                {/* Subtitle & Area in Delhi NCR */}
                <div className="text-[10px] text-on-surface-variant font-medium mb-2 truncate flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px] text-secondary">place</span>
                  <span>{worker.area || worker.city}</span>
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
                    ★ {worker.rating}
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
