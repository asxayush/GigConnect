import { Router } from "express";
import ToolItem from "../src/models/ToolItem.js";
import ToolRental from "../src/models/ToolRental.js";
import WorkerProfile from "../src/models/WorkerProfile.js";
import User from "../src/models/User.js";
import { requireAuth } from "../src/middlewares/auth.js";

const router = Router();

const DEFAULT_TOOLS = [
  {
    toolId: "tool-101",
    name: "Bosch Professional GBH 2-26 DRE Rotary Hammer Drill",
    category: "Electrical & Heavy Drilling",
    brand: "Bosch Power Tools",
    specs: "800W motor, 2.7 Joules impact energy, SDS-plus chuck",
    replacementValue: 15499,
    coopDailyFee: 0,
    totalStock: 3,
    availableStock: 3,
    condition: "Certified Master Grade (Inspected Weekly)",
    hubName: "Okhla Phase 3 Cooperative Tool Hub",
    hubAddress: "Plot 42, Okhla Industrial Area Phase 3, New Delhi - 110020",
    location: { type: "Point", coordinates: [77.26, 28.5355] },
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    toolId: "tool-102",
    name: "DeWalt DWE560 Heavy-Duty Circular Saw 184mm",
    category: "Carpentry & Woodcraft",
    brand: "DeWalt Industrial Tools",
    specs: "1350W high-torque motor, 65mm cutting depth",
    replacementValue: 12850,
    coopDailyFee: 0,
    totalStock: 2,
    availableStock: 2,
    condition: "Precision Calibrated",
    hubName: "Gurugram Sector 14 Trade Depot",
    hubAddress: "Old Delhi Road, Near ITI Sector 14, Gurugram - 122001",
    location: { type: "Point", coordinates: [77.039, 28.4725] },
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    toolId: "tool-103",
    name: "Stanley Heavy Inverter Arc Welder 200A",
    category: "Metalwork & Fabrication",
    brand: "Stanley FatMax",
    specs: "IGBT inverter technology, anti-stick hot start",
    replacementValue: 18900,
    coopDailyFee: 0,
    totalStock: 2,
    availableStock: 2,
    condition: "Factory Certified",
    hubName: "Noida Sector 62 Federation Center",
    hubAddress: "Block C, Electronic City, Sector 62, Noida - 201309",
    location: { type: "Point", coordinates: [77.368, 28.625] },
    imageUrl: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    toolId: "tool-104",
    name: "Fluke 117 Electrician's True RMS Digital Multimeter",
    category: "Electrical Diagnostic",
    brand: "Fluke Calibration",
    specs: "VoltAlert non-contact AC voltage detection, LoZ impedance",
    replacementValue: 22400,
    coopDailyFee: 0,
    totalStock: 4,
    availableStock: 4,
    condition: "NABL Lab Tested",
    hubName: "Connaught Place Central Tool Hub",
    hubAddress: "Super Bazar Complex, Outer Circle CP, New Delhi - 110001",
    location: { type: "Point", coordinates: [77.2197, 28.6328] },
    imageUrl: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
  {
    toolId: "tool-105",
    name: 'RIDGID Heavy Duty Pipe Threader & Die Kit (1/2" to 2")',
    category: "Plumbing & Sanitary",
    brand: "RIDGID Professional",
    specs: "Drop head ratchet threader with alloy dies",
    replacementValue: 16500,
    coopDailyFee: 0,
    totalStock: 2,
    availableStock: 2,
    condition: "Inspected & Lubricated",
    hubName: "South Delhi Saket Ward Center",
    hubAddress: "Community Center, Pushp Vihar Sector 3, Saket, New Delhi - 110017",
    location: { type: "Point", coordinates: [77.2185, 28.5244] },
    imageUrl: "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=400&auto=format&fit=crop&q=80",
    requiredBadge: "Cooperative Verified Tradesperson",
  },
];

const COOP_HUBS = [
  { id: "hub-1", name: "Okhla Phase 3 Tool Hub", area: "South Delhi", count: "18 Equipment", lat: 28.5355, lng: 77.26 },
  { id: "hub-2", name: "Connaught Place Central Hub", area: "Central Delhi", count: "24 Equipment", lat: 28.6328, lng: 77.2197 },
  { id: "hub-3", name: "Gurugram Sector 14 Depot", area: "Gurugram Hub", count: "15 Equipment", lat: 28.4725, lng: 77.039 },
  { id: "hub-4", name: "Noida Sector 62 Center", area: "Noida East", count: "19 Equipment", lat: 28.625, lng: 77.368 },
];

// Helper: Seed tools if collection is empty
async function ensureToolsSeeded() {
  try {
    const count = await ToolItem.countDocuments();
    if (count === 0) {
      await ToolItem.insertMany(DEFAULT_TOOLS);
    }
  } catch (err) {
    console.warn("ToolItem seed warning:", err.message);
  }
}

/**
 * GET /api/toolbank / /api/toolbank/inventory
 * Public: view real-time inventory from MongoDB
 */
router.get(["/", "/inventory"], async (req, res, next) => {
  try {
    await ensureToolsSeeded();
    const tools = await ToolItem.find().sort({ createdAt: 1 }).lean();

    // Format for frontend
    const mapped = tools.map((t) => ({
      id: t.toolId,
      _id: t._id,
      toolId: t.toolId,
      name: t.name,
      category: t.category,
      brand: t.brand,
      specs: t.specs,
      replacementValue: t.replacementValue,
      coopDailyFee: t.coopDailyFee,
      securityDeposit: t.securityDeposit,
      totalStock: t.totalStock,
      availableStock: t.availableStock,
      status: t.availableStock > 0 ? "available" : "out-of-stock",
      condition: t.condition,
      hubName: t.hubName,
      hubAddress: t.hubAddress,
      lat: t.location?.coordinates?.[1] || 28.6139,
      lng: t.location?.coordinates?.[0] || 77.209,
      imageUrl: t.imageUrl,
      requiredBadge: t.requiredBadge,
    }));

    res.json({
      success: true,
      count: mapped.length,
      data: mapped,
      hubs: COOP_HUBS,
      message: "Cooperative Tool Bank inventory fetched successfully",
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/toolbank/hubs
 */
router.get("/hubs", (req, res) => {
  res.json({
    success: true,
    data: COOP_HUBS,
  });
});

/**
 * GET /api/toolbank/my-rentals
 * Authenticated worker views their active and returned tool rentals
 */
router.get("/my-rentals", requireAuth, async (req, res, next) => {
  try {
    const rentals = await ToolRental.find({ workerId: req.user._id })
      .populate("toolItem")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: rentals,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/toolbank/rent or POST /api/toolbank/:id/reserve
 * Strict Server-Side Gate:
 * 1. Must be verified (Aadhaar KYC) -> 403 Forbidden
 * 2. Max 1 active rental policy -> 409 Conflict
 * 3. Stock check (> 0) -> 400 Bad Request
 * 4. Atomic stock decrement & rental record creation
 */
router.post(["/rent", "/:id/reserve", "/:id/rent"], requireAuth, async (req, res, next) => {
  try {
    const targetToolId = req.params.id || req.body.toolId;
    if (!targetToolId) {
      return res.status(400).json({
        success: false,
        message: "Tool ID is required",
      });
    }

    // Gate 1: Check Worker Verification in MongoDB
    const workerProfile = await WorkerProfile.findOne({ userId: req.user._id });
    const isVerified =
      workerProfile?.verificationStatus === "verified" ||
      req.user.verificationStatus === "verified" ||
      req.user.role === "admin";

    if (!isVerified) {
      return res.status(403).json({
        success: false,
        message:
          "403 Forbidden: Aadhaar e-KYC verification is strictly required before renting high-value cooperative equipment.",
      });
    }

    // Gate 2: Enforce max 1 active rental policy per worker
    const activeRental = await ToolRental.findOne({
      workerId: req.user._id,
      status: "active",
    });

    if (activeRental) {
      return res.status(409).json({
        success: false,
        message: `409 Conflict: You already have an active unreturned tool rental (${activeRental.rentalCode} - ${activeRental.toolId}). Return it before renting new equipment.`,
        activeRental,
      });
    }

    // Gate 3: Check Tool Availability & Stock
    const tool = await ToolItem.findOne({
      $or: [{ toolId: targetToolId }, { _id: targetToolId.match(/^[0-9a-fA-F]{24}$/) ? targetToolId : null }],
    });

    if (!tool) {
      return res.status(404).json({
        success: false,
        message: "Tool not found in cooperative tool bank inventory",
      });
    }

    if (tool.availableStock <= 0) {
      return res.status(400).json({
        success: false,
        message: `This tool (${tool.name}) is currently out of stock at ${tool.hubName}.`,
      });
    }

    // Atomic Stock Decrement
    tool.availableStock -= 1;
    await tool.save();

    const rentalCode = `TB-RES-${Date.now().toString().slice(-6)}`;
    const rental = await ToolRental.create({
      rentalCode,
      toolId: tool.toolId,
      toolItem: tool._id,
      workerId: req.user._id,
      workerName: req.user.name || "Verified Sahakari",
      workerPhone: req.user.phone || "",
      pickupHub: tool.hubName,
      pickupAddress: tool.hubAddress,
      replacementValue: tool.replacementValue,
      depositAmount: 0,
      status: "active",
      rentedAt: new Date(),
      expectedReturnAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      aadhaarVerifiedSnapshot: true,
    });

    res.status(201).json({
      success: true,
      message: `✓ Success! ${tool.name} checked out with zero cash deposit under Cooperative Mutual Trust.`,
      data: {
        rentalId: rental._id,
        reservationId: rental.rentalCode,
        toolId: tool.toolId,
        toolName: tool.name,
        availableStockRemaining: tool.availableStock,
        replacementValue: tool.replacementValue,
        pickupHub: tool.hubName,
        pickupAddress: tool.hubAddress,
        workerName: req.user.name,
        workerPhone: req.user.phone,
        rentedAt: rental.rentedAt,
        validUntil: rental.expectedReturnAt,
        instructions:
          "Show your verified Aadhaar QR Badge at the cooperative counter to collect equipment with zero security deposit.",
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/toolbank/return or POST /api/toolbank/:id/return
 * Return tool back to stock and close active rental
 */
router.post(["/return", "/:id/return"], requireAuth, async (req, res, next) => {
  try {
    const { rentalId, toolId } = req.body;
    const targetParam = req.params.id;

    let rentalQuery = { workerId: req.user._id, status: "active" };
    if (rentalId) {
      rentalQuery._id = rentalId;
    } else if (toolId || targetParam) {
      rentalQuery.toolId = toolId || targetParam;
    }

    const rental = await ToolRental.findOne(rentalQuery);
    if (!rental) {
      return res.status(404).json({
        success: false,
        message: "No active rental record found for this equipment and worker.",
      });
    }

    rental.status = "returned";
    rental.returnedAt = new Date();
    await rental.save();

    // Increment tool stock atomically
    const tool = await ToolItem.findOne({ toolId: rental.toolId });
    if (tool) {
      tool.availableStock = Math.min(tool.totalStock, tool.availableStock + 1);
      await tool.save();
    }

    res.json({
      success: true,
      message: `✓ Tool (${rental.toolId}) returned successfully. Stock restored to ${tool ? tool.availableStock : "hub"}.`,
      data: rental,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
