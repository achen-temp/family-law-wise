"use client";

import { INTAKE_STEPS } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { bankGroup, cardGroup } from "@/lib/requirements";
import { formatMoney, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Intake, SectionId } from "@/lib/types";

export function MatterIntake({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const intake = state.intakes[matterId];
  if (!matter || !intake) return <p className="text-sm text-muted">Matter not found.</p>;

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Intake"
        description="Answers drive the checklist. The client edits these in the portal. This view is read-only."
      />
      <div className="space-y-4">
        {INTAKE_STEPS.map((step) => (
          <section key={step.id} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">{step.label}</h2>
              <span className="text-xs text-muted">
                {intake.completed.includes(step.id) ? "Answered" : "Not started"}
              </span>
            </div>
            <div className="mt-3">{renderSection(step.id, intake)}</div>
          </section>
        ))}
      </div>
    </div>
  );
}

function renderSection(section: SectionId, intake: Intake) {
  if (!intake.completed.includes(section) && section !== "personal") {
    return <p className="text-sm text-muted">Waiting for the client.</p>;
  }
  switch (section) {
    case "personal":
      return (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Item label="Phone" value={intake.personal.phone || "—"} />
          <Item label="Address" value={intake.personal.address || "—"} />
        </dl>
      );
    case "employment":
      return (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Item label="Employed" value={yesNo(intake.employment.employed)} />
          <Item label="Employer" value={intake.employment.employer || "—"} />
          <Item label="Pay frequency" value={intake.employment.payFrequency || "—"} />
          <Item label="Bonuses" value={yesNo(intake.employment.bonuses)} />
          <Item label="Commissions" value={yesNo(intake.employment.commissions)} />
        </dl>
      );
    case "income":
      return (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Item label="Base salary" value={formatMoney(intake.income.baseSalary)} />
          <Item label="Bonus" value={intake.income.bonus ? formatMoney(intake.income.bonus) : "—"} />
        </dl>
      );
    case "tax":
      return (
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <Item label="Filed a return" value={yesNo(intake.tax.filed)} />
          <Item label="Year" value={intake.tax.year || "—"} />
        </dl>
      );
    case "bank":
      if (intake.bank.hasAccounts === false) return <p className="text-sm">No bank accounts reported.</p>;
      return (
        <ul className="space-y-2 text-sm">
          {intake.bank.accounts.map((account) => (
            <li key={account.id}>
              {bankGroup(account)} · {account.ownership}
            </li>
          ))}
        </ul>
      );
    case "investments":
      return <p className="text-sm">{intake.investments.has ? intake.investments.institution : "None reported."}</p>;
    case "retirement":
      return <p className="text-sm">{intake.retirement.has ? intake.retirement.planName : "None reported."}</p>;
    case "real_estate":
      return <p className="text-sm">{intake.realEstate.owns ? intake.realEstate.address : "None reported."}</p>;
    case "debts":
      return (
        <div className="space-y-2 text-sm">
          {intake.debts.cards.map((card) => (
            <p key={card.id}>{cardGroup(card)}</p>
          ))}
          {intake.debts.hasLoans ? <p>{intake.debts.loanName}</p> : null}
          {intake.debts.hasCards === false && intake.debts.hasLoans === false ? <p>None reported.</p> : null}
        </div>
      );
    case "insurance":
      return <p className="text-sm">{intake.insurance.hasLife ? "Life insurance reported." : "No life insurance reported."}</p>;
    case "business":
      return <p className="text-sm">{intake.business.has ? intake.business.name : "None reported."}</p>;
    case "other":
      return <p className="text-sm">{intake.other.notes || "Nothing else reported."}</p>;
    default:
      return null;
  }
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function yesNo(value: boolean | null) {
  if (value === null) return "—";
  return value ? "Yes" : "No";
}
