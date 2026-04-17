import { formatConversationTime } from "../../models/researchModel";
import { buildContextSummary } from "../helpers/contextView";

export const ConversationHistory = ({ history, sessionContext }) => {
  return (
    <section className="min-w-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
          Session Memory
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">Recent conversation</h3>
      </div>

      <div className="rounded-[1.5rem] border border-white/8 bg-slate-950/35 p-4">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
          Active context
        </p>
        <p className="mt-3 break-words text-sm leading-7 text-slate-300">
          {buildContextSummary(sessionContext) || "No structured context saved yet."}
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {history.length ? (
          history.map((item, index) => (
            <article
              key={`${item.role}-${index}-${item.createdAt || "now"}`}
              className="rounded-[1.5rem] border border-white/8 bg-slate-950/40 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] uppercase tracking-[0.24em] text-cyan-200/70">
                  {item.role === "assistant" ? "Assistant" : "User"}
                </span>
                <span className="text-xs text-slate-500">
                  {formatConversationTime(item.createdAt)}
                </span>
              </div>
              <p className="mt-3 break-words text-sm leading-7 text-slate-300">{item.content}</p>
            </article>
          ))
        ) : (
          <p className="rounded-[1.5rem] border border-dashed border-white/10 bg-slate-950/30 p-4 text-sm text-slate-500">
            Your recent turns will appear here once the conversation starts.
          </p>
        )}
      </div>
    </section>
  );
};
