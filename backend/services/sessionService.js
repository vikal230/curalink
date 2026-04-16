import { Session } from "../models/Session.js";
import {
  buildResolvedMessage,
  mergeContext,
  sanitizeContext,
} from "../utils/context.js";

const DEFAULT_HISTORY_LIMIT = 8;
const STORED_HISTORY_LIMIT = 20;
const STORED_SEARCH_LIMIT = 12;

const formatMessage = (message = {}) => ({
  role: message.role,
  content: message.content,
  createdAt: message.createdAt,
  searchQuery: message.searchQuery || "",
});

const formatSearch = (search = {}) => ({
  id: String(search._id || ""),
  query: search.query || "",
  searchQuery: search.searchQuery || "",
  context: sanitizeContext(search.context),
  answer: search.answer || "",
  papers: search.papers || [],
  trials: search.trials || [],
  citations: search.citations || [],
  meta: search.meta || {},
  createdAt: search.createdAt,
  archivedAt: search.archivedAt || null,
});

const createSession = async (sessionId, profile) => {
  return Session.create({
    sessionId,
    profile,
    messages: [],
    searches: [],
    archivedSearches: [],
  });
};

const getLatestSearch = (searches = []) => {
  if (!searches.length) {
    return null;
  }

  return formatSearch(searches[searches.length - 1]);
};

export const getOrCreateSession = async (sessionId, incomingContext = {}) => {
  const cleanIncomingContext = sanitizeContext(incomingContext);
  let session = await Session.findOne({ sessionId });

  if (!session) {
    return createSession(sessionId, cleanIncomingContext);
  }

  const mergedProfile = mergeContext(session.profile, cleanIncomingContext);
  const profileChanged =
    JSON.stringify(sanitizeContext(session.profile)) !== JSON.stringify(mergedProfile);

  if (!profileChanged) {
    return session;
  }

  session.profile = mergedProfile;
  await session.save();
  return session;
};

export const recordConversationTurn = async ({
  answer,
  citations,
  context,
  message,
  meta,
  papers,
  searchQuery,
  sessionId,
  trials,
}) => {
  const session = await Session.findOne({ sessionId });
  if (!session) {
    return null;
  }

  session.profile = sanitizeContext(context);
  session.messages.push(
    {
      role: "user",
      content: buildResolvedMessage(message, context),
      searchQuery,
    },
    {
      role: "assistant",
      content: answer,
      meta: {
        papersFound: meta?.papersFound ?? 0,
        trialsFound: meta?.trialsFound ?? 0,
      },
    }
  );

  if (session.messages.length > STORED_HISTORY_LIMIT) {
    session.messages = session.messages.slice(-STORED_HISTORY_LIMIT);
  }

  session.searches.push({
    query: buildResolvedMessage(message, context),
    searchQuery,
    context: sanitizeContext(context),
    answer,
    papers,
    trials,
    citations,
    meta,
  });

  if (session.searches.length > STORED_SEARCH_LIMIT) {
    session.searches = session.searches.slice(-STORED_SEARCH_LIMIT);
  }

  await session.save();
  return session;
};

export const getSessionSnapshot = async (sessionId, historyLimit = DEFAULT_HISTORY_LIMIT) => {
  const session = await Session.findOne({ sessionId });
  if (!session) {
    return null;
  }

  const recentSearches = session.searches
    .slice()
    .reverse()
    .map(formatSearch);

  return {
    sessionId: session.sessionId,
    profile: sanitizeContext(session.profile),
    messages: session.messages.slice(-historyLimit).map(formatMessage),
    latestSearch: getLatestSearch(session.searches),
    recentSearches,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
};

export const getSessionSearches = async (sessionId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) {
    return [];
  }

  return session.searches
    .slice()
    .reverse()
    .map(formatSearch);
};

export const archiveSearchRecord = async (sessionId, searchId) => {
  const session = await Session.findOne({ sessionId });
  if (!session) {
    return { archived: false, snapshot: null };
  }

  const searchIndex = session.searches.findIndex(
    (search) => String(search._id || "") === String(searchId || "")
  );

  if (searchIndex === -1) {
    return { archived: false, snapshot: await getSessionSnapshot(sessionId) };
  }

  const searchToArchive = session.searches[searchIndex]?.toObject
    ? session.searches[searchIndex].toObject()
    : session.searches[searchIndex];

  session.searches.splice(searchIndex, 1);
  session.archivedSearches.push({
    ...searchToArchive,
    archivedAt: new Date(),
  });

  await session.save();

  return {
    archived: true,
    snapshot: await getSessionSnapshot(sessionId),
  };
};
