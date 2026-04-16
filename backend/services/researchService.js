import axios from "axios";
import { buildSearchQuery, rankPapers, rankTrials } from "../utils/relevance.js";
import { cleanText, shortText } from "../utils/textUtils.js";

const REQUEST_TIMEOUT = 15000;
const CLINICAL_TRIAL_PAGE_SIZE = 50;
const CLINICAL_TRIAL_MAX_PAGES = 2;
const OPEN_ALEX_PAGE_SIZE = 30;
const OPEN_ALEX_MAX_PAGES = 3;
const PUBMED_LIMIT = 80;
const FINAL_TRIAL_LIMIT = 5;
const FINAL_PAPER_LIMIT = 6;
const FINAL_CITATION_LIMIT = 8;
const PUBMED_BATCH_SIZE = 20;
const PUBMED_QUERY_LIMIT = 3;

const CLINICAL_TRIAL_STATUSES = [
  "RECRUITING",
  "ACTIVE_NOT_RECRUITING",
  "COMPLETED",
];

const OPEN_ALEX_SORTS = ["relevance_score:desc", "publication_date:desc"];
const PUBMED_TOOL = process.env.NCBI_TOOL || "curalink";
const PUBMED_EMAIL = process.env.NCBI_EMAIL || "";
const PUBMED_API_KEY = process.env.NCBI_API_KEY || "";
const PUBMED_HEADERS = {
  "User-Agent": "Curalink/1.0 (medical research assistant)",
};

const requestJson = (url, options = {}) => {
  return axios.get(url, {
    timeout: REQUEST_TIMEOUT,
    headers: options.headers || PUBMED_HEADERS,
    ...options,
  });
};

const requestText = (url) => {
  return axios.get(url, {
    timeout: REQUEST_TIMEOUT,
    responseType: "text",
    headers: PUBMED_HEADERS,
  });
};

const sanitizeTrialText = (value = "") => {
  return toCleanString(value).replace(/[^a-z0-9\s-]/gi, " ");
};

const buildClinicalTrialsUrl = (candidate = {}, status = "", pageToken = "") => {
  const params = new URLSearchParams();

  if (candidate.condition) {
    params.set("query.cond", candidate.condition);
  }

  if (candidate.term) {
    params.set("query.term", candidate.term);
  }

  if (status) {
    params.set("filter.overallStatus", status);
  }

  params.set("pageSize", String(CLINICAL_TRIAL_PAGE_SIZE));
  params.set("format", "json");

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  return `https://clinicaltrials.gov/api/v2/studies?${params.toString()}`;
};

const buildOpenAlexUrl = (query, page = 1, sort = "relevance_score:desc") => {
  const encodedQuery = encodeURIComponent(query);
  const encodedSort = encodeURIComponent(sort);
  return `https://api.openalex.org/works?search=${encodedQuery}&per-page=${OPEN_ALEX_PAGE_SIZE}&page=${page}&sort=${encodedSort}`;
};

const buildPubMedSearchUrl = (query) => {
  const encodedQuery = encodeURIComponent(query);
  const toolPart = `&tool=${encodeURIComponent(PUBMED_TOOL)}`;
  const emailPart = PUBMED_EMAIL ? `&email=${encodeURIComponent(PUBMED_EMAIL)}` : "";
  const apiKeyPart = PUBMED_API_KEY
    ? `&api_key=${encodeURIComponent(PUBMED_API_KEY)}`
    : "";

  return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodedQuery}&retmax=${PUBMED_LIMIT}&sort=pub+date&retmode=json${toolPart}${emailPart}${apiKeyPart}`;
};

const buildPubMedFetchUrl = (ids) => {
  const toolPart = `&tool=${encodeURIComponent(PUBMED_TOOL)}`;
  const emailPart = PUBMED_EMAIL ? `&email=${encodeURIComponent(PUBMED_EMAIL)}` : "";
  const apiKeyPart = PUBMED_API_KEY
    ? `&api_key=${encodeURIComponent(PUBMED_API_KEY)}`
    : "";

  return `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${ids.join(",")}&retmode=xml${toolPart}${emailPart}${apiKeyPart}`;
};

const toCleanString = (value = "") => cleanText(String(value || "").trim());

const normalizeKey = (value = "") => {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
};

const dedupeItems = (items, getKey) => {
  const seen = new Set();

  return items.filter((item) => {
    const key = getKey(item);
    if (!key || seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
};

const dedupePapers = (papers) => {
  return dedupeItems(papers, (paper) => normalizeKey(paper?.url || paper?.title));
};

const dedupeTrials = (trials) => {
  return dedupeItems(trials, (trial) => normalizeKey(trial?.url || trial?.title));
};

const uniqueStrings = (values = []) => {
  const seen = new Set();
  const items = [];

  for (const value of values) {
    const cleanValue = toCleanString(value);
    const key = cleanValue.toLowerCase();

    if (!cleanValue || seen.has(key)) {
      continue;
    }

    seen.add(key);
    items.push(cleanValue);
  }

  return items;
};

const joinParts = (...values) => {
  return uniqueStrings(values).join(" ");
};

const buildPublicationQueries = ({ message, context, history, searchQuery }) => {
  const disease = context?.disease || "";
  const intent = context?.intent || "";
  const latestSearch = history
    .filter((item) => item?.role === "user")
    .slice(-1)[0]?.searchQuery;

  return uniqueStrings([
    joinParts(message, disease, intent),
    joinParts(disease, intent),
    joinParts(message, disease),
    message,
    latestSearch,
    disease,
    searchQuery,
  ]).slice(0, 5);
};

const buildTrialQueries = ({ message, context, history, searchQuery }) => {
  const disease = context?.disease || "";
  const intent = context?.intent || "";
  const latestSearch = history
    .filter((item) => item?.role === "user")
    .slice(-1)[0]?.searchQuery;
  const condition = sanitizeTrialText(disease || message || latestSearch || searchQuery);
  const broadTerm = sanitizeTrialText(joinParts(intent, message));
  const latestTerm = sanitizeTrialText(latestSearch);
  const searchTerm = sanitizeTrialText(searchQuery);

  return [
    {
      condition,
      term: broadTerm,
      label: "condition + intent",
    },
    {
      condition,
      term: latestTerm,
      label: "condition + latest search",
    },
    {
      condition,
      term: searchTerm,
      label: "condition + expanded query",
    },
    {
      condition,
      term: "",
      label: "condition only",
    },
  ].filter((candidate, index, items) => {
    const key = `${candidate.condition}::${candidate.term}`;
    const isDuplicate = items.findIndex((item) => `${item.condition}::${item.term}` === key) !== index;
    return candidate.condition && !isDuplicate;
  });
};

const extractOpenAlexAbstract = (abstractIndex) => {
  if (!abstractIndex) {
    return "";
  }

  const orderedWords = Object.entries(abstractIndex)
    .flatMap(([word, positions]) => positions.map((position) => [position, word]))
    .sort((a, b) => a[0] - b[0])
    .map(([, word]) => word);

  return cleanText(orderedWords.join(" "));
};

const extractPubMedText = (articleXml, tagName) => {
  const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, "i");
  const match = articleXml.match(pattern);
  return cleanText(match?.[1] || "");
};

const extractPubMedYear = (articleXml) => {
  const pubDateMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/i);
  if (pubDateMatch?.[1]) {
    return pubDateMatch[1];
  }

  const articleDateMatch = articleXml.match(/<ArticleDate[^>]*>[\s\S]*?<Year>(\d{4})<\/Year>/i);
  if (articleDateMatch?.[1]) {
    return articleDateMatch[1];
  }

  return "";
};

const extractPubMedPmid = (articleXml) => {
  const pmidMatch = articleXml.match(/<PMID[^>]*>(\d+)<\/PMID>/i);
  return pmidMatch?.[1] || "";
};

const extractPubMedAuthors = (articleXml) => {
  const authorBlockRegex =
    /<Author>[\s\S]*?(?:<LastName>(.*?)<\/LastName>[\s\S]*?<ForeName>(.*?)<\/ForeName>|<CollectiveName>(.*?)<\/CollectiveName>)[\s\S]*?<\/Author>/gi;

  const authorMatches = [...articleXml.matchAll(authorBlockRegex)];
  const authors = authorMatches.map((match) => {
    const lastName = match[1]?.trim();
    const foreName = match[2]?.trim();
    const collectiveName = match[3]?.trim();

    if (collectiveName) {
      return collectiveName;
    }

    return `${foreName || ""} ${lastName || ""}`.trim();
  });

  return authors.filter(Boolean).join(", ");
};

const parsePubMedArticles = (xml, ids) => {
  const articleMatches = [...xml.matchAll(/<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/gi)];

  return articleMatches.map((match, index) => {
    const articleXml = match[1];
    const title = extractPubMedText(articleXml, "ArticleTitle") || "PubMed paper";
    const abstract = [...articleXml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/gi)]
      .map((item) => cleanText(item[1]))
      .filter(Boolean)
      .join(" ");

    const authors = extractPubMedAuthors(articleXml);
    const year = extractPubMedYear(articleXml);
    const pmid = extractPubMedPmid(articleXml) || ids[index] || "";

    return {
      source: "PubMed",
      title,
      authors,
      year,
      url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : "",
      summary: abstract,
    };
  });
};

const formatContact = (contact = {}) => {
  const pieces = [contact.name, contact.phone, contact.email].filter(Boolean);
  return pieces.join(" | ");
};

const getTrialContact = (section = {}) => {
  const centralContact = section.contactsLocationsModule?.centralContacts?.[0];
  const locationContact = section.contactsLocationsModule?.locations?.[0]?.contacts?.[0];

  return formatContact(centralContact) || formatContact(locationContact) || "";
};

const getTrialLocation = (section = {}) => {
  const firstLocation = section.contactsLocationsModule?.locations?.[0] || {};

  return [firstLocation.city, firstLocation.state, firstLocation.country]
    .filter(Boolean)
    .join(", ");
};

const mapClinicalTrial = (study) => {
  const section = study?.protocolSection || {};

  return {
    source: "ClinicalTrials.gov",
    title: section.identificationModule?.briefTitle || "Clinical Trial",
    status: section.statusModule?.overallStatus || "",
    location: getTrialLocation(section),
    eligibility: cleanText(section.eligibilityModule?.eligibilityCriteria || ""),
    contact: getTrialContact(section),
    url: section.identificationModule?.nctId
      ? `https://clinicaltrials.gov/study/${section.identificationModule.nctId}`
      : "",
  };
};

const mapOpenAlexPaper = (work) => ({
  source: "OpenAlex",
  title: work?.title || "Untitled paper",
  authors: (work?.authorships || [])
    .map((item) => item?.author?.display_name)
    .filter(Boolean)
    .join(", "),
  year: work?.publication_year || "",
  url: work?.primary_location?.landing_page_url || work?.id || "",
  summary: extractOpenAlexAbstract(work?.abstract_inverted_index),
});

const withSourceFallback = async (sourceName, loader) => {
  try {
    return {
      source: sourceName,
      data: await loader(),
      error: null,
    };
  } catch (error) {
    console.error(`[${sourceName}] fetch failed:`, error?.message || error);
    return {
      source: sourceName,
      data: [],
      error: {
        source: sourceName,
        message: `${sourceName} is temporarily unavailable, so the report was generated with partial data.`,
      },
    };
  }
};

const isBadClinicalTrialsRequest = (error) => {
  return Number(error?.response?.status) === 400;
};

const tryClinicalTrialsRequest = async (candidate, status, pageToken = "") => {
  const primaryUrl = buildClinicalTrialsUrl(candidate, status, pageToken);

  try {
    return await requestJson(primaryUrl);
  } catch (error) {
    const canRetrySimple =
      isBadClinicalTrialsRequest(error) && candidate?.term;

    if (!canRetrySimple) {
      throw error;
    }

    const fallbackUrl = buildClinicalTrialsUrl(
      { condition: candidate.condition, term: "" },
      status,
      pageToken
    );

    return requestJson(fallbackUrl);
  }
};

const fetchClinicalTrials = async (queries) => {
  const allTrials = [];
  const queryList = Array.isArray(queries) ? queries : [queries];

  for (const candidate of queryList) {
    if (!candidate?.condition) {
      continue;
    }

    for (const status of CLINICAL_TRIAL_STATUSES) {
      let pageToken = "";

      for (let pageIndex = 0; pageIndex < CLINICAL_TRIAL_MAX_PAGES; pageIndex += 1) {
        try {
          const response = await tryClinicalTrialsRequest(candidate, status, pageToken);
          const studies = response.data?.studies || [];

          allTrials.push(...studies.map(mapClinicalTrial));

          pageToken = response.data?.nextPageToken || "";
          if (!pageToken) {
            break;
          }
        } catch (error) {
          console.error(
            `[ClinicalTrials.gov] request failed for ${candidate.label || candidate.condition} (${status})`,
            error?.message || error
          );
          break;
        }
      }
    }
  }

  return dedupeTrials(allTrials);
};

const fetchOpenAlex = async (queries) => {
  const allPapers = [];
  const queryList = Array.isArray(queries) ? queries : [queries];

  for (const query of queryList) {
    if (!query) {
      continue;
    }

    for (const sort of OPEN_ALEX_SORTS) {
      for (let page = 1; page <= OPEN_ALEX_MAX_PAGES; page += 1) {
        const url = buildOpenAlexUrl(query, page, sort);
        const response = await requestJson(url);
        const works = response.data?.results || [];

        allPapers.push(...works.map(mapOpenAlexPaper));

        if (works.length < OPEN_ALEX_PAGE_SIZE) {
          break;
        }
      }
    }
  }

  return dedupePapers(allPapers);
};

const fetchPubMed = async (queries) => {
  const queryList = (Array.isArray(queries) ? queries : [queries]).slice(0, PUBMED_QUERY_LIMIT);
  const allIds = [];

  for (const query of queryList) {
    if (!query) {
      continue;
    }

    try {
      const searchUrl = buildPubMedSearchUrl(query);
      const searchResponse = await requestJson(searchUrl);
      const ids = searchResponse.data?.esearchresult?.idlist || [];

      allIds.push(...ids);
    } catch (error) {
      console.error(`[PubMed] search query failed: ${query}`, error?.message || error);
    }
  }

  const ids = uniqueStrings(allIds).slice(0, PUBMED_LIMIT);
  if (!ids.length) {
    return [];
  }

  const papers = [];

  for (let index = 0; index < ids.length; index += PUBMED_BATCH_SIZE) {
    const batchIds = ids.slice(index, index + PUBMED_BATCH_SIZE);

    try {
      const fetchUrl = buildPubMedFetchUrl(batchIds);
      const fetchResponse = await requestText(fetchUrl);
      papers.push(...parsePubMedArticles(fetchResponse.data || "", batchIds));
    } catch (error) {
      console.error(
        `[PubMed] fetch batch failed: ${batchIds.join(",")}`,
        error?.message || error
      );
    }
  }

  return dedupePapers(papers);
};

const buildCitationSnippet = (item) => {
  return shortText(item?.summary || item?.eligibility || item?.contact || "", 220);
};

const buildCitation = (item, index) => ({
  id: `S${index + 1}`,
  title: item?.title || "Untitled source",
  authors: item?.authors || "",
  year: item?.year || "",
  platform: item?.source || "",
  url: item?.url || "",
  snippet: buildCitationSnippet(item),
  type: item?.source === "ClinicalTrials.gov" ? "trial" : "publication",
});

const buildCitations = (papers, trials) => {
  return [...papers, ...trials]
    .slice(0, FINAL_CITATION_LIMIT)
    .map(buildCitation);
};

const buildRankingQuery = (message, context = {}) => {
  return [message, context?.disease, context?.intent, context?.location]
    .filter(Boolean)
    .join(" ");
};

const buildCounts = ({
  clinicalTrials,
  openAlexPapers,
  pubMedPapers,
  rankedTrials,
  rankedPapers,
  sourceErrors,
}) => {
  return {
    papersFound: rankedPapers.length,
    openAlexFound: openAlexPapers.length,
    pubMedFound: pubMedPapers.length,
    trialsFound: rankedTrials.length,
    totalPaperCandidates: pubMedPapers.length + openAlexPapers.length,
    openAlexCandidates: openAlexPapers.length,
    pubMedCandidates: pubMedPapers.length,
    trialCandidates: clinicalTrials.length,
    sourceErrors,
  };
};

export const fetchResearchData = async (requestInput) => {
  const message =
    typeof requestInput === "string" ? requestInput : requestInput?.message || "";
  const context = typeof requestInput === "string" ? {} : requestInput?.context || {};
  const history = typeof requestInput === "string" ? [] : requestInput?.history || [];
  const searchQuery = buildSearchQuery({ message, context, history });
  const publicationQueries = buildPublicationQueries({
    message,
    context,
    history,
    searchQuery,
  });
  const trialQueries = buildTrialQueries({
    message,
    context,
    history,
    searchQuery,
  });

  const [clinicalTrialsResult, openAlexResult, pubMedResult] = await Promise.all([
    withSourceFallback("ClinicalTrials.gov", () => fetchClinicalTrials(trialQueries)),
    withSourceFallback("OpenAlex", () => fetchOpenAlex(publicationQueries)),
    withSourceFallback("PubMed", () => fetchPubMed(publicationQueries)),
  ]);

  const clinicalTrials = clinicalTrialsResult.data;
  const openAlexPapers = openAlexResult.data;
  const pubMedPapers = pubMedResult.data;
  const sourceErrors = [clinicalTrialsResult, openAlexResult, pubMedResult]
    .map((result) => result.error)
    .filter(Boolean);
  const rankingQuery = buildRankingQuery(message, context);

  const rankedTrials = rankTrials(clinicalTrials, rankingQuery, FINAL_TRIAL_LIMIT);
  const rankedPapers = rankPapers(
    [...pubMedPapers, ...openAlexPapers],
    rankingQuery,
    FINAL_PAPER_LIMIT
  );
  const citations = buildCitations(rankedPapers, rankedTrials);

  return {
    searchQuery,
    clinicalTrials,
    openAlexPapers,
    pubMedPapers,
    rankedTrials,
    rankedPapers,
    citations,
    counts: buildCounts({
      clinicalTrials,
      openAlexPapers,
      pubMedPapers,
      rankedTrials,
      rankedPapers,
      sourceErrors,
    }),
  };
};

export { fetchClinicalTrials, fetchOpenAlex, fetchPubMed };
