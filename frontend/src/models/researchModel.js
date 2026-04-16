export const demoPrompts = [
  "Latest treatment for lung cancer",
  "Clinical trials for diabetes",
  "Recent studies on heart disease",
  "Top researchers in Alzheimer's disease",
];

export const sectionLabelMap = {
  overview: "Condition Overview",
  insights: "Research Insights",
  trials: "Clinical Trials",
  sources: "Source Attribution",
};

export const sessionStorageKey = "curalink_session_id";
export const sessionHistoryStorageKey = "curalink_session_history";

export const contextFieldConfig = [
  { key: "patientName", label: "Patient Name", placeholder: "John Smith" },
  { key: "disease", label: "Disease", placeholder: "Parkinson's disease" },
  { key: "intent", label: "Intent", placeholder: "Deep brain stimulation" },
  { key: "location", label: "Location", placeholder: "Toronto, Canada" },
];

export const createEmptyContext = () => ({
  patientName: "",
  disease: "",
  intent: "",
  location: "",
});

export const sanitizeContextForm = (context = {}) => ({
  patientName: String(context?.patientName || "").trim(),
  disease: String(context?.disease || "").trim(),
  intent: String(context?.intent || "").trim(),
  location: String(context?.location || "").trim(),
});

export const createSessionId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `session-${Date.now()}`;
};

export const readStoredSessionIds = () => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(sessionHistoryStorageKey);
    const parsedValue = JSON.parse(rawValue || "[]");

    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

export const rememberSessionId = (sessionId) => {
  const cleanSessionId = String(sessionId || "").trim();
  if (!cleanSessionId || typeof window === "undefined") {
    return [];
  }

  const sessionIds = readStoredSessionIds();
  const nextSessionIds = [cleanSessionId, ...sessionIds.filter((item) => item !== cleanSessionId)];

  window.localStorage.setItem(sessionHistoryStorageKey, JSON.stringify(nextSessionIds));
  return nextSessionIds;
};

export const buildQueryFromInput = (query, context = {}) => {
  const trimmedQuery = String(query || "").trim();
  if (trimmedQuery) {
    return trimmedQuery;
  }

  const sanitizedContext = sanitizeContextForm(context);
  return [sanitizedContext.disease, sanitizedContext.intent, sanitizedContext.location]
    .filter(Boolean)
    .join(" ");
};

export const hydrateResponseDataFromSearch = (search) => {
  if (!search) {
    return null;
  }

  return {
    answer: search.answer || "",
    citations: search.citations || [],
    meta: search.meta || {},
    papers: search.papers || [],
    query: search.searchQuery || search.query || "",
    trials: search.trials || [],
  };
};

const splitLines = (value = "") =>
  String(value)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

const normalizeHeading = (line) =>
  line.replace(/^\d+\.\s*/, "").replace(/:$/, "").trim().toLowerCase();

const isBulletLine = (line) => /^[-*]\s*/.test(line);

const cleanBullet = (line) => line.replace(/^[-*]\s*/, "").trim();

export const parseAnswer = (answer = "") => {
  const lines = splitLines(answer);
  const sections = {
    overview: "",
    insights: [],
    trials: [],
    sources: [],
  };

  let currentSection = "";

  for (const line of lines) {
    const heading = normalizeHeading(line);

    if (heading.includes("condition overview")) {
      currentSection = "overview";
      const value = line.replace(/^\d+\.\s*[^:]+:\s*/i, "").trim();
      if (value) {
        sections.overview = value;
      }
      continue;
    }

    if (heading.includes("research insights")) {
      currentSection = "insights";
      continue;
    }

    if (heading.includes("clinical trials")) {
      currentSection = "trials";
      continue;
    }

    if (heading.includes("sources")) {
      currentSection = "sources";
      continue;
    }

    if (currentSection === "overview") {
      sections.overview = sections.overview ? `${sections.overview} ${line}` : line;
      continue;
    }

    if (currentSection && Array.isArray(sections[currentSection])) {
      sections[currentSection].push(isBulletLine(line) ? cleanBullet(line) : line);
    }
  }

  return sections;
};

export const formatCount = (count) => String(count ?? 0).padStart(2, "0");

export const getPaperLinkLabel = (paper) => {
  if (paper?.source === "OpenAlex") {
    return "View on OpenAlex";
  }

  return "View on PubMed";
};

export const getSourceSnippet = (item) => {
  const snippet = item?.summary || item?.eligibility || item?.contact || "";
  if (!snippet) {
    return "";
  }

  return snippet.length > 180 ? `${snippet.slice(0, 177)}...` : snippet;
};

export const formatConversationTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const buildInsightFallbacks = (responseData = {}) => {
  return (responseData.papers || [])
    .slice(0, 2)
    .map((paper) => paper.summary || paper.title)
    .filter(Boolean);
};

export const buildTrialFallbacks = (responseData = {}) => {
  return (responseData.trials || [])
    .slice(0, 3)
    .map((trial) => {
      const detail = [trial.title, trial.status].filter(Boolean).join(" - ");
      return detail || "";
    })
    .filter(Boolean);
};

export const buildSourceFallbacks = (responseData = {}) => {
  return (responseData.citations || [])
    .map((citation) => `${citation.id}: ${citation.title}`)
    .filter(Boolean);
};
