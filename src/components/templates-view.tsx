import { DEMO_REFERENCE_DATE, LOOKBACK, TAX_YEAR } from "@/lib/requirements";

const RULES = [
  {
    condition: "Federal tax return",
    when: "Required unless the client reports not filing.",
    documents: `${TAX_YEAR} federal tax return, including all schedules.`,
  },
  {
    condition: "Employment income",
    when: "Client reports being employed.",
    documents: `${TAX_YEAR} W-2 and the last three pay stubs.`,
    detail: "Bonus income adds a recent bonus statement, letter or pay stub. Commission income adds a commission statement.",
  },
  {
    condition: "Bank accounts",
    when: "Client reports bank accounts.",
    documents: "One statement for each period below, for every account with an institution and valid last four digits.",
    periods: true,
  },
  {
    condition: "Investments",
    when: "Client reports an account and names the institution.",
    documents: "Most recent brokerage or investment statement.",
  },
  {
    condition: "Retirement",
    when: "Client reports a retirement plan and enters its name.",
    documents: "Most recent retirement plan statement.",
  },
  {
    condition: "Real estate",
    when: "Client reports owning property and enters its address.",
    documents: "Most recent mortgage statement and property tax bill or statement.",
  },
  {
    condition: "Credit cards",
    when: "Client reports credit cards.",
    documents: "Most recent statement for each card with an institution and valid last four digits.",
  },
  {
    condition: "Loans",
    when: "Client reports a loan and names the lender.",
    documents: "Most recent loan statement.",
  },
  {
    condition: "Life insurance",
    when: "Client reports a life insurance policy.",
    documents: "Recent statement showing the policy and any cash value.",
  },
  {
    condition: "Business interests",
    when: "Client reports a business interest and enters its name.",
    documents: "Recent profit and loss statement or business tax return.",
  },
];

const PLANNED = ["NY Divorce", "PA Divorce", "NJ Post-Judgment", "Child Support Modification"];

export function TemplatesView() {
  return (
    <div className="max-w-[1440px]">
      <header className="mb-6 border-b border-line pb-5">
        <h1 className="text-[32px] leading-10 tracking-tight [font-family:var(--font-fraunces)]">Templates</h1>
        <p className="mt-2 text-sm text-muted">Review the document requirements used to build a client’s checklist.</p>
      </header>
      <article aria-labelledby="template-heading" className="overflow-hidden rounded-lg border border-line bg-surface">
        <header className="grid gap-6 bg-brand p-6 text-white xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10 xl:p-8">
          <div>
            <p className="text-sm font-medium text-white/85">Active template · Read-only</p>
            <h2 id="template-heading" className="mt-3 max-w-xl text-[30px] leading-[38px] tracking-tight [font-family:var(--font-fraunces)]">NJ Divorce Financial Disclosure</h2>
            <p className="mt-3 max-w-xl text-sm leading-[21px] text-white/85">New Jersey · Divorce only. Other states and matter types are not supported in this pilot.</p>
          </div>
          <dl className="grid grid-cols-2 gap-4 border-t border-white/25 pt-5 text-sm xl:content-center xl:border-t-0 xl:border-l xl:pl-8 xl:pt-0">
            <div>
              <dt className="text-white/80">Tax & W-2 year</dt>
              <dd className="mt-1 text-2xl font-medium">{TAX_YEAR}</dd>
            </div>
            <div>
              <dt className="text-white/80">Demo reference date</dt>
              <dd className="mt-2 tabular-nums">{DEMO_REFERENCE_DATE}</dd>
            </div>
          </dl>
        </header>
        <div className="px-6 py-5 xl:px-8">
          <h3 className="text-lg font-semibold">Requirement catalogue</h3>
          <p className="mt-1 text-sm text-muted">Requests follow the client’s answers. These are the current preview rules, not an editable template.</p>
        </div>
        <table className="w-full table-fixed border-collapse text-left text-sm leading-[21px]">
          <thead className="border-y border-line bg-surface-subtle text-muted">
            <tr>
              <th scope="col" className="w-[36%] px-6 py-3 font-medium xl:px-8">When a request is added</th>
              <th scope="col" className="px-6 py-3 font-medium xl:px-8">Documents requested</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {RULES.map((rule) => (
              <tr key={rule.condition}>
                <th scope="row" className="px-6 py-4 align-top font-medium xl:px-8"><p>{rule.condition}</p><p className="mt-1 font-normal text-muted">{rule.when}</p></th>
                <td className="px-6 py-4 align-top xl:px-8">
                  <p>{rule.documents}</p>
                  {rule.detail ? <p className="mt-1 text-muted">{rule.detail}</p> : null}
                  {rule.periods ? (
                    <ul aria-label="Fixed demo statement periods" className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-medium text-brand">
                      {LOOKBACK.map((period) => <li key={period}>{period}</li>)}
                    </ul>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <section aria-labelledby="possible-heading" className="border-t border-line bg-surface-subtle px-6 py-5 xl:px-8">
          <h3 id="possible-heading" className="text-sm font-semibold">Possible account review</h3>
          <p className="mt-2 max-w-4xl text-sm leading-[21px] text-muted">A possible account is an unconfirmed finding. The attorney can ask the client about it or dismiss the finding; neither action confirms the account. This preview does not extract accounts from files.</p>
        </section>
      </article>
      <section aria-labelledby="unsupported-heading" className="mt-6 border-t border-line pt-5">
        <h2 id="unsupported-heading" className="text-sm font-semibold">Not supported in this pilot</h2>
        <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
          {PLANNED.map((name) => <li key={name}>{name}</li>)}
        </ul>
        <p className="mt-2 text-xs text-muted">Each requires its own confirmed questions and rules.</p>
      </section>
    </div>
  );
}
