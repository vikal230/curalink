export const GroundingPanel = ({ citations }) => {
  if (!citations.length) {
    return null;
  }

  return (
    <section className="rounded-[1.5rem] border border-cyan-300/12 bg-cyan-400/5 p-5">
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
          Grounding
        </p>
        <h3 className="mt-2 text-lg font-semibold text-white">Citations and snippets</h3>
      </div>

      <div className="space-y-4">
        {citations.map((citation) => (
          <article
            key={citation.id}
            className="rounded-[1.25rem] border border-white/8 bg-slate-950/45 p-4"
          >
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-200">
                {citation.id}
              </span>
              <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                {citation.platform || citation.type}
              </span>
              {citation.year ? (
                <span className="text-xs text-slate-500">{citation.year}</span>
              ) : null}
            </div>

            <h4 className="mt-3 text-sm font-semibold leading-6 text-slate-100">
              {citation.title}
            </h4>

            {citation.authors ? (
              <p className="mt-2 text-sm text-slate-400">{citation.authors}</p>
            ) : null}

            {citation.snippet ? (
              <p className="mt-3 text-sm leading-6 text-slate-300">{citation.snippet}</p>
            ) : null}

            {citation.url ? (
              <a
                href={citation.url}
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex text-sm font-medium text-cyan-300 transition hover:text-cyan-200"
              >
                Open source ↗
              </a>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
};
