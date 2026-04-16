const contextFields = ["patientName", "disease", "intent", "location"];

const normalizeValue = (value = "") => String(value).trim();

export const sanitizeContext = (context = {}) => {
  return contextFields.reduce((accumulator, field) => {
    accumulator[field] = normalizeValue(context?.[field]);
    return accumulator;
  }, {});
};

export const mergeContext = (storedContext = {}, incomingContext = {}) => {
  const sanitizedStoredContext = sanitizeContext(storedContext);
  const sanitizedIncomingContext = sanitizeContext(incomingContext);

  return contextFields.reduce((accumulator, field) => {
    accumulator[field] = sanitizedIncomingContext[field] || sanitizedStoredContext[field] || "";
    return accumulator;
  }, {});
};

export const hasStructuredContext = (context = {}) => {
  const sanitizedContext = sanitizeContext(context);
  return contextFields.some((field) => Boolean(sanitizedContext[field]));
};

export const buildMessageFromContext = (context = {}) => {
  const sanitizedContext = sanitizeContext(context);
  const segments = [sanitizedContext.disease, sanitizedContext.intent, sanitizedContext.location]
    .filter(Boolean);

  return segments.join(" ");
};

export const buildContextSummary = (context = {}) => {
  const sanitizedContext = sanitizeContext(context);
  const summaryParts = [];

  if (sanitizedContext.patientName) {
    summaryParts.push(`Patient: ${sanitizedContext.patientName}`);
  }

  if (sanitizedContext.disease) {
    summaryParts.push(`Disease: ${sanitizedContext.disease}`);
  }

  if (sanitizedContext.intent) {
    summaryParts.push(`Intent: ${sanitizedContext.intent}`);
  }

  if (sanitizedContext.location) {
    summaryParts.push(`Location: ${sanitizedContext.location}`);
  }

  return summaryParts.join(" | ");
};

export const buildResolvedMessage = (message, context = {}) => {
  const trimmedMessage = normalizeValue(message);
  if (trimmedMessage) {
    return trimmedMessage;
  }

  return buildMessageFromContext(context);
};
