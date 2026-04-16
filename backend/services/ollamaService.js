import axios from "axios";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { buildContextSummary } from "../utils/context.js";
import { shortText } from "../utils/textUtils.js";

dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
});

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:1b";

const paperLine = (paper) => {
  const parts = [];

  parts.push(paper?.title || "Untitled paper");
  if (paper?.authors) parts.push(`Authors: ${shortText(paper.authors, 120)}`);
  if (paper?.year) parts.push(`Year: ${paper.year}`);
  if (paper?.source) parts.push(`Source: ${paper.source}`);
  if (paper?.url) parts.push(`URL: ${paper.url}`);
  if (paper?.summary) parts.push(`Summary: ${shortText(paper.summary, 180)}`);

  return parts.join(" | ");
};

const trialLine = (trial) => {
  return trial?.title || trial?.protocolSection?.identificationModule?.briefTitle || "Medical trial";
};

const citationLine = (citation) => {
  const parts = [
    citation?.id,
    citation?.title || "Untitled source",
    citation?.authors ? `Authors: ${shortText(citation.authors, 100)}` : "",
    citation?.year ? `Year: ${citation.year}` : "",
    citation?.platform ? `Platform: ${citation.platform}` : "",
    citation?.snippet ? `Snippet: ${shortText(citation.snippet, 180)}` : "",
  ].filter(Boolean);

  return parts.join(" | ");
};

const buildHistoryBlock = (history = []) => {
  const recentHistory = Array.isArray(history) ? history.slice(-4) : [];

  if (!recentHistory.length) {
    return "No previous conversation context.";
  }

  return recentHistory
    .map((item) => {
      const roleLabel = item.role === "assistant" ? "Assistant" : "User";
      const queryLabel = item.searchQuery ? ` | Search: ${shortText(item.searchQuery, 180)}` : "";
      return `${roleLabel}: ${shortText(item.content, 220)}${queryLabel}`;
    })
    .join("\n");
};

const buildPrompt = ({ citations, context, history, message, trials, papers }) => {
  const paperList = Array.isArray(papers) ? papers.slice(0, 5) : [];
  const trialList = Array.isArray(trials) ? trials.slice(0, 5) : [];
  const citationList = Array.isArray(citations) ? citations.slice(0, 8) : [];
  const contextSummary = buildContextSummary(context);

  const paperBlock = paperList.map((paper) => `- ${paperLine(paper)}`).join("\n");
  const trialBlock = trialList.map((trial) => `- ${trialLine(trial)}`).join("\n");
  const citationBlock = citationList.map((citation) => `- ${citationLine(citation)}`).join("\n");

  return [
    "You are Curalink, a medical research assistant.",
    "Follow the current session context very strictly.",
    "Use only the given data.",
    "Do not invent facts, medical advice, or sources.",
    "Do not switch to a different disease unless the user clearly changes the disease.",
    "If the user asks a short follow-up, keep using the current disease, intent, and location context.",
    "Every concrete claim must stay grounded in the provided publications or trials.",
    "When you mention a concrete finding, attach one or two citation IDs like [S1] or [S2].",
    "If evidence is missing, say that clearly instead of guessing.",
    "Write in short, direct sentences.",
    "Write 2 short bullets under Research Insights and 2 short bullets under Clinical Trials if data exists.",
    "Do not return headings only.",
    "",
    `Structured context: ${contextSummary || "Not provided."}`,
    "",
    `User query: ${message}`,
    "",
    "Recent conversation:",
    buildHistoryBlock(history),
    "",
    "Publications:",
    paperBlock || "No publications found.",
    "",
    "Clinical trials:",
    trialBlock || "No clinical trials found.",
    "",
    "Grounding citations:",
    citationBlock || "No grounded citations found.",
    "",
    "Output rules:",
    "1. Keep the answer tied to the active disease context.",
    "2. If publications exist, mention the strongest two insights first.",
    "3. If trials exist, mention status or recruiting signal when possible.",
    "4. Never cite a source ID that is not in the grounding list.",
    "5. Keep the Sources section limited to citation IDs and exact titles used.",
    "",
    "Write the answer in this format:",
    "1. Condition Overview: one short paragraph with citations if possible.",
    "2. Research Insights: 2 short bullets with citations.",
    "3. Clinical Trials: 2 short bullets with citations.",
    "4. Sources: list citation IDs with exact titles used.",
  ].join("\n");
};

const buildFallbackResponse = (message, citations, context, trials, papers) => {
  const topPaper = papers?.[0];
  const secondPaper = papers?.[1];
  const topTrial = trials?.[0];
  const secondTrial = trials?.[1];
  const contextSummary = buildContextSummary(context);
  const topCitation = citations?.[0];
  const secondCitation = citations?.[1];

  const overview = contextSummary
    ? `${message} was reviewed with the following context: ${contextSummary}.${topCitation ? ` [${topCitation.id}]` : ""}`
    : `${message} is being explored through recent research and active clinical trials.${topCitation ? ` [${topCitation.id}]` : ""}`;

  const researchLines = [];
  if (topPaper) researchLines.push(`- ${topPaper.title}${topCitation ? ` [${topCitation.id}]` : ""}`);
  if (secondPaper) researchLines.push(`- ${secondPaper.title}${secondCitation ? ` [${secondCitation.id}]` : ""}`);
  if (!researchLines.length) researchLines.push("- No strong publication found in the current search.");

  const trialLines = [];
  if (topTrial) trialLines.push(`- ${topTrial.title}`);
  if (secondTrial) trialLines.push(`- ${secondTrial.title}`);
  if (!trialLines.length) trialLines.push("- No active trial found in the current search.");

  const sources = (citations || [])
    .slice(0, 4)
    .map((item) => `- ${item.id}: ${item.title}`)
    .join("\n");

  return [
    `1. Condition Overview: ${overview}`,
    "2. Research Insights:",
    ...researchLines,
    "3. Clinical Trials:",
    ...trialLines,
    "4. Sources:",
    sources || "- No sources available.",
  ].join("\n");
};

export const generateMedicalResponse = async ({
  citations = [],
  context = {},
  history = [],
  message,
  papers,
  trials,
}) => {
  try {
    const response = await axios.post(
      `${OLLAMA_BASE_URL}/api/generate`,
      {
        model: OLLAMA_MODEL,
        prompt: buildPrompt({ citations, context, history, message, trials, papers }),
        stream: false,
        options: {
          num_predict: 220,
          temperature: 0.35,
        },
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const aiText = response.data?.response?.trim() || "";

    if (aiText.length < 80 || (/^1\.\s*/.test(aiText) && !aiText.includes("Sources:"))) {
      return buildFallbackResponse(message, citations, context, trials, papers);
    }

    return aiText;
  } catch (error) {
    const status = error?.response?.status;
    const errorText = error?.response?.data || error?.message || error;

    if (status) {
      console.error("Ollama error:", status, errorText);
    } else {
      console.error("Ollama connection error:", errorText);
    }

    if (status === 404) {
      return `Ollama model "${OLLAMA_MODEL}" not found. Run: ollama pull ${OLLAMA_MODEL}`;
    }

    return buildFallbackResponse(message, citations, context, trials, papers);
  }
};
