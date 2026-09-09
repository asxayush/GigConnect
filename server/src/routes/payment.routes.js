import { Router } from "express";
import {
  createEscrowOrder,
  verifyEscrowPayment,
  releasePayout,
  createBaseOrder,
  verifyPayment,
  createAddOnOrder,
  verifyAddOnPayment,
  completeBookingHandler,
} from "../../controllers/paymentController.js";

const router = Router();

// PART 3 Escrow Endpoints
router.post("/escrow/order", createEscrowOrder);
router.post("/escrow/verify", verifyEscrowPayment);
router.post("/escrow/release", releasePayout);
router.post("/escrow/release/:id", releasePayout);

// Base Pre-paid Escrow Order creation (Aliases)
router.post("/orders/base", createBaseOrder);
router.post("/orders", createBaseOrder);

// Base Pre-paid Escrow Payment Verification (Locks in Escrow)
router.post("/verify", verifyPayment);

// Add-On / Mutual Consent Overtime Order Creation
router.post("/orders/addon", createAddOnOrder);

// Add-On Payment Verification
router.post("/verify/addon", verifyAddOnPayment);

// Dual-Handshake Escrow Payout Release (Aliases)
router.post("/bookings/:id/complete", completeBookingHandler);
router.post("/release-payout/:id", completeBookingHandler);

export default router;
