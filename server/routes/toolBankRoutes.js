import { Router } from "express";
import { protect, requireVerifiedWorker } from "../middleware/authMiddleware.js";

const router = Router();

// Demo Delhi NCR Cooperative Tool Bank Inventory
const TOOL_INVENTORY = [
  {
    id: "tool-101",
    name: "Bosch Professional GBH 2-26 DRE Rotary Hammer Drill",
    category: "Electrical & Heavy Drilling",
    brand: "Bosch Power Tools",
    specs: "800W motor, 2.7 Joules impact energy, SDS-plus chuck",
    replacementValue: 15499,
    coopDailyFee: 0, // Free for verified members
    securityDeposit: "₹0 (Cooperative Mutual Trust)",
    status: "available",
    condition: "Certified Master Grade (Inspected Weekly)",
    hubName: "Okhla Phase 3 Cooperative Tool Hub",
    hubAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    lat: 28.5355,
    lng: 77.2600,
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    id: "tool-102",
    name: "DeWalt DWE560 Heavy-Duty Circular Saw 184mm",
    category: "Carpentry & Woodcraft",
    brand: "DeWalt Industrial Tools",
    specs: "1350W high-torque motor, 65mm cutting depth",
    replacementValue: 12850,
    coopDailyFee: 0,
    securityDeposit: "₹0 (Cooperative Mutual Trust)",
    status: "available",
    condition: "Precision Calibrated",
    hubName: "Gurugram Sector 14 Trade Depot",
    hubAddress: "Old Delhi Road, Near ITI Sector 14, Gurugram - 122001",
    lat: 28.4725,
    lng: 77.0390,
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    id: "tool-103",
    name: "Stanley Heavy Inverter Arc Welder 200A",
    category: "Metalwork & Fabrication",
    brand: "Stanley FatMax",
    specs: "IGBT inverter technology, anti-stick hot start",
    replacementValue: 18900,
    coopDailyFee: 0,
    securityDeposit: "₹0 (Cooperative Mutual Trust)",
    status: "available",
    condition: "Factory Certified",
    hubName: "Noida Sector 62 Federation Center",
    hubAddress: "Block C, Electronic City, Sector 62, Noida - 201309",
    lat: 28.6250,
    lng: 77.3680,
    imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    id: "tool-104",
    name: "Fluke 117 Electrician's True RMS Digital Multimeter",
    category: "Electrical Diagnostic",
    brand: "Fluke Calibration",
    specs: "VoltAlert non-contact AC voltage detection, LoZ impedance",
    replacementValue: 22400,
    coopDailyFee: 0,
    securityDeposit: "₹0 (Cooperative Mutual Trust)",
    status: "available",
    condition: "NABL Lab Tested",
    hubName: "Connaught Place Central Tool Hub",
    hubAddress: "Super Bazar Complex, Outer Circle CP, New Delhi - 110001",
    lat: 28.6328,
    lng: 77.2197,
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    id: "tool-105",
    name: "RIDGID Heavy Duty Pipe Threader & Die Kit (1/2\" to 2\")",
    category: "Plumbing & Sanitary",
    brand: "RIDGID Professional",
    specs: "Drop head ratchet threader with alloy dies",
    replacementValue: 16500,
    coopDailyFee: 0,
    securityDeposit: "₹0 (Cooperative Mutual Trust)",
    status: "available",
    condition: "Inspected & Lubricated",
    hubName: "South Delhi Saket Ward Center",
    hubAddress: "Community Center, Pushp Vihar Sector 3, Saket, New Delhi - 110017",
    lat: 28.5244,
    lng: 77.2185,
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
];

const COOP_HUBS = [
  { id: "hub-1", name: "Okhla Phase 3 Tool Hub", area: "South Delhi", count: "18 Equipment", lat: 28.5355, lng: 77.2600 },
  { id: "hub-2", name: "Connaught Place Central Hub", area: "Central Delhi", count: "24 Equipment", lat: 28.6328, lng: 77.2197 },
  { id: "hub-3", name: "Gurugram Sector 14 Depot", area: "Gurugram Hub", count: "15 Equipment", lat: 28.4725, lng: 77.0390 },
  { id: "hub-4", name: "Noida Sector 62 Center", area: "Noida East", count: "19 Equipment", lat: 28.6250, lng: 77.3680 },
];

/**
 * GET /api/toolbank
 * Unrestricted: Anyone can view catalog of tools and hubs on the map
 */
router.get("/", (req, res) => {
  res.json({
    success: true,
    count: TOOL_INVENTORY.length,
    data: TOOL_INVENTORY,
    hubs: COOP_HUBS,
    message: "Cooperative Tool Bank inventory fetched successfully",
  });
});

/**
 * GET /api/toolbank/hubs
 * List physical toolbank depot hubs
 */
router.get("/hubs", (req, res) => {
  res.json({
    success: true,
    data: COOP_HUBS,
  });
});

/**
 * POST /api/toolbank/:id/reserve
 * PART 1: Protected with protect & requireVerifiedWorker
 * Blocks unverified or pending workers with 403 Forbidden
 */
router.post("/:id/reserve", protect, requireVerifiedWorker, (req, res) => {
  const { id } = req.params;
  const tool = TOOL_INVENTORY.find((t) => t.id === id);

  if (!tool) {
    return res.status(404).json({
      success: false,
      message: "Tool not found in cooperative inventory",
    });
  }

  const reservationCode = `TB-RES-${Date.now().toString().slice(-6)}`;

  res.status(200).json({
    success: true,
    message: `✓ Success! ${tool.name} reserved for 24 hours.`,
    data: {
      reservationId: reservationCode,
      toolId: tool.id,
      toolName: tool.name,
      replacementValue: tool.replacementValue,
      pickupHub: tool.hubName,
      pickupAddress: tool.hubAddress,
      workerName: req.user.name,
      workerPhone: req.user.phone,
      reservedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 3600 * 1000),
      instructions: "Show your QR Badge / Aadhaar Member ID at the tool depot counter to collect without any cash deposit.",
    },
  });
});

export default router;
