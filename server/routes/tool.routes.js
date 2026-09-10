import express from "express";
import { createTool, getTools, rentTool, returnTool } from "../controllers/tool.controller.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/")
  .get(getTools)
  .post(protect, createTool);

router.post("/:id/rent", protect, rentTool);
router.post("/:id/return", protect, returnTool);

export default router;
