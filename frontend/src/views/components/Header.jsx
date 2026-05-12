const NavButton = ({ className = "", isActive, label, onClick }) => {
  const classes = isActive
    ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
    : "border-white/10 bg-white/5 text-slate-300";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] transition ${classes} ${className}`}
    >
      {label}
    </button>
  );
};

export const Header = ({ activeView, onViewChange, sessionId }) => {
  const sessionLabel = sessionId ? sessionId.slice(0, 8) : "loading";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400 text-lg font-black text-slate-950 shadow-[0_0_28px_rgba(34,211,238,0.42)]">
              C
            </div>

            <div>
              <p className="text-lg font-semibold tracking-tight text-white">Curalink</p>
              <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/70">
                AI Medical Research Assistant
              </p>
            </div>
          </div>

          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-medium uppercase tracking-[0.2em] text-slate-300 md:hidden">
            Session {sessionLabel}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <NavButton
            isActive={activeView === "assistant"}
            label="Assistant"
            onClick={() => onViewChange("assistant")}
          />
          <NavButton
            isActive={activeView === "recent"}
            label="Recent diseases"
            onClick={() => onViewChange("recent")}
          />
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-300">
            Session {sessionLabel}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:hidden">
          <NavButton
            className="w-full justify-center px-3 text-[10px] tracking-[0.18em]"
            isActive={activeView === "assistant"}
            label="Assistant"
            onClick={() => onViewChange("assistant")}
          />
          <NavButton
            className="w-full justify-center px-3 text-[10px] tracking-[0.18em]"
            isActive={activeView === "recent"}
            label="Recent diseases"
            onClick={() => onViewChange("recent")}
          />
        </div>
      </div>
    </header>
  );
};
