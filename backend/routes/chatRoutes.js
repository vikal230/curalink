import { Router } from "express";
import {
  handleArchiveSearchRequest,
  handleChatRequest,
  handleSessionSearchesRequest,
  handleSessionRequest,
} from "../controllers/chatController.js";

const router = Router();

router.post("/chat", handleChatRequest);
router.get("/session/:sessionId", handleSessionRequest);
router.get("/session/:sessionId/searches", handleSessionSearchesRequest);
router.delete("/session/:sessionId/searches/:searchId", handleArchiveSearchRequest);

export default router;
