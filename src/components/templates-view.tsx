import { PageHeader } from "@/components/ui";
import { DEMO_REFERENCE_DATE, LOOKBACK, TAX_YEAR } from "@/lib/requirements";

const RULES = [
  `Employment = yes → ${TAX_YEAR} W-2, three pay stubs, and bonus or commission documents when those are reported.`,
  `Each bank account → ${LOOKBACK.join(", ")} statements.`,
  "Each investment, retirement, credit card, loan, property, and life policy → its own latest statement.",
];

const PLANNED = ["NY Divorce", "PA Divorce", "NJ Post-Judgment", "Child Support Modification"];

export function TemplatesView() {
  return (
    <div>
      <PageHeader
        eyebrow="Firm"
        title="Templates"
        description="Review the supported template and the requirements added from a client’s answers. Templates are read-only in this preview."
      />
      <article className="grid overflow-hidden rounded-lg border border-line bg-surface lg:grid-cols-[320px_minmax(0,1fr)]" aria-labelledby="template-heading">
        <div className="border-b border-line bg-surface-subtle p-6 lg:border-r lg:border-b-0">
          <p className="inline-flex rounded bg-success-bg px-2 py-0.5 text-xs font-medium text-success-text">Active template</p>
          <h2 id="template-heading" className="mt-3 text-xl font-semibold leading-7">NJ Divorce Financial Disclosure</h2>
          <p className="mt-2 text-sm leading-[21px] text-muted">New Jersey · Divorce only. Other states and matter types are not supported in this pilot.</p>
          <dl className="mt-6 space-y-4 border-t border-line pt-5 text-sm">
            <div>
              <dt className="text-xs text-muted">Fixed demo reference date</dt>
              <dd className="mt-1 tabular-nums">{DEMO_REFERENCE_DATE}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Tax and W-2 year</dt>
              <dd className="mt-1 tabular-nums">{TAX_YEAR}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Demo statement periods</dt>
              <dd className="mt-1 leading-[21px]">{LOOKBACK.join(", ")}</dd>
              <dd className="mt-1 text-xs leading-[18px] text-muted">Statements are requested separately for each reported bank account.</dd>
            </div>
          </dl>
        </div>
        <div className="min-w-0 p-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-4">
            <h3 className="text-base font-semibold leading-6">Requirements</h3>
            <span className="text-xs text-muted">Read-only</span>
          </div>
          <section aria-labelledby="tax-heading" className="py-5">
            <h4 id="tax-heading" className="text-sm font-semibold">Tax return requirement</h4>
            <ul className="mt-3 text-sm leading-[21px] text-muted">
              <li>{TAX_YEAR} federal tax return, unless the client reports not filing.</li>
            </ul>
          </section>
          <section aria-labelledby="answers-heading" className="border-t border-line pt-5">
            <h4 id="answers-heading" className="text-sm font-semibold">Added from answers</h4>
            <ul className="mt-1 divide-y divide-line text-sm leading-[21px] text-muted">
              {RULES.map((rule) => (
                <li key={rule} className="py-3">{rule}</li>
              ))}
            </ul>
          </section>
          <section aria-labelledby="possible-heading" className="border-t border-line pt-5">
            <h4 id="possible-heading" className="text-sm font-semibold">Possible account review</h4>
            <p className="mt-3 text-sm leading-[21px] text-muted">A possible account found on a tax return stays unconfirmed until the attorney asks the client or dismisses it.</p>
            <p className="mt-2 text-xs leading-[18px] text-muted">Review rule only; this preview does not extract accounts from files.</p>
          </section>
        </div>
      </article>
      <section aria-labelledby="unsupported-heading" className="mt-6 border-t border-line pt-5">
        <h2 id="unsupported-heading" className="text-base font-semibold leading-6">Not supported in this pilot</h2>
        <p className="mt-1 text-xs leading-[18px] text-muted">Each requires its own confirmed questions and rules.</p>
        <ul className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {PLANNED.map((name) => <li key={name}>{name}</li>)}
        </ul>
      </section>
    </div>
  );
}
