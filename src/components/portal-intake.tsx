"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState, type FormEvent, type ReactNode, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { Alert, Box, Button, Chip, FormHelperText, OutlinedInput, Paper, Select, ToggleButton, Typography, type SelectChangeEvent } from "@mui/material";
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
      control?.scrollIntoView({ block: "center" });
      return;
    }
    saveIntake(token, normalizeIntakeSection(section, draft), section);
    setFailure(null);
    const following = INTAKE_STEPS[index + 1];
    router.push(following ? `/portal/${token}/intake/${following.id}` : `/portal/${token}/checklist`);
  }

  const chapterStatus = (id: SectionId) => state.intakeDirtySections?.[token]?.includes(id) ? "Draft" : intake.completed.includes(id) ? "Confirmed" : "Unanswered";
  const currentStatus = chapterStatus(section);

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "208px minmax(0, 680px)" }, gap: 3, alignItems: "start", maxWidth: 912 }}>
      <Paper component="nav" variant="outlined" aria-label="Questionnaire chapters" sx={{ display: { xs: "none", lg: "block" }, p: 1, position: "sticky", top: 80, maxHeight: "calc(100dvh - 96px)", overflowY: "auto" }}>
        <Typography sx={{ px: 1, py: 1.5, fontWeight: 600 }}>Questionnaire</Typography>
        {INTAKE_STEPS.map((chapter, chapterIndex) => <Button key={chapter.id} component={Link} href={`/portal/${token}/intake/${chapter.id}`} aria-current={chapter.id === section ? "page" : undefined}
          sx={{ display: "block", width: "100%", textAlign: "left", px: 1, py: 1, borderRadius: 1, bgcolor: chapter.id === section ? "var(--primary-soft)" : undefined, color: chapter.id === section ? "primary.main" : "text.primary" }}>
          <Typography variant="body2" sx={{ fontWeight: chapter.id === section ? 600 : 400 }}>{chapterIndex + 1}. {chapter.label}</Typography>
          <Typography variant="caption" color={chapterStatus(chapter.id) === "Draft" ? "warning.main" : chapterStatus(chapter.id) === "Confirmed" ? "primary.main" : "text.secondary"}>{chapterStatus(chapter.id)}</Typography>
        </Button>)}
      </Paper>
      <Box sx={{ minWidth: 0, width: "100%", maxWidth: 680 }}>
        <Paper variant="outlined" sx={{ display: { xs: "block", lg: "none" }, p: 2, mb: 2 }}>
          <Field label="Questionnaire chapter">
            <Select native fullWidth value={section} inputProps={{ "aria-label": "Questionnaire chapter" }} onChange={(event) => router.push(`/portal/${token}/intake/${event.target.value}`)}>
              {INTAKE_STEPS.map((chapter, chapterIndex) => <option key={chapter.id} value={chapter.id}>{chapterIndex + 1}. {chapter.label} — {chapterStatus(chapter.id)}</option>)}
            </Select>
          </Field>
        </Paper>
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">Section {index + 1} of {INTAKE_STEPS.length}</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mt: 0.5 }}>
            <Typography component="h1" variant="h1" sx={{ overflowWrap: "anywhere" }}>{step.label}</Typography>
            <Chip label={currentStatus} color={currentStatus === "Draft" ? "warning" : currentStatus === "Confirmed" ? "success" : "default"} />
          </Box>
          <Typography color="text.secondary" sx={{ mt: 1 }}>{step.blurb}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>Dated demo: tax year {TAX_YEAR}; account statements {LOOKBACK[0]}–{LOOKBACK[LOOKBACK.length - 1]}.</Typography>
        </Box>
        <Paper component="form" ref={formRef} onSubmit={save} noValidate variant="outlined" sx={{ minWidth: 0, overflow: "hidden" }}>
          <Box sx={{ p: { xs: 2, sm: 3 }, borderBottom: "1px solid", borderColor: "divider", bgcolor: "var(--surface-subtle)" }}>
            <Typography variant="body2" color="text.secondary">Drafts stay in this open preview as you type or change chapters. Save and continue confirms answers and updates the checklist. Refreshing or closing resets changes. All shown questions are required except Other assets notes.</Typography>
          </Box>
          <Box sx={{ display: "grid", gap: 3, p: { xs: 2, sm: 3 }, pb: 4, "& [data-field], & fieldset": { scrollMarginBlock: "160px" } }}>
            {fields(section, draft, update, error, token, employmentConfirmed)}
            {error ? <Alert id="intake-error" severity="error">{error.message}</Alert> : null}
          </Box>
          <Box sx={{ minHeight: 56, p: 2, borderTop: "1px solid", borderColor: "divider", bgcolor: "background.paper", display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between", borderRadius: "0 0 8px 8px" }}>
            <Typography role="status" variant="body2" color="text.secondary" sx={{ flexBasis: { xs: "100%", sm: "auto" }, flexGrow: 1, minWidth: 0, maxWidth: { sm: 240 } }}>{dirty ? "Draft retained in this preview. Confirm this section to update the checklist." : intake.completed.includes(section) ? "Section confirmed in this preview." : "Section not yet confirmed."}</Typography>
            <Button type="button" variant="outlined" disabled={index === 0} onClick={() => router.push(`/portal/${token}/intake/${INTAKE_STEPS[index - 1].id}`)}>Back</Button>
            <Button type="submit" variant="contained">{index === INTAKE_STEPS.length - 1 ? "Save and open checklist" : "Save and continue"}</Button>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}

function fields(section: SectionId, draft: Intake, update: (next: Intake) => void, error: IntakeValidationIssue | null, token: string, employmentConfirmed: boolean) {
  switch (section) {
    case "personal":
      return (
        <>
          <Field label="Phone">
            <Input type="tel" autoComplete="tel" {...validationProps("personal.phone", error)} value={draft.personal.phone} onChange={(event) => update({ ...draft, personal: { ...draft.personal, phone: event.target.value } })} />
          </Field>
          <Field label="Address">
            <Input autoComplete="street-address" {...validationProps("personal.address", error)} value={draft.personal.address} onChange={(event) => update({ ...draft, personal: { ...draft.personal, address: event.target.value } })} />
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
            <Box sx={{ display: "grid", gap: 3, pl: 2, borderLeft: "2px solid", borderColor: "divider" }}>
              <Field label="Employer">
                <Input {...validationProps("employment.employer", error)} value={draft.employment.employer} onChange={(event) => update({ ...draft, employment: { ...draft.employment, employer: event.target.value } })} />
              </Field>
              <Field label="How are you paid?">
                <IntakeSelect
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
                </IntakeSelect>
              </Field>
              <YesNo label="Do you receive bonuses?" field="employment.bonuses" error={error} value={draft.employment.bonuses} onChange={(bonuses) => update({ ...draft, employment: { ...draft.employment, bonuses } })} />
              <YesNo label="Do you receive commissions?" field="employment.commissions" error={error} value={draft.employment.commissions} onChange={(commissions) => update({ ...draft, employment: { ...draft.employment, commissions } })} />
            </Box>
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
            <Input inputMode="decimal" {...validationProps("income.baseSalary", error)} value={draft.income.baseSalary} onChange={(event) => update({ ...draft, income: { ...draft.income, baseSalary: event.target.value } })} />
          </Field>
          {draft.employment.bonuses || draft.employment.commissions ? (
            <Field label="Annual bonus and commission income" hint="Enter 0 if none was received. US dollars, up to two decimal places.">
              <Input inputMode="decimal" {...validationProps("income.bonus", error)} value={draft.income.bonus} onChange={(event) => update({ ...draft, income: { ...draft.income, bonus: event.target.value } })} />
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
              <Input {...validationProps("investments.institution", error)} value={draft.investments.institution} onChange={(event) => update({ ...draft, investments: { ...draft.investments, institution: event.target.value } })} />
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
              <Input {...validationProps("retirement.planName", error)} value={draft.retirement.planName} onChange={(event) => update({ ...draft, retirement: { ...draft.retirement, planName: event.target.value } })} placeholder="Fidelity 401(k)" />
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
              <Input {...validationProps("realEstate.address", error)} value={draft.realEstate.address} onChange={(event) => update({ ...draft, realEstate: { ...draft.realEstate, address: event.target.value } })} />
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
              <Input {...validationProps("debts.loanName", error)} value={draft.debts.loanName} onChange={(event) => update({ ...draft, debts: { ...draft.debts, loanName: event.target.value } })} />
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
              <Input {...validationProps("business.name", error)} value={draft.business.name} onChange={(event) => update({ ...draft, business: { ...draft.business, name: event.target.value } })} />
            </Field>
          ) : null}
        </>
      );
    case "other":
      return (
        <Field label="Anything else (optional)">
          <Textarea {...validationProps("other.notes", error)} value={draft.other.notes} onChange={(event) => update({ ...draft, other: { notes: event.target.value } })} />
        </Field>
      );
    default:
      return null;
  }
}

function YesNo({ label, value, onChange, field, error }: { label: string; value: boolean | null; onChange: (value: boolean) => void; field: string; error: IntakeValidationIssue | null }) {
  return (
    <Box component="fieldset" {...validationProps(field, error)} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Typography component="legend" sx={{ mb: 1, fontWeight: 500 }}>{label}</Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Choice checked={value === true} onClick={() => onChange(true)}>
          Yes
        </Choice>
        <Choice checked={value === false} onClick={() => onChange(false)}>
          No
        </Choice>
      </Box>
    </Box>
  );
}

function AccountEditor({ accounts, onChange, error }: { accounts: BankAccount[]; onChange: (accounts: BankAccount[]) => void; error: IntakeValidationIssue | null }) {
  function patch(id: string, partial: Partial<BankAccount>) {
    onChange(accounts.map((account) => (account.id === id ? { ...account, ...partial } : account)));
  }
  return (
    <div className="space-y-3">
      <p className="text-xs leading-relaxed text-muted">Changing the last four digits creates separate checklist items when you confirm this section. Earlier files and review decisions stay with the original digits.</p>
      {accounts.map((account, index) => (
        <Paper component="fieldset" variant="outlined" key={account.id} sx={{ display: "grid", gap: 2, minWidth: 0, p: 2, m: 0 }}>
          <legend className="px-1 text-xs font-medium text-muted">Bank account {index + 1}</legend>
          <div className="flex justify-end">
            <Button type="button" size="small" variant="text" aria-label={`Remove bank account ${index + 1}`} onClick={() => onChange(accounts.filter((item) => item.id !== account.id))}>
              Remove
            </Button>
          </div>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
            <Field label="Institution">
              <Input {...validationProps(`bank.${account.id}.institution`, error)} value={account.institution} onChange={(event) => patch(account.id, { institution: event.target.value })} />
            </Field>
            <Field label="Type">
              <IntakeSelect value={account.accountType} onChange={(event) => patch(account.id, { accountType: event.target.value as BankAccount["accountType"] })}>
                <option>Checking</option><option>Savings</option><option>Money market</option>
              </IntakeSelect>
            </Field>
            <Field label="Last 4 digits">
              <Input inputMode="numeric" {...validationProps(`bank.${account.id}.last4`, error)} maxLength={4} value={account.last4} onChange={(event) => patch(account.id, { last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </Field>
            <Field label="Ownership">
              <IntakeSelect value={account.ownership} onChange={(event) => patch(account.id, { ownership: event.target.value as BankAccount["ownership"] })}>
                <option>Individual</option><option>Joint</option>
              </IntakeSelect>
            </Field>
          </Box>
        </Paper>
      ))}
      <Button
        type="button" variant="outlined"
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
      <p className="text-xs leading-relaxed text-muted">Changing the last four digits creates separate checklist items when you confirm this section. Earlier files and review decisions stay with the original digits.</p>
      {cards.map((card, index) => (
        <Paper component="fieldset" variant="outlined" key={card.id} sx={{ display: "grid", gap: 2, minWidth: 0, p: 2, m: 0 }}>
          <legend className="px-1 text-xs font-medium text-muted">Credit card {index + 1}</legend>
          <div className="flex justify-end">
            <Button type="button" size="small" variant="text" aria-label={`Remove credit card ${index + 1}`} onClick={() => onChange(cards.filter((item) => item.id !== card.id))}>Remove</Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Field label="Institution">
              <Input {...validationProps(`debts.${card.id}.institution`, error)} value={card.institution} onChange={(event) => patch(card.id, { institution: event.target.value })} />
            </Field>
            <Field label="Last 4 digits">
              <Input inputMode="numeric" maxLength={4} {...validationProps(`debts.${card.id}.last4`, error)} value={card.last4} onChange={(event) => patch(card.id, { last4: event.target.value.replace(/\D/g, "").slice(0, 4) })} />
            </Field>
          </div>
        </Paper>
      ))}
      <Button type="button" variant="outlined" {...validationProps("debts.add", error)} onClick={() => onChange([...cards, { id: `card-${crypto.randomUUID()}`, institution: "", last4: "" }])}>
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

// Keep validation markers on the native controls so first-error focus still works.
function Input({ value, onChange, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <OutlinedInput fullWidth value={value} onChange={onChange} error={Boolean(props["aria-invalid"])} slotProps={{ input: props }} />;
}

function Textarea({ value, onChange, ...props }: Pick<TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "aria-invalid" | "aria-describedby">) {
  return <OutlinedInput fullWidth multiline minRows={4} value={value} onChange={onChange} slotProps={{ input: props }} />;
}

function IntakeSelect({ value, onChange, children, ...props }: Pick<SelectHTMLAttributes<HTMLSelectElement>, "children" | "aria-invalid" | "aria-describedby"> & { value: string; onChange: (event: SelectChangeEvent<string>) => void }) {
  return <Select native fullWidth value={value} onChange={onChange} inputProps={props} error={Boolean(props["aria-invalid"])}>{children}</Select>;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <Box component="label" sx={{ display: "block", minWidth: 0 }}>
    <Typography component="span" sx={{ display: "block", mb: 1, fontWeight: 500 }}>{label}</Typography>
    {children}
    {hint ? <FormHelperText sx={{ mx: 0 }}>{hint}</FormHelperText> : null}
  </Box>;
}

function Choice({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return <ToggleButton type="button" value={String(children)} selected={checked} onClick={onClick} sx={{ flex: 1 }}>{children}</ToggleButton>;
}
