import { contextFieldConfig } from "../../models/researchModel";

const getDisplayValue = (value) => value || "Not set";

export const SavedContextCard = ({ context }) => {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="mb-5">
        <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
          Saved Context
        </p>
        <h3 className="mt-2 text-xl font-semibold text-white">What is stored right now</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {contextFieldConfig.map((field) => (
          <article
            key={field.key}
            className="rounded-[1.25rem] border border-white/8 bg-slate-950/40 p-4"
          >
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              {field.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              {getDisplayValue(context?.[field.key])}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
};
