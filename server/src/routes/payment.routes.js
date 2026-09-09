import { Router } from "express";
import {
  createBaseOrder,
  verifyPayment,
  createAddOnOrder,
  verifyAddOnPayment,
  completeBookingHandler,
} from "../../controllers/paymentController.js";

const router = Router();

// Base Pre-paid Escrow Order creation
router.post("/orders/base", createBaseOrder);
router.post("/orders", createBaseOrder); // Backward-compatible alias

// Base Pre-paid Escrow Payment Verification (Locks in Escrow)
router.post("/verify", verifyPayment);

// Add-On / Mutual Consent Overtime Order Creation
router.post("/orders/addon", createAddOnOrder);

// Add-On Payment Verification
router.post("/verify/addon", verifyAddOnPayment);

// Dual-Handshake Escrow Payout Release
router.post("/bookings/:id/complete", completeBookingHandler);
router.post("/release-payout/:id", completeBookingHandler);

export default router;
