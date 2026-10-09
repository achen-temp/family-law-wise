import { PageHeader } from "@/components/ui";

const RULES = [
  "Employment = yes → W-2, three pay stubs, and bonus or commission documents when those are reported.",
  "Each bank account → January, February, and March 2026 statements.",
  "Each investment, retirement, credit card, loan, property, and life policy → its own latest statement.",
  "A possible account found on a tax return stays unconfirmed until the attorney asks the client or dismisses it.",
];

const PLANNED = ["NY Divorce", "PA Divorce", "NJ Post-Judgment", "Child Support Modification"];

export function TemplatesView() {
  return (
    <div>
      <PageHeader
        eyebrow="Firm"
        title="Templates"
        description="Requirements come from a template plus the client’s answers. They are not hard-coded into each screen."
      />
      <article className="card p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">Active</p>
            <h2 className="mt-1 text-xl font-semibold">NJ Divorce Financial Disclosure</h2>
            <p className="mt-1 text-sm text-muted">New Jersey · Divorce, post-judgment, and support files can start here.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold">Always required</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li>2025 federal tax return</li>
              <li>2025 W-2</li>
              <li>Last three pay stubs</li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold">Added from answers</h3>
            <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-muted">
              {RULES.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </div>
        </div>
      </article>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {PLANNED.map((name) => (
          <div key={name} className="card px-4 py-4 opacity-70">
            <p className="text-sm font-medium">{name}</p>
            <p className="mt-1 text-xs text-muted">Planned. Same checklist engine, different questions.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
