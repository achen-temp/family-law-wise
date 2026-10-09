"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, Choice, Field, PageHeader } from "@/components/ui";
import { INTAKE_STEPS } from "@/lib/content";
import { useStore } from "@/lib/store";
import type { BankAccount, CardAccount, Intake, PayFrequency, SectionId } from "@/lib/types";

export function PortalIntake({ token, section }: { token: string; section: SectionId }) {
  const router = useRouter();
  const { state, saveIntake } = useStore();
  const intake = state.intakes[token];
  const step = INTAKE_STEPS.find((item) => item.id === section);
  const [draft, setDraft] = useState<Intake | null>(intake ?? null);
  const [error, setError] = useState("");
  const [seen, setSeen] = useState(section);

  if (seen !== section && intake) {
    setSeen(section);
    setDraft(intake);
    setError("");
  }

  if (!intake || !draft || !step) {
    return <p className="text-sm text-muted">This section is not part of the questionnaire.</p>;
  }

  const index = INTAKE_STEPS.findIndex((item) => item.id === section);

  function update(next: Intake) {
    setDraft(next);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const problem = validate(section, draft!);
    if (problem) {
      setError(problem);
      return;
    }
    saveIntake(token, draft!, section);
    const following = INTAKE_STEPS[index + 1];
    router.push(following ? `/portal/${token}/intake/${following.id}` : `/portal/${token}/checklist`);
  }

  return (
    <form onSubmit={save}>
      <PageHeader eyebrow={`Section ${index + 1} of ${INTAKE_STEPS.length}`} title={step.label} description={step.blurb} />
      <div className="card space-y-4 p-5">{fields(section, draft, update)}</div>
      {error ? <p className="mt-3 text-sm text-rose-800">{error}</p> : null}
      <div className="mt-4 flex justify-between gap-2">
        {index > 0 ? (
          <Button type="button" onClick={() => router.push(`/portal/${token}/intake/${INTAKE_STEPS[index - 1].id}`)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary">
          {index === INTAKE_STEPS.length - 1 ? "Save and open checklist" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}

function fields(section: SectionId, draft: Intake, update: (next: Intake) => void) {
  switch (section) {
    case "personal":
      return (
        <>
          <Field label="Phone">
            <input className="field" value={draft.personal.phone} onChange={(event) => update({ ...draft, personal: { ...draft.personal, phone: event.target.value } })} />
          </Field>
          <Field label="Address">
            <input className="field" value={draft.personal.address} onChange={(event) => update({ ...draft, personal: { ...draft.personal, address: event.target.value } })} />
          </Field>
        </>
      );
    case "employment":
      return (
        <>
          <YesNo
            label="Are you currently employed?"
            value={draft.employment.employed}
            onChange={(employed) => update({ ...draft, employment: { ...draft.employment, employed } })}
          />
          {draft.employment.employed ? (
            <>
              <Field label="Employer">
                <input className="field" value={draft.employment.employer} onChange={(event) => update({ ...draft, employment: { ...draft.employment, employer: event.target.value } })} />
              </Field>
              <Field label="How are you paid?">
                <select
                  className="field"
                  value={draft.employment.payFrequency}
                  onChange={(event) =>
                    update({
                      ...draft,
                      employment: { ...draft.employment, payFrequency: event.target.value as PayFrequency },
                    })
                  }
                >
                  <option value="">Select</option>
                  <option>Weekly</option>
                  <option>Bi-weekly</option>
                  <option>Semi-monthly</option>
                  <option>Monthly</option>
                </select>
              </Field>
              <YesNo label="Do you receive bonuses?" value={draft.employment.bonuses} onChange={(bonuses) => update({ ...draft, employment: { ...draft.employment, bonuses } })} />
              <YesNo label="Do you receive commissions?" value={draft.employment.commissions} onChange={(commissions) => update({ ...draft, employment: { ...draft.employment, commissions } })} />
            </>
          ) : null}
        </>
      );
    case "income":
      return (
        <>
          <Field label="Base salary" hint="Numbers only. The source of the figure is recorded with the W-2.">
            <input className="field" inputMode="numeric" value={draft.income.baseSalary} onChange={(event) => update({ ...draft, income: { ...draft.income, baseSalary: event.target.value } })} />
          </Field>
          <Field label="Bonus, if any">
            <input className="field" inputMode="numeric" value={draft.income.bonus} onChange={(event) => update({ ...draft, income: { ...draft.income, bonus: event.target.value } })} />
          </Field>
        </>
      );
    case "tax":
      return (
        <YesNo
          label="Did you file a 2025 federal tax return?"
          value={draft.tax.filed}
          onChange={(filed) => update({ ...draft, tax: { ...draft.tax, filed } })}
        />
      );
    case "bank":
      return (
        <>
          <YesNo label="Do you have any bank accounts?" value={draft.bank.hasAccounts} onChange={(hasAccounts) => update({ ...draft, bank: { ...draft.bank, hasAccounts } })} />
          {draft.bank.hasAccounts ? (
            <AccountEditor accounts={draft.bank.accounts} onChange={(accounts) => update({ ...draft, bank: { ...draft.bank, accounts } })} />
          ) : null}
        </>
      );
    case "investments":
      return (
        <>
          <YesNo label="Do you have investment accounts outside retirement plans?" value={draft.investments.has} onChange={(has) => update({ ...draft, investments: { ...draft.investments, has } })} />
          {draft.investments.has ? (
            <Field label="Institution">
              <input className="field" value={draft.investments.institution} onChange={(event) => update({ ...draft, investments: { ...draft.investments, institution: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "retirement":
      return (
        <>
          <YesNo label="Do you have a retirement plan?" value={draft.retirement.has} onChange={(has) => update({ ...draft, retirement: { ...draft.retirement, has } })} />
          {draft.retirement.has ? (
            <Field label="Plan name">
              <input className="field" value={draft.retirement.planName} onChange={(event) => update({ ...draft, retirement: { ...draft.retirement, planName: event.target.value } })} placeholder="Fidelity 401(k)" />
            </Field>
          ) : null}
        </>
      );
    case "real_estate":
      return (
        <>
          <YesNo label="Do you own real estate?" value={draft.realEstate.owns} onChange={(owns) => update({ ...draft, realEstate: { ...draft.realEstate, owns } })} />
          {draft.realEstate.owns ? (
            <Field label="Property address">
              <input className="field" value={draft.realEstate.address} onChange={(event) => update({ ...draft, realEstate: { ...draft.realEstate, address: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "debts":
      return (
        <>
          <YesNo label="Do you have credit cards?" value={draft.debts.hasCards} onChange={(hasCards) => update({ ...draft, debts: { ...draft.debts, hasCards } })} />
          {draft.debts.hasCards ? (
            <CardEditor cards={draft.debts.cards} onChange={(cards) => update({ ...draft, debts: { ...draft.debts, cards } })} />
          ) : null}
          <YesNo label="Do you have other loans?" value={draft.debts.hasLoans} onChange={(hasLoans) => update({ ...draft, debts: { ...draft.debts, hasLoans } })} />
          {draft.debts.hasLoans ? (
            <Field label="Lender">
              <input className="field" value={draft.debts.loanName} onChange={(event) => update({ ...draft, debts: { ...draft.debts, loanName: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "insurance":
      return (
        <YesNo
          label="Do you have life insurance?"
          value={draft.insurance.hasLife}
          onChange={(hasLife) => update({ ...draft, insurance: { hasLife } })}
        />
      );
    case "business":
      return (
        <>
          <YesNo label="Do you own a business or an interest in one?" value={draft.business.has} onChange={(has) => update({ ...draft, business: { ...draft.business, has } })} />
          {draft.business.has ? (
            <Field label="Business name">
              <input className="field" value={draft.business.name} onChange={(event) => update({ ...draft, business: { ...draft.business, name: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "other":
      return (
        <Field label="Anything else">
          <textarea className="field min-h-28" value={draft.other.notes} onChange={(event) => update({ ...draft, other: { notes: event.target.value } })} />
        </Field>
      );
    default:
      return null;
  }
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (value: boolean) => void }) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        <Choice checked={value === true} onClick={() => onChange(true)}>
          Yes
        </Choice>
        <Choice checked={value === false} onClick={() => onChange(false)}>
          No
        </Choice>
      </div>
    </fieldset>
  );
}

function AccountEditor({ accounts, onChange }: { accounts: BankAccount[]; onChange: (accounts: BankAccount[]) => void }) {
  function patch(id: string, partial: Partial<BankAccount>) {
    onChange(accounts.map((account) => (account.id === id ? { ...account, ...partial } : account)));
  }
  return (
    <div className="space-y-3">
      {accounts.map((account, index) => (
        <div key={account.id} className="space-y-3 rounded-lg border border-line p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted">Account {index + 1}</p>
            <button type="button" className="text-xs text-muted hover:text-foreground" onClick={() => onChange(accounts.filter((item) => item.id !== account.id))}>
              Remove
            </button>
          </div>
          <Field label="Institution">
            <input className="field" value={account.institution} onChange={(event) => patch(account.id, { institution: event.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Type">
              <select className="field" value={account.accountType} onChange={(event) => patch(account.id, { accountType: event.target.value as BankAccount["accountType"] })}>
                <option>Checking</option>
                <option>Savings</option>
                <option>Money market</option>
              </select>
            </Field>
            <Field label="Last 4 digits">
              <input className="field" maxLength={4} value={account.last4} onChange={(event) => patch(account.id, { last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Choice checked={account.ownership === "Individual"} onClick={() => patch(account.id, { ownership: "Individual" })}>
              Individual
            </Choice>
            <Choice checked={account.ownership === "Joint"} onClick={() => patch(account.id, { ownership: "Joint" })}>
              Joint
            </Choice>
          </div>
        </div>
      ))}
      <Button
        type="button"
        onClick={() =>
          onChange([
            ...accounts,
            { id: `acct-${Date.now()}`, institution: "", accountType: "Checking", last4: "", ownership: "Individual" },
          ])
        }
      >
        Add another account
      </Button>
    </div>
  );
}

function CardEditor({ cards, onChange }: { cards: CardAccount[]; onChange: (cards: CardAccount[]) => void }) {
  return (
    <div className="space-y-3">
      {cards.map((card) => (
        <div key={card.id} className="grid grid-cols-2 gap-2">
          <Field label="Card">
            <input
              className="field"
              value={card.institution}
              onChange={(event) =>
                onChange(cards.map((item) => (item.id === card.id ? { ...item, institution: event.target.value } : item)))
              }
            />
          </Field>
          <Field label="Last 4">
            <input
              className="field"
              maxLength={4}
              value={card.last4}
              onChange={(event) =>
                onChange(
                  cards.map((item) =>
                    item.id === card.id ? { ...item, last4: event.target.value.replace(/\D/g, "").slice(0, 4) } : item,
                  ),
                )
              }
            />
          </Field>
        </div>
      ))}
      <Button type="button" onClick={() => onChange([...cards, { id: `card-${Date.now()}`, institution: "", last4: "" }])}>
        Add a card
      </Button>
    </div>
  );
}

function validate(section: SectionId, draft: Intake) {
  if (section === "employment" && draft.employment.employed === null) return "Say whether you are employed.";
  if (section === "employment" && draft.employment.employed && !draft.employment.employer.trim()) return "Add the employer name.";
  if (section === "tax" && draft.tax.filed === null) return "Say whether you filed a return.";
  if (section === "bank" && draft.bank.hasAccounts === null) return "Say whether you have bank accounts.";
  if (section === "bank" && draft.bank.hasAccounts && draft.bank.accounts.length === 0) return "Add at least one account.";
  if (section === "bank" && draft.bank.accounts.some((account) => account.institution.trim() && account.last4.length < 4)) {
    return "Each account needs the last 4 digits.";
  }
  return "";
}
