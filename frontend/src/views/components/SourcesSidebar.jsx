import { getPaperLinkLabel, getSourceSnippet } from "../../models/researchModel";
import { ConversationHistory } from "./ConversationHistory";
import { SavedContextCard } from "./SavedContextCard";

export const SourcesSidebar = ({ history, sessionContext, papers, trials }) => {
  return (
    <aside className="min-w-0 space-y-6">
      <SavedContextCard context={sessionContext} />

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Publications
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Top ranked papers</h3>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            {papers.length} shown
          </span>
        </div>

        <div className="space-y-4">
          {papers.length ? (
            papers.map((paper, index) => (
              <article
                key={`${paper.title}-${index}`}
                className="rounded-[1.5rem] border border-white/8 bg-slate-950/45 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
                      {paper.source || "Publication"}
                    </p>
                    <h4 className="mt-2 break-words text-sm font-semibold leading-6 text-slate-100">
                      {paper.title}
                    </h4>
                  </div>
                  {paper.year ? (
                    <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">
                      {paper.year}
                    </span>
                  ) : null}
                </div>

                {paper.authors ? (
                  <p className="mt-3 break-words text-sm text-slate-400">{paper.authors}</p>
                ) : null}

                {getSourceSnippet(paper) ? (
                  <p className="mt-3 break-words text-sm leading-6 text-slate-300">
                    {getSourceSnippet(paper)}
                  </p>
                ) : null}

                {paper.url ? (
                  <a
                    href={paper.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
                  >
                    {getPaperLinkLabel(paper)} {"->"}
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm text-slate-500">
              Ranked publications will appear here after the first search.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
              Clinical Trials
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Relevant studies</h3>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400">
            {trials.length} shown
          </span>
        </div>

        <div className="space-y-4">
          {trials.length ? (
            trials.map((trial, index) => (
              <article
                key={`${trial.title}-${index}`}
                className="rounded-[1.5rem] border border-blue-400/15 bg-blue-400/5 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-blue-200/70">
                      {trial.source || "Clinical trial"}
                    </p>
                    <h4 className="mt-2 break-words text-sm font-semibold leading-6 text-slate-100">
                      {trial.title}
                    </h4>
                  </div>
                  {trial.status ? (
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">
                      {trial.status}
                    </span>
                  ) : null}
                </div>

                {trial.location ? (
                  <p className="mt-3 break-words text-sm text-slate-300">{trial.location}</p>
                ) : null}

                {getSourceSnippet(trial) ? (
                  <p className="mt-3 break-words text-sm leading-6 text-slate-400">
                    {getSourceSnippet(trial)}
                  </p>
                ) : null}

                {trial.contact ? (
                  <p className="mt-3 break-words text-xs leading-6 text-slate-500">
                    Contact: {trial.contact}
                  </p>
                ) : null}

                {trial.url ? (
                  <a
                    href={trial.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex text-sm font-medium text-blue-300 transition hover:text-blue-200"
                  >
                    View trial {"->"}
                  </a>
                ) : null}
              </article>
            ))
          ) : (
            <p className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm text-slate-500">
              Ranked clinical trials will appear here after the first search.
            </p>
          )}
        </div>
      </section>

      <ConversationHistory history={history} sessionContext={sessionContext} />
    </aside>
  );
};
