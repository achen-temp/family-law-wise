"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { Button, Choice, Field, PageHeader } from "@/components/ui";
import { INTAKE_STEPS } from "@/lib/content";
import { getIntakeValidationIssue, normalizeIntakeSection, type IntakeValidationIssue } from "@/lib/intake-validation";
import { LOOKBACK, TAX_YEAR } from "@/lib/requirements";
import { useStore } from "@/lib/store";
import type { BankAccount, CardAccount, Intake, PayFrequency, SectionId } from "@/lib/types";

export function PortalIntake({ token, section }: { token: string; section: SectionId }) {
  const router = useRouter();
  const { state, saveIntake, saveIntakeDraft } = useStore();
  const intake = state.intakes[token];
  const draft = state.intakeDrafts?.[token] ?? intake;
  const step = INTAKE_STEPS.find((item) => item.id === section);
  const formRef = useRef<HTMLFormElement>(null);
  const [failure, setFailure] = useState<{ section: SectionId; issue: IntakeValidationIssue } | null>(null);
  const error = failure?.section === section ? failure.issue : null;

  if (!intake || !draft || !step) {
    return <p className="text-sm text-muted">This section is not part of the questionnaire.</p>;
  }

  const index = INTAKE_STEPS.findIndex((item) => item.id === section);
  const dirty = state.intakeDirtySections?.[token]?.includes(section);
  const employmentConfirmed = intake.completed.includes("employment") && !state.intakeDirtySections?.[token]?.includes("employment");

  function update(next: Intake) {
    saveIntakeDraft(token, next, section);
    setFailure(null);
  }

  function save(event: FormEvent) {
    event.preventDefault();
    const problem = section === "income" && !employmentConfirmed
      ? { field: "employment-link", message: "Confirm the employment section before confirming income." }
      : getIntakeValidationIssue(section, draft);
    if (problem) {
      setFailure({ section, issue: problem });
      const control = formRef.current?.querySelector<HTMLElement>(`[data-field="${CSS.escape(problem.field)}"]`);
      if (control?.matches("fieldset")) control.querySelector<HTMLButtonElement>("button")?.focus();
      else control?.focus();
      return;
    }
    saveIntake(token, normalizeIntakeSection(section, draft), section);
    setFailure(null);
    const following = INTAKE_STEPS[index + 1];
    router.push(following ? `/portal/${token}/intake/${following.id}` : `/portal/${token}/checklist`);
  }

  return (
    <form ref={formRef} onSubmit={save} noValidate>
      <PageHeader eyebrow={`Section ${index + 1} of ${INTAKE_STEPS.length}`} title={step.label} description={step.blurb} />
      <p className="mb-3 text-xs leading-relaxed text-muted">
        Dated demo: tax year {TAX_YEAR}; account statements {LOOKBACK[0]}–{LOOKBACK[LOOKBACK.length - 1]}.
      </p>
      <p className="mb-4 text-sm leading-relaxed text-muted">
        Draft edits are retained as you type while this preview stays open, including when you go Back or open another section.
        Refreshing or closing this preview resets all changes. Save and continue confirms this section and updates the checklist.
        All shown questions are required except Other assets notes.
      </p>
      <div className="card space-y-4 p-5">{fields(section, draft, update, error, token, employmentConfirmed)}</div>
      {error ? <p id="intake-error" role="alert" className="mt-3 text-sm text-rose-800">{error.message}</p> : null}
      <p role="status" className="mt-3 text-xs text-muted">
        {dirty ? "Draft retained in this preview. Confirm this section to update the checklist." : intake.completed.includes(section) ? "Section confirmed in this preview." : "Section not yet confirmed."}
      </p>
      <div className="mt-4 flex flex-wrap justify-between gap-2">
        {index > 0 ? (
          <Button type="button" onClick={() => router.push(`/portal/${token}/intake/${INTAKE_STEPS[index - 1].id}`)}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" variant="primary" className="w-full sm:w-auto">
          {index === INTAKE_STEPS.length - 1 ? "Save and open checklist" : "Save and continue"}
        </Button>
      </div>
    </form>
  );
}

function fields(section: SectionId, draft: Intake, update: (next: Intake) => void, error: IntakeValidationIssue | null, token: string, employmentConfirmed: boolean) {
  switch (section) {
    case "personal":
      return (
        <>
          <Field label="Phone">
            <input className="field" type="tel" autoComplete="tel" {...validationProps("personal.phone", error)} value={draft.personal.phone} onChange={(event) => update({ ...draft, personal: { ...draft.personal, phone: event.target.value } })} />
          </Field>
          <Field label="Address">
            <input className="field" autoComplete="street-address" {...validationProps("personal.address", error)} value={draft.personal.address} onChange={(event) => update({ ...draft, personal: { ...draft.personal, address: event.target.value } })} />
          </Field>
        </>
      );
    case "employment":
      return (
        <>
          <YesNo
            label="Are you currently employed?"
            field="employment.employed" error={error} value={draft.employment.employed}
            onChange={(employed) => update({ ...draft, employment: { ...draft.employment, employed } })}
          />
          {draft.employment.employed ? (
            <>
              <Field label="Employer">
                <input className="field" {...validationProps("employment.employer", error)} value={draft.employment.employer} onChange={(event) => update({ ...draft, employment: { ...draft.employment, employer: event.target.value } })} />
              </Field>
              <Field label="How are you paid?">
                <select
                  className="field"
                  {...validationProps("employment.payFrequency", error)} value={draft.employment.payFrequency}
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
              <YesNo label="Do you receive bonuses?" field="employment.bonuses" error={error} value={draft.employment.bonuses} onChange={(bonuses) => update({ ...draft, employment: { ...draft.employment, bonuses } })} />
              <YesNo label="Do you receive commissions?" field="employment.commissions" error={error} value={draft.employment.commissions} onChange={(commissions) => update({ ...draft, employment: { ...draft.employment, commissions } })} />
            </>
          ) : null}
        </>
      );
    case "income":
      if (!employmentConfirmed || getIntakeValidationIssue("employment", draft)) {
        return <Link href={`/portal/${token}/intake/employment`} className="text-sm text-brand underline" {...validationProps("employment-link", error)}>Complete employment before confirming income.</Link>;
      }
      if (!draft.employment.employed) {
        return <p className="text-sm text-muted">No employment income amounts are required because you reported that you are not employed. Save and continue to confirm.</p>;
      }
      return (
        <>
          <Field label="Annual base salary" hint="Enter US dollars, 0 or more. Up to two decimal places; no commas or currency symbols. These are self-reported demo answers, not verified financial facts.">
            <input className="field" inputMode="decimal" {...validationProps("income.baseSalary", error)} value={draft.income.baseSalary} onChange={(event) => update({ ...draft, income: { ...draft.income, baseSalary: event.target.value } })} />
          </Field>
          {draft.employment.bonuses || draft.employment.commissions ? (
            <Field label="Annual bonus and commission income" hint="Enter 0 if none was received. US dollars, up to two decimal places.">
              <input className="field" inputMode="decimal" {...validationProps("income.bonus", error)} value={draft.income.bonus} onChange={(event) => update({ ...draft, income: { ...draft.income, bonus: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "tax":
      return (
        <YesNo
          label={`Did you file a ${TAX_YEAR} federal tax return?`}
          field="tax.filed" error={error} value={draft.tax.filed}
          onChange={(filed) => update({ ...draft, tax: { ...draft.tax, filed } })}
        />
      );
    case "bank":
      return (
        <>
          <YesNo label="Do you have any bank accounts?" field="bank.hasAccounts" error={error} value={draft.bank.hasAccounts} onChange={(hasAccounts) => update({ ...draft, bank: { ...draft.bank, hasAccounts } })} />
          {draft.bank.hasAccounts ? (
            <AccountEditor error={error} accounts={draft.bank.accounts} onChange={(accounts) => update({ ...draft, bank: { ...draft.bank, accounts } })} />
          ) : null}
        </>
      );
    case "investments":
      return (
        <>
          <YesNo label="Do you have investment accounts outside retirement plans?" field="investments.has" error={error} value={draft.investments.has} onChange={(has) => update({ ...draft, investments: { ...draft.investments, has } })} />
          {draft.investments.has ? (
            <Field label="Institution">
              <input className="field" {...validationProps("investments.institution", error)} value={draft.investments.institution} onChange={(event) => update({ ...draft, investments: { ...draft.investments, institution: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "retirement":
      return (
        <>
          <YesNo label="Do you have a retirement plan?" field="retirement.has" error={error} value={draft.retirement.has} onChange={(has) => update({ ...draft, retirement: { ...draft.retirement, has } })} />
          {draft.retirement.has ? (
            <Field label="Plan name">
              <input className="field" {...validationProps("retirement.planName", error)} value={draft.retirement.planName} onChange={(event) => update({ ...draft, retirement: { ...draft.retirement, planName: event.target.value } })} placeholder="Fidelity 401(k)" />
            </Field>
          ) : null}
        </>
      );
    case "real_estate":
      return (
        <>
          <YesNo label="Do you own real estate?" field="realEstate.owns" error={error} value={draft.realEstate.owns} onChange={(owns) => update({ ...draft, realEstate: { ...draft.realEstate, owns } })} />
          {draft.realEstate.owns ? (
            <Field label="Property address">
              <input className="field" {...validationProps("realEstate.address", error)} value={draft.realEstate.address} onChange={(event) => update({ ...draft, realEstate: { ...draft.realEstate, address: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "debts":
      return (
        <>
          <YesNo label="Do you have credit cards?" field="debts.hasCards" error={error} value={draft.debts.hasCards} onChange={(hasCards) => update({ ...draft, debts: { ...draft.debts, hasCards } })} />
          {draft.debts.hasCards ? (
            <CardEditor error={error} cards={draft.debts.cards} onChange={(cards) => update({ ...draft, debts: { ...draft.debts, cards } })} />
          ) : null}
          <YesNo label="Do you have other loans?" field="debts.hasLoans" error={error} value={draft.debts.hasLoans} onChange={(hasLoans) => update({ ...draft, debts: { ...draft.debts, hasLoans } })} />
          {draft.debts.hasLoans ? (
            <Field label="Lender">
              <input className="field" {...validationProps("debts.loanName", error)} value={draft.debts.loanName} onChange={(event) => update({ ...draft, debts: { ...draft.debts, loanName: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "insurance":
      return (
        <YesNo
          label="Do you have life insurance?"
          field="insurance.hasLife" error={error} value={draft.insurance.hasLife}
          onChange={(hasLife) => update({ ...draft, insurance: { hasLife } })}
        />
      );
    case "business":
      return (
        <>
          <YesNo label="Do you own a business or an interest in one?" field="business.has" error={error} value={draft.business.has} onChange={(has) => update({ ...draft, business: { ...draft.business, has } })} />
          {draft.business.has ? (
            <Field label="Business name">
              <input className="field" {...validationProps("business.name", error)} value={draft.business.name} onChange={(event) => update({ ...draft, business: { ...draft.business, name: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "other":
      return (
        <Field label="Anything else (optional)">
          <textarea className="field min-h-28" {...validationProps("other.notes", error)} value={draft.other.notes} onChange={(event) => update({ ...draft, other: { notes: event.target.value } })} />
        </Field>
      );
    default:
      return null;
  }
}

function YesNo({ label, value, onChange, field, error }: { label: string; value: boolean | null; onChange: (value: boolean) => void; field: string; error: IntakeValidationIssue | null }) {
  return (
    <fieldset {...validationProps(field, error)}>
      <legend className="mb-1.5 text-sm font-medium">{label}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
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

function AccountEditor({ accounts, onChange, error }: { accounts: BankAccount[]; onChange: (accounts: BankAccount[]) => void; error: IntakeValidationIssue | null }) {
  function patch(id: string, partial: Partial<BankAccount>) {
    onChange(accounts.map((account) => (account.id === id ? { ...account, ...partial } : account)));
  }
  return (
    <div className="space-y-3">
      {accounts.map((account, index) => (
        <fieldset key={account.id} className="space-y-3 rounded-lg border border-line p-3">
          <legend className="px-1 text-xs font-medium text-muted">Bank account {index + 1}</legend>
          <div className="flex justify-end">
            <button type="button" className="text-xs text-muted hover:text-foreground" aria-label={`Remove bank account ${index + 1}`} onClick={() => onChange(accounts.filter((item) => item.id !== account.id))}>
              Remove
            </button>
          </div>
          <Field label="Institution">
            <input className="field" {...validationProps(`bank.${account.id}.institution`, error)} value={account.institution} onChange={(event) => patch(account.id, { institution: event.target.value })} />
          </Field>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Type">
              <select className="field" value={account.accountType} onChange={(event) => patch(account.id, { accountType: event.target.value as BankAccount["accountType"] })}>
                <option>Checking</option>
                <option>Savings</option>
                <option>Money market</option>
              </select>
            </Field>
            <Field label="Last 4 digits">
              <input className="field" inputMode="numeric" {...validationProps(`bank.${account.id}.last4`, error)} maxLength={4} value={account.last4} onChange={(event) => patch(account.id, { last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </Field>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Choice checked={account.ownership === "Individual"} onClick={() => patch(account.id, { ownership: "Individual" })}>
              Individual
            </Choice>
            <Choice checked={account.ownership === "Joint"} onClick={() => patch(account.id, { ownership: "Joint" })}>
              Joint
            </Choice>
          </div>
        </fieldset>
      ))}
      <Button
        type="button"
        {...validationProps("bank.add", error)}
        onClick={() =>
          onChange([
            ...accounts,
            { id: `acct-${crypto.randomUUID()}`, institution: "", accountType: "Checking", last4: "", ownership: "Individual" },
          ])
        }
      >
        Add another account
      </Button>
    </div>
  );
}

function CardEditor({ cards, onChange, error }: { cards: CardAccount[]; onChange: (cards: CardAccount[]) => void; error: IntakeValidationIssue | null }) {
  function patch(id: string, partial: Partial<CardAccount>) {
    onChange(cards.map((card) => card.id === id ? { ...card, ...partial } : card));
  }
  return (
    <div className="space-y-3">
      {cards.map((card, index) => (
        <fieldset key={card.id} className="space-y-3 rounded-lg border border-line p-3">
          <legend className="px-1 text-xs font-medium text-muted">Credit card {index + 1}</legend>
          <div className="flex justify-end">
            <button type="button" className="text-xs text-muted hover:text-foreground" aria-label={`Remove credit card ${index + 1}`} onClick={() => onChange(cards.filter((item) => item.id !== card.id))}>Remove</button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Institution">
              <input className="field" {...validationProps(`debts.${card.id}.institution`, error)} value={card.institution} onChange={(event) => patch(card.id, { institution: event.target.value })} />
            </Field>
            <Field label="Last 4 digits">
              <input className="field" inputMode="numeric" maxLength={4} {...validationProps(`debts.${card.id}.last4`, error)} value={card.last4} onChange={(event) => patch(card.id, { last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </Field>
          </div>
        </fieldset>
      ))}
      <Button type="button" {...validationProps("debts.add", error)} onClick={() => onChange([...cards, { id: `card-${crypto.randomUUID()}`, institution: "", last4: "" }])}>
        Add a card
      </Button>
    </div>
  );
}

function validationProps(field: string, error: IntakeValidationIssue | null) {
  return {
    "data-field": field,
    "aria-invalid": error?.field === field || undefined,
    "aria-describedby": error?.field === field ? "intake-error" : undefined,
  };
}
