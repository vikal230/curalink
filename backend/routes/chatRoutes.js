import { Router } from "express";
import {
  handleChatRequest,
  handleSessionSearchesRequest,
  handleSessionRequest,
} from "../controllers/chatController.js";

const router = Router();

router.post("/chat", handleChatRequest);
router.get("/session/:sessionId", handleSessionRequest);
router.get("/session/:sessionId/searches", handleSessionSearchesRequest);

export default router;
