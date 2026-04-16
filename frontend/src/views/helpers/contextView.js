export const buildContextSummary = (context = {}) => {
  const segments = [];

  if (context?.patientName) {
    segments.push(`Patient: ${context.patientName}`);
  }

  if (context?.disease) {
    segments.push(`Disease: ${context.disease}`);
  }

  if (context?.intent) {
    segments.push(`Intent: ${context.intent}`);
  }

  if (context?.location) {
    segments.push(`Location: ${context.location}`);
  }

  return segments.join(" | ");
};
