import { GroundingPanel } from "./GroundingPanel";
import {
  buildInsightFallbacks,
  buildSourceFallbacks,
  buildTrialFallbacks,
} from "../../models/researchModel";

const formatSectionIndex = (index) => String(index + 1).padStart(2, "0");

export const ReportPanel = ({
  citations = [],
  isLoading,
  lastQuery,
  parsedAnswer,
  responseData,
  sectionLabelMap,
}) => {
  const reportTitle = responseData?.answer
    ? `Evidence summary for ${lastQuery}`
    : "Evidence summary";

  const getSectionItems = (key) => {
    const parsedItems = parsedAnswer[key] || [];
    if (parsedItems.length) {
      return parsedItems;
    }

    if (key === "insights") {
      return buildInsightFallbacks(responseData);
    }

    if (key === "trials") {
      return buildTrialFallbacks(responseData);
    }

    if (key === "sources") {
      return buildSourceFallbacks(responseData);
    }

    return [];
  };

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-[0_28px_80px_rgba(2,6,23,0.35)] backdrop-blur-xl sm:p-8">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            Analysis Report
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{reportTitle}</h2>
        </div>

        {isLoading ? (
          <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100">
            Updating report...
          </span>
        ) : null}
      </div>

      {responseData?.answer ? (
        <div className="mt-8 space-y-8">
          {Object.entries(sectionLabelMap).map(([key, label], index) => (
            <article key={key} className="rounded-[1.5rem] border border-white/8 bg-slate-950/40 p-5">
              <div className="mb-4 flex items-center gap-3">
                <span className="text-xs font-semibold tracking-[0.24em] text-cyan-300/70">
                  {formatSectionIndex(index)}
                </span>
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                  {label}
                </h3>
              </div>

              {key === "overview" ? (
                <p className="text-sm leading-7 text-slate-200">
                  {parsedAnswer.overview || "No overview available from the model yet."}
                </p>
              ) : (
                <ul className="space-y-4">
                  {getSectionItems(key).length ? (
                    getSectionItems(key).map((item, itemIndex) => (
                      <li key={`${key}-${itemIndex}`} className="flex gap-4">
                        <span className="mt-1 text-xs font-semibold text-slate-500">
                          {formatSectionIndex(itemIndex)}
                        </span>
                        <p className="text-sm leading-7 text-slate-300">{item}</p>
                      </li>
                    ))
                  ) : (
                    <li className="text-sm italic text-slate-500">
                      No structured data returned for this section yet.
                    </li>
                  )}
                </ul>
              )}
            </article>
          ))}

          <GroundingPanel citations={citations} />
        </div>
      ) : (
        <div className="mt-8 flex min-h-[22rem] flex-col items-center justify-center rounded-[1.75rem] border border-dashed border-white/10 bg-slate-950/30 px-6 text-center">
          <p className="text-lg font-medium text-slate-200">
            Run a query to generate the first medical research report.
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            The report will combine ranked publications, clinical trials, and model
            reasoning into a structured summary.
          </p>
        </div>
      )}
    </section>
  );
};
