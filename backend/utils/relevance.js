import { sanitizeContext } from "./context.js";

const stopWords = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "of",
  "to",
  "in",
  "on",
  "with",
  "by",
  "about",
  "latest",
  "recent",
  "best",
]);

const followUpRegex =
  /\b(it|this|that|these|those|they|them|can i|should i|what about|is it safe|does it help|for that)\b/i;

const normalize = (text) => {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

const appendUniqueSegment = (segments, value) => {
  const normalizedValue = String(value || "").trim();
  if (!normalizedValue) {
    return;
  }

  const alreadyIncluded = segments.some(
    (segment) => segment.toLowerCase() === normalizedValue.toLowerCase()
  );

  if (!alreadyIncluded) {
    segments.push(normalizedValue);
  }
};

const getRecentUserMessages = (history = []) => {
  return (Array.isArray(history) ? history : []).filter((item) => item?.role === "user");
};

const getLatestUserSearch = (history = []) => {
  const recentUserMessages = getRecentUserMessages(history);
  const latestUserMessage = recentUserMessages[recentUserMessages.length - 1];

  return latestUserMessage?.searchQuery || latestUserMessage?.content || "";
};

const includesContextValue = (message, value) => {
  const normalizedMessage = normalize(message);
  const normalizedValue = normalize(value);

  if (!normalizedMessage || !normalizedValue) {
    return false;
  }

  return normalizedMessage.includes(normalizedValue);
};

const getSearchIntentHints = (message) => {
  const normalizedMessage = normalize(message);
  const hints = [];

  if (/\btrial|recruit|study\b/.test(normalizedMessage)) {
    hints.push("clinical trial");
  }

  if (/\bresearcher|scientist|author|expert\b/.test(normalizedMessage)) {
    hints.push("researcher");
    hints.push("publication");
  }

  if (/\btreatment|therapy|drug|medicine|supplement|vitamin\b/.test(normalizedMessage)) {
    hints.push("treatment");
  }

  if (/\blatest|recent|new|newest|current\b/.test(normalizedMessage)) {
    hints.push("recent");
  }

  if (!hints.length) {
    hints.push("research");
  }

  return hints;
};

const getQueryWords = (message) => {
  return normalize(message)
    .split(" ")
    .filter((word) => word && !stopWords.has(word));
};

const scoreText = (text, queryWords) => {
  const normalizedText = normalize(text);
  let score = 0;

  for (const word of queryWords) {
    if (normalizedText.includes(word)) {
      score += 3;
    }
  }

  if (queryWords.length > 1) {
    const phrase = queryWords.join(" ");
    if (normalizedText.includes(phrase)) {
      score += 6;
    }
  }

  return score;
};

const getYearScore = (year) => {
  const numericYear = Number(year);
  if (!numericYear) {
    return 0;
  }

  const currentYear = new Date().getFullYear();
  return Math.max(0, 6 - Math.min(6, currentYear - numericYear));
};

const getTrialStatusScore = (status = "") => {
  const normalizedStatus = String(status).toLowerCase();

  if (normalizedStatus.includes("recruiting")) return 4;
  if (normalizedStatus.includes("active")) return 3;
  if (normalizedStatus.includes("not yet recruiting")) return 2;
  if (normalizedStatus.includes("completed")) return 1;

  return 0;
};

const getCompletenessScore = (item, fields) => {
  return fields.reduce((score, field) => {
    return item?.[field] ? score + 1 : score;
  }, 0);
};

export const buildSearchQuery = (input) => {
  if (typeof input === "string") {
    const base = input.trim();
    const extras = [];

    if (!/treatment|therapy|trial|study|research/i.test(base)) {
      extras.push("treatment", "clinical trial", "research");
    }

    return [base, ...extras].join(" ").trim();
  }

  const message = String(input?.message || "").trim();
  const context = sanitizeContext(input?.context);
  const history = Array.isArray(input?.history) ? input.history : [];
  const segments = [];
  const latestUserSearch = getLatestUserSearch(history);
  const diseaseMissingFromMessage =
    Boolean(context.disease) && !includesContextValue(message, context.disease);
  const intentMissingFromMessage =
    Boolean(context.intent) && !includesContextValue(message, context.intent);
  const shouldUseHistory =
    !message ||
    message.split(/\s+/).filter(Boolean).length <= 5 ||
    followUpRegex.test(message) ||
    diseaseMissingFromMessage ||
    intentMissingFromMessage;

  if (shouldUseHistory) {
    appendUniqueSegment(segments, latestUserSearch);
  }

  appendUniqueSegment(segments, message);
  appendUniqueSegment(segments, context.disease);
  appendUniqueSegment(segments, context.intent);
  appendUniqueSegment(segments, context.location);

  getSearchIntentHints(`${message} ${context.intent}`.trim()).forEach((hint) => {
    appendUniqueSegment(segments, hint);
  });

  return segments.join(" ").trim();
};

export const rankPapers = (papers, message, limit = 6) => {
  const queryWords = getQueryWords(message);

  return [...papers]
    .map((paper) => {
      const searchText = [paper?.title, paper?.summary, paper?.authors, paper?.source]
        .filter(Boolean)
        .join(" ");

      return {
        ...paper,
        _score:
          scoreText(searchText, queryWords) +
          getYearScore(paper?.year) +
          getCompletenessScore(paper, ["summary", "authors", "url"]) +
          (paper?.source === "PubMed" ? 2 : 1),
      };
    })
    .sort((first, second) => second._score - first._score)
    .slice(0, limit)
    .map(({ _score, ...paper }) => paper);
};

export const rankTrials = (trials, message, limit = 5) => {
  const queryWords = getQueryWords(message);

  return [...trials]
    .map((trial) => {
      const searchText = [trial?.title, trial?.status, trial?.location, trial?.eligibility]
        .filter(Boolean)
        .join(" ");

      return {
        ...trial,
        _score:
          scoreText(searchText, queryWords) +
          getTrialStatusScore(trial?.status) +
          getCompletenessScore(trial, ["eligibility", "contact", "url"]),
      };
    })
    .sort((first, second) => second._score - first._score)
    .slice(0, limit)
    .map(({ _score, ...trial }) => trial);
};
