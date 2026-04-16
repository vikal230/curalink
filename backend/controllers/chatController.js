import { fetchResearchData } from "../services/researchService.js";
import { generateMedicalResponse } from "../services/ollamaService.js";
import {
  archiveSearchRecord,
  getOrCreateSession,
  getSessionSearches,
  getSessionSnapshot,
  recordConversationTurn,
} from "../services/sessionService.js";
import {
  buildResolvedMessage,
  hasStructuredContext,
  mergeContext,
  sanitizeContext,
} from "../utils/context.js";

const resolveSessionId = (value) => String(value || "").trim();

const buildNoEvidenceAnswer = ({ message, sourceErrors }) => {
  const liveSourceIssue = Array.isArray(sourceErrors) && sourceErrors.length > 0;

  if (liveSourceIssue) {
    return [
      `1. Condition Overview: A live evidence-backed answer for "${message}" could not be generated because the medical source APIs did not return usable data in this run.`,
      "2. Research Insights:",
      "- No publication evidence was available from the live sources right now.",
      "3. Clinical Trials:",
      "- No clinical trial evidence was available from the live sources right now.",
      "4. Sources:",
      "- No live source entries were saved for this run.",
    ].join("\n");
  }

  return [
    `1. Condition Overview: No strong live evidence was found for "${message}" in the current search window.`,
    "2. Research Insights:",
    "- No publication matched the current search strongly enough to include in the report.",
    "3. Clinical Trials:",
    "- No relevant clinical trial matched the current search strongly enough to include in the report.",
    "4. Sources:",
    "- No source entries were selected for this run.",
  ].join("\n");
};

export const handleChatRequest = async (req, res) => {
  const sessionId = resolveSessionId(req.body?.sessionId);
  const incomingContext = sanitizeContext(req.body?.context || {});

  if (!sessionId) {
    return res.status(400).json({ success: false, error: "Session ID is required" });
  }

  try {
    const session = await getOrCreateSession(sessionId, incomingContext);
    const effectiveContext = mergeContext(session?.profile, incomingContext);
    const message = buildResolvedMessage(req.body?.message, effectiveContext);

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "A natural query or structured medical context is required.",
      });
    }

    console.log(`[API] Processing request for session ${sessionId}: ${message}`);

    const history = (session?.messages || []).slice(-10);
    const researchData = await fetchResearchData({
      history,
      message,
      context: effectiveContext,
    });

    console.log(
      `[API] Fetched ${researchData.clinicalTrials.length} trials, ${researchData.openAlexPapers.length} OpenAlex papers and ${researchData.pubMedPapers.length} PubMed papers. Generating AI response...`
    );

    const hasEvidence =
      researchData.rankedPapers.length > 0 ||
      researchData.rankedTrials.length > 0 ||
      researchData.citations.length > 0;
    const answer = hasEvidence
      ? await generateMedicalResponse({
          citations: researchData.citations,
          context: effectiveContext,
          history,
          message,
          papers: researchData.rankedPapers,
          trials: researchData.rankedTrials,
        })
      : buildNoEvidenceAnswer({
          message,
          sourceErrors: researchData.counts?.sourceErrors,
        });

    await recordConversationTurn({
      answer,
      context: effectiveContext,
      citations: researchData.citations,
      message,
      meta: researchData.counts,
      papers: researchData.rankedPapers,
      searchQuery: researchData.searchQuery,
      sessionId,
      trials: researchData.rankedTrials,
    });

    const updatedSession = await getSessionSnapshot(sessionId);

    return res.status(200).json({
      success: true,
      answer,
      citations: researchData.citations,
      papers: researchData.rankedPapers,
      trials: researchData.rankedTrials,
      query: researchData.searchQuery,
      meta: researchData.counts,
      session: updatedSession,
    });
  } catch (error) {
    console.error("[Server Error]:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const handleSessionRequest = async (req, res) => {
  const sessionId = resolveSessionId(req.params?.sessionId);

  if (!sessionId) {
    return res.status(400).json({ success: false, error: "Session ID is required" });
  }

  try {
    const session = await getSessionSnapshot(sessionId);

    return res.status(200).json({
      success: true,
      session,
      hasContext: hasStructuredContext(session?.profile),
    });
  } catch (error) {
    console.error("[Session Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to load session" });
  }
};

export const handleSessionSearchesRequest = async (req, res) => {
  const sessionId = resolveSessionId(req.params?.sessionId);

  if (!sessionId) {
    return res.status(400).json({ success: false, error: "Session ID is required" });
  }

  try {
    const searches = await getSessionSearches(sessionId);

    return res.status(200).json({
      success: true,
      searches,
    });
  } catch (error) {
    console.error("[Search History Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to load search history" });
  }
};

export const handleArchiveSearchRequest = async (req, res) => {
  const sessionId = resolveSessionId(req.params?.sessionId);
  const searchId = resolveSessionId(req.params?.searchId);

  if (!sessionId || !searchId) {
    return res.status(400).json({
      success: false,
      error: "Session ID and search ID are required",
    });
  }

  try {
    const result = await archiveSearchRecord(sessionId, searchId);

    return res.status(200).json({
      success: true,
      archived: result.archived,
      session: result.snapshot,
    });
  } catch (error) {
    console.error("[Archive Search Error]:", error);
    return res.status(500).json({ success: false, error: "Failed to archive search" });
  }
};
