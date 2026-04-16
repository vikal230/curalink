export const StatsGrid = ({ stats }) => {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 backdrop-blur"
        >
          <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
            {stat.label}
          </p>
          <p className="mt-4 text-4xl font-black text-cyan-300">{stat.value}</p>
          <p className="mt-3 text-sm text-slate-400">{stat.helper}</p>
        </article>
      ))}
    </section>
  );
};
