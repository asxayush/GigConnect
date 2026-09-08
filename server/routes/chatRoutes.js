import { Router } from "express";
import {
  getConversations,
  getMessages,
  sendMessage,
} from "../controllers/chatController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Routes for real-time messaging
router.use(protect);

router.route("/")
  .get(getConversations);

router.route("/:conversationId")
  .get(getMessages);

router.route("/:conversationId/messages")
  .post(sendMessage);

export default router;
