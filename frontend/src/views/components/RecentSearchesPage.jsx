import { formatConversationTime } from "../../models/researchModel";
import { ReportPanel } from "./ReportPanel";
import { SourcesSidebar } from "./SourcesSidebar";

const SearchChip = ({ isActive, onArchive, onClick, search }) => {
  const diseaseLabel = search.context?.disease || "General search";
  const patientLabel = search.context?.patientName || "No patient name";
  const queryLabel = search.query || "Open saved report";
  const chipClasses = isActive
    ? "border-cyan-300/30 bg-cyan-400/10"
    : "border-white/10 bg-white/5 hover:border-cyan-300/20";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[180px] w-full rounded-[1.7rem] border p-5 text-left transition ${chipClasses}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Disease</p>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onArchive(search);
          }}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-sm text-slate-300 transition hover:border-rose-300/30 hover:text-rose-200"
          aria-label="Delete saved report"
          title="Delete saved report"
        >
          x
        </button>
      </div>
      <p className="mt-2 break-words text-lg font-semibold text-white">{diseaseLabel}</p>
      <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-slate-500">
        Patient
      </p>
      <p className="mt-2 break-words text-sm text-slate-300">{patientLabel}</p>
      <p className="mt-4 text-[11px] uppercase tracking-[0.22em] text-slate-500">Query</p>
      <p className="mt-2 h-12 overflow-hidden break-words text-sm leading-6 text-slate-400">
        {queryLabel}
      </p>
      <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        {formatConversationTime(search.createdAt) || "Saved search"}
      </p>
    </button>
  );
};

export const RecentSearchesPage = ({
  citations,
  history,
  lastQuery,
  parsedAnswer,
  recentSearches,
  responseData,
  sectionLabelMap,
  selectedSearchId,
  sessionContext,
  onArchiveSearch,
  onSelectSearch,
}) => {
  if (!recentSearches.length) {
    return (
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <p className="text-lg font-medium text-white">No saved diseases or searches yet.</p>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Run a real search first. After that, this page will reopen the full stored
          report from MongoDB.
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0 space-y-8">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
          Recent Diseases
        </p>
        <h2 className="mt-2 text-2xl font-bold text-white">
          Open any saved disease report again
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Each item below is a real search saved in MongoDB. Click one card to load that
          full report again.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {recentSearches.map((search) => (
            <SearchChip
              key={search.id}
              isActive={selectedSearchId === search.id}
              onArchive={onArchiveSearch}
              onClick={() => onSelectSearch(search)}
              search={search}
            />
          ))}
        </div>
      </div>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <ReportPanel
          citations={citations}
          isLoading={false}
          lastQuery={lastQuery}
          parsedAnswer={parsedAnswer}
          responseData={responseData}
          sectionLabelMap={sectionLabelMap}
        />

        <SourcesSidebar
          history={history}
          sessionContext={sessionContext}
          papers={responseData?.papers || []}
          trials={responseData?.trials || []}
        />
      </section>
    </section>
  );
};
