"use client";

import { BALANCES } from "@/lib/seed";
import { PageHeader } from "@/components/ui";
import { bankGroup, cardGroup } from "@/lib/requirements";
import { formatMoney, matterTitle, stats } from "@/lib/format";
import { useStore } from "@/lib/store";

export function FinancialProfile({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const intake = state.intakes[matterId];
  if (!matter || !intake) return <p className="text-sm text-muted">Matter not found.</p>;

  const requirements = state.requirements.filter((item) => item.matterId === matterId);
  const balance = (group: string) => BALANCES.find((item) => item.matterId === matterId && item.group === group);

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Financial profile"
        description="Confirmed figures stay separate from questionnaire answers and from files. Every amount shows where it came from."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="text-sm font-semibold">Income</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Fact label="Employer" value={intake.employment.employer || "—"} source="Client intake · Employment" />
            <Fact label="Pay frequency" value={intake.employment.payFrequency || "—"} source="Client intake · Employment" />
            <Fact
              label="Base salary"
              value={formatMoney(intake.income.baseSalary)}
              source={balance("income-salary")?.source ?? "Client intake · Income"}
              confirmed={balance("income-salary")?.confirmed}
            />
            <Fact
              label="Bonus"
              value={intake.income.bonus ? formatMoney(intake.income.bonus) : "—"}
              source={balance("income-bonus")?.source ?? "Client intake · Income"}
              confirmed={balance("income-bonus")?.confirmed}
            />
          </dl>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold">Real estate</h2>
          {intake.realEstate.owns && intake.realEstate.address ? (
            <div className="mt-4">
              <p className="text-sm font-medium">{intake.realEstate.address}</p>
              <Fact
                label="Mortgage balance"
                value={balance(intake.realEstate.address)?.value ?? "Not confirmed"}
                source={balance(intake.realEstate.address)?.source ?? "No accepted statement yet"}
                confirmed={balance(intake.realEstate.address)?.confirmed}
              />
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted">{intake.realEstate.owns === false ? "None reported." : "Not started."}</p>
          )}
        </section>

        <section className="card p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Bank accounts</h2>
          {intake.bank.accounts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">{intake.bank.hasAccounts === false ? "None reported." : "Not started."}</p>
          ) : (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {intake.bank.accounts.map((account) => {
                const group = bankGroup(account);
                const months = requirements.filter((item) => item.section === "bank" && item.groupLabel === group);
                const fact = balance(group);
                return (
                  <article key={account.id} className="rounded-lg border border-line bg-white p-4">
                    <p className="text-sm font-medium">{group}</p>
                    <p className="text-xs text-muted">{account.ownership}</p>
                    <p className="mt-3 text-lg font-semibold">{fact?.value ?? "Balance not confirmed"}</p>
                    <p className="mt-1 text-xs text-muted">{fact?.source ?? "Waiting for an accepted statement."}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {months.map((month) => (
                        <span key={month.id} className="rounded-full bg-[#eef2f8] px-2 py-0.5 text-[11px] text-muted">
                          {month.periodLabel?.slice(0, 3)} {month.status === "ACCEPTED" ? "✓" : month.status === "NEEDS_REVIEW" ? "•" : "–"}
                        </span>
                      ))}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold">Investments and retirement</h2>
          <div className="mt-4 space-y-4">
            {intake.investments.has && intake.investments.institution ? (
              <Fact
                label={intake.investments.institution}
                value={balance(intake.investments.institution)?.value ?? "Not confirmed"}
                source={balance(intake.investments.institution)?.source ?? "Client intake"}
                confirmed={balance(intake.investments.institution)?.confirmed}
              />
            ) : (
              <p className="text-sm text-muted">No investment account reported.</p>
            )}
            {intake.retirement.has && intake.retirement.planName ? (
              <Fact
                label={intake.retirement.planName}
                value={balance(intake.retirement.planName)?.value ?? "Not confirmed"}
                source={balance(intake.retirement.planName)?.source ?? "Client intake"}
                confirmed={balance(intake.retirement.planName)?.confirmed}
              />
            ) : null}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="text-sm font-semibold">Debts</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {intake.debts.cards.map((card) => (
              <li key={card.id}>
                <p className="font-medium">{cardGroup(card)}</p>
                <p className="text-xs text-muted">
                  {stats(requirements.filter((item) => item.groupLabel === cardGroup(card))).accepted > 0
                    ? "Statement accepted"
                    : "Statement not accepted yet"}
                </p>
              </li>
            ))}
            {intake.debts.hasLoans && intake.debts.loanName ? (
              <li>
                <p className="font-medium">{intake.debts.loanName}</p>
                <p className="text-xs text-muted">Loan reported on intake</p>
              </li>
            ) : null}
            {intake.debts.cards.length === 0 && !intake.debts.loanName ? (
              <li className="text-muted">No debts reported.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Fact({
  label,
  value,
  source,
  confirmed,
}: {
  label: string;
  value: string;
  source: string;
  confirmed?: boolean;
}) {
  return (
    <div className="border-t border-line pt-3 first:border-t-0 first:pt-0">
      <div className="flex items-baseline justify-between gap-3">
        <dt className="text-muted">{label}</dt>
        <dd className="font-medium">{value}</dd>
      </div>
      <p className="mt-1 text-xs text-muted">
        {confirmed === false ? "Unconfirmed · " : confirmed ? "Confirmed · " : ""}
        {source}
      </p>
    </div>
  );
}
