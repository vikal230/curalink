import { contextFieldConfig } from "../../models/researchModel";

const Banner = ({ tone = "info", message }) => {
  const toneClasses =
    tone === "error"
      ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
      : "border-amber-300/20 bg-amber-400/10 text-amber-50";

  return (
    <div className={`rounded-2xl border px-4 py-3 text-sm ${toneClasses}`}>
      {message}
    </div>
  );
};

export const SearchSection = ({
  bootstrapping,
  contextForm,
  error,
  isLoading,
  lastQuery,
  onContextChange,
  onPromptSelect,
  onQueryChange,
  onResetSession,
  onSubmit,
  prompts,
  query,
  sessionId,
  sourceErrors,
}) => {
  const sessionLabel = sessionId ? `${sessionId.slice(0, 12)}...` : "";

  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-5 shadow-[0_28px_90px_rgba(2,6,23,0.45)] backdrop-blur-xl sm:p-8">
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <div className="space-y-6">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-cyan-100">
              Research + Reasoning System
            </span>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-4xl font-black leading-tight text-white sm:text-5xl">
                Structured medical answers with evidence, trials, and source-backed
                context.
              </h1>

              <p className="max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Search across PubMed, OpenAlex, and ClinicalTrials.gov, then synthesize
                the strongest signals into a cleaner report for hackathon demos and
                follow-up conversations.
              </p>
            </div>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              {contextFieldConfig.map((field) => (
                <label key={field.key} className="space-y-2">
                  <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    {field.label}
                  </span>
                  <input
                    type="text"
                    value={contextForm[field.key]}
                    onChange={(event) => onContextChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
                  />
                </label>
              ))}
            </div>

            <div className="overflow-hidden rounded-[1.5rem] border border-cyan-400/15 bg-slate-950/80 shadow-[0_0_0_1px_rgba(8,145,178,0.08)]">
              <textarea
                className="min-h-[160px] w-full resize-none bg-transparent px-5 py-5 text-base leading-7 text-white outline-none placeholder:text-slate-500"
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="Ask a natural follow-up, or leave this blank and use the structured fields above."
                rows={5}
              />

              <div className="flex flex-col gap-4 border-t border-white/10 bg-white/5 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-2">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                      Current session
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      {bootstrapping ? "Loading memory..." : sessionLabel}
                    </p>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                    Last query
                  </p>
                  <p className="mt-1 text-sm text-slate-300">{lastQuery}</p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onResetSession}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
                  >
                    New session
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || bootstrapping}
                    className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-6 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isLoading ? "Searching sources..." : "Search research"}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => onPromptSelect(prompt)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-slate-300 transition hover:border-cyan-300/40 hover:text-cyan-100"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {error ? <Banner tone="error" message={error} /> : null}

            {sourceErrors.length ? (
              <div className="space-y-2">
                {sourceErrors.map((item) => (
                  <Banner key={item.source} message={item.message} />
                ))}
              </div>
            ) : null}
          </form>
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <article className="rounded-[1.75rem] border border-white/10 bg-slate-950/70 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
              What this prototype does
            </p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
              <li>Expands vague user questions into stronger research queries.</li>
              <li>Stores disease, intent, and location in MongoDB-backed sessions.</li>
              <li>Blends publications and trials into a structured answer.</li>
            </ul>
          </article>

          <article className="rounded-[1.75rem] border border-cyan-400/15 bg-cyan-400/10 p-5">
            <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">
              Session memory
            </p>
            <p className="mt-4 text-sm leading-7 text-cyan-50">
              Follow-up prompts can now reuse stored disease context, so a second
              question like "Can I take Vitamin D?" still stays grounded.
            </p>
          </article>
        </aside>
      </div>
    </section>
  );
};
