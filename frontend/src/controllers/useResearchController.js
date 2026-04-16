import { useEffect, useMemo, useState } from "react";
import {
  buildQueryFromInput,
  createEmptyContext,
  createSessionId,
  demoPrompts,
  formatCount,
  hydrateResponseDataFromSearch,
  parseAnswer,
  rememberSessionId,
  sanitizeContextForm,
  sectionLabelMap,
  sessionStorageKey,
} from "../models/researchModel";
import {
  fetchSessionSearches,
  fetchSessionSnapshot,
  submitResearchQuery,
} from "../services/chatApi";

const INITIAL_QUERY = "";
const INITIAL_LAST_QUERY = "No searches yet";

const attachSessionId = (searches = [], sessionId = "") => {
  return searches.map((search) => ({
    ...search,
    sessionId,
  }));
};

const sortSearches = (searches = []) => {
  return [...searches].sort((first, second) => {
    const firstTime = new Date(first?.createdAt || 0).getTime();
    const secondTime = new Date(second?.createdAt || 0).getTime();
    return secondTime - firstTime;
  });
};

const loadAllSearches = async (sessionIds = []) => {
  const searchGroups = await Promise.all(
    sessionIds.map(async (sessionId) => {
      try {
        const data = await fetchSessionSearches(sessionId);
        return attachSessionId(data.searches || [], sessionId);
      } catch {
        return [];
      }
    })
  );

  return sortSearches(searchGroups.flat());
};

export const useResearchController = () => {
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [contextForm, setContextForm] = useState(createEmptyContext());
  const [loading, setLoading] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [error, setError] = useState("");
  const [responseData, setResponseData] = useState(null);
  const [lastQuery, setLastQuery] = useState(INITIAL_LAST_QUERY);
  const [sessionId, setSessionId] = useState("");
  const [history, setHistory] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedSearchId, setSelectedSearchId] = useState("");

  const parsedAnswer = useMemo(
    () => parseAnswer(responseData?.answer || ""),
    [responseData]
  );

  const papers = responseData?.papers || [];
  const trials = responseData?.trials || [];
  const citations = responseData?.citations || [];
  const meta = useMemo(() => responseData?.meta || {}, [responseData]);
  const sourceErrors = meta?.sourceErrors || [];

  const stats = useMemo(
    () => [
      {
        label: "Publications",
        value: formatCount(meta.papersFound),
        helper: `${meta.totalPaperCandidates ?? 0} candidates searched`,
      },
      {
        label: "OpenAlex",
        value: formatCount(meta.openAlexFound),
        helper: `${meta.openAlexCandidates ?? 0} fetched`,
      },
      {
        label: "PubMed",
        value: formatCount(meta.pubMedFound),
        helper: `${meta.pubMedCandidates ?? 0} fetched`,
      },
      {
        label: "Trials",
        value: formatCount(meta.trialsFound),
        helper: `${meta.trialCandidates ?? 0} candidates ranked`,
      },
    ],
    [meta]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      const storedSessionId =
        window.localStorage.getItem(sessionStorageKey) || createSessionId();

      window.localStorage.setItem(sessionStorageKey, storedSessionId);
      const knownSessionIds = rememberSessionId(storedSessionId);
      setSessionId(storedSessionId);

      try {
        const sessionData = await fetchSessionSnapshot(storedSessionId);
        if (sessionData?.session) {
          setContextForm(sanitizeContextForm(sessionData.session.profile));
          setHistory(sessionData.session.messages || []);

          if (sessionData.session.latestSearch) {
            const latestSearch = {
              ...sessionData.session.latestSearch,
              sessionId: storedSessionId,
            };

            setSelectedSearchId(latestSearch.id || "");
            setLastQuery(latestSearch.query || INITIAL_LAST_QUERY);
            setResponseData(hydrateResponseDataFromSearch(latestSearch));
          }
        }
      } catch (sessionError) {
        console.error(sessionError);
      }

      const searches = await loadAllSearches(knownSessionIds);
      setRecentSearches(searches);
      setBootstrapping(false);
    };

    loadInitialData();
  }, []);

  const selectSearch = async (search) => {
    if (!search) {
      return;
    }

    const targetSessionId = String(search.sessionId || sessionId || "").trim();
    if (targetSessionId) {
      window.localStorage.setItem(sessionStorageKey, targetSessionId);
      rememberSessionId(targetSessionId);
      setSessionId(targetSessionId);
    }

    setSelectedSearchId(search.id || "");
    setLastQuery(search.query || INITIAL_LAST_QUERY);
    setResponseData(hydrateResponseDataFromSearch(search));
    setContextForm(sanitizeContextForm(search.context));
    setError("");

    if (!targetSessionId) {
      return;
    }

    try {
      const sessionData = await fetchSessionSnapshot(targetSessionId);
      if (sessionData?.session) {
        setContextForm(sanitizeContextForm(sessionData.session.profile));
        setHistory(sessionData.session.messages || []);
      }
    } catch (sessionError) {
      console.error(sessionError);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const resolvedQuery = buildQueryFromInput(query, contextForm);
    if (!resolvedQuery) {
      setError("Please enter a disease, treatment, or trial question.");
      return;
    }

    if (!sessionId) {
      setError("Session is still loading. Please try again.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await submitResearchQuery({
        context: sanitizeContextForm(contextForm),
        message: resolvedQuery,
        sessionId,
      });

      const knownSessionIds = rememberSessionId(sessionId);
      const latestSearch = data?.session?.latestSearch
        ? {
            ...data.session.latestSearch,
            sessionId,
          }
        : null;

      setLastQuery(resolvedQuery);
      setResponseData(data);
      setHistory(data?.session?.messages || []);
      setContextForm(sanitizeContextForm(data?.session?.profile || contextForm));
      setSelectedSearchId(latestSearch?.id || "");
      setQuery("");

      const searches = await loadAllSearches(knownSessionIds);
      setRecentSearches(searches);
    } catch (requestError) {
      setError(requestError?.message || "Failed to fetch medical research data.");
    } finally {
      setLoading(false);
    }
  };

  const updateContextField = (field, value) => {
    setContextForm((currentContext) => ({
      ...currentContext,
      [field]: value,
    }));
  };

  const resetSession = () => {
    if (sessionId) {
      rememberSessionId(sessionId);
    }

    const newSessionId = createSessionId();
    window.localStorage.setItem(sessionStorageKey, newSessionId);
    rememberSessionId(newSessionId);

    setSessionId(newSessionId);
    setContextForm(createEmptyContext());
    setHistory([]);
    setSelectedSearchId("");
    setResponseData(null);
    setLastQuery(INITIAL_LAST_QUERY);
    setQuery("");
    setError("");
  };

  return {
    applyPrompt: setQuery,
    bootstrapping,
    citations,
    contextForm,
    error,
    handleSubmit,
    history,
    lastQuery,
    loading,
    papers,
    parsedAnswer,
    prompts: demoPrompts,
    query,
    recentSearches,
    resetSession,
    responseData,
    sectionLabelMap,
    selectedSearchId,
    selectSearch,
    sessionId,
    setQuery,
    sourceErrors,
    stats,
    trials,
    updateContextField,
  };
};
