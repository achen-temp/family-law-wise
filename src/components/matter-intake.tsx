"use client";

import { Accordion, AccordionDetails, AccordionSummary, Box, Chip, Link, Paper, Typography } from "@mui/material";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { INTAKE_STEPS } from "@/lib/content";
import { PageHeader } from "@/components/ui";
import { matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Intake, SectionId } from "@/lib/types";

export function MatterIntake({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const intake = state.intakes[matterId];
  if (!matter || !intake) return <Typography color="text.secondary">Matter not found.</Typography>;

  function status(section: SectionId) {
    return state.intakeDirtySections?.[matterId]?.includes(section) ? "Draft awaiting confirmation" : intake!.completed.includes(section) ? "Confirmed" : "Not confirmed";
  }
  const chapterLinks = INTAKE_STEPS.map((step, index) => <Link key={step.id} href={`#intake-${step.id}`} underline="hover" sx={{ display: "block", p: 1, borderRadius: 1, color: "text.primary", "&:hover": { bgcolor: "action.hover" }, "&:focus-visible": { outline: "2px solid var(--focus-ring)" } }}>
    <Typography variant="body2" sx={{ fontWeight: 500 }}>{index + 1}. {step.label}</Typography>
    <Typography component="span" variant="caption" color={status(step.id) === "Confirmed" ? "primary.main" : status(step.id) === "Draft awaiting confirmation" ? "warning.main" : "text.secondary"}>{status(step.id)}</Typography>
  </Link>);

  return (
    <div>
      <PageHeader eyebrow={matterTitle(matter)} title="Intake" description="Client-confirmed questionnaire answers. The client edits and confirms answers in the portal; this view is read-only." />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "208px minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
        <Paper component="nav" variant="outlined" aria-label="Intake chapters" sx={{ display: { xs: "none", lg: "block" }, p: 1, position: "sticky", top: 80, maxHeight: "calc(100dvh - 96px)", overflowY: "auto" }}>
          <Typography sx={{ px: 1, py: 1.5, fontWeight: 600 }}>Chapters</Typography>
          {chapterLinks}
        </Paper>
        <Box sx={{ minWidth: 0, display: "grid", gap: 2 }}>
          <Accordion variant="outlined" disableGutters sx={{ display: { xs: "block", lg: "none" }, "&:before": { display: "none" } }}>
            <AccordionSummary expandIcon={<ChevronDown size={16} />}><Typography sx={{ fontWeight: 600 }}>Jump to a chapter</Typography></AccordionSummary>
            <AccordionDetails><Box component="nav" aria-label="Intake chapters (mobile)" sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" } }}>{chapterLinks}</Box></AccordionDetails>
          </Accordion>
          {INTAKE_STEPS.map((step, index) => {
            const currentStatus = status(step.id);
            const dirty = currentStatus === "Draft awaiting confirmation";
            return <Paper component="section" variant="outlined" key={step.id} id={`intake-${step.id}`} aria-labelledby={`intake-heading-${step.id}`} tabIndex={-1}
              sx={{ minWidth: 0, overflow: "hidden", scrollMarginTop: 112, "&:target": { outline: "2px solid var(--focus-ring)", outlineOffset: 2 } }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between", px: { xs: 2, sm: 3 }, py: 2, bgcolor: "var(--surface-subtle)", borderBottom: "1px solid", borderColor: "divider" }}>
                <Typography component="h2" variant="h2" id={`intake-heading-${step.id}`}>{index + 1}. {step.label}</Typography>
                <Chip label={currentStatus} color={dirty ? "warning" : currentStatus === "Confirmed" ? "success" : "default"} sx={{ maxWidth: "100%", height: "auto", minHeight: 24, "& .MuiChip-label": { whiteSpace: "normal", py: 0.25 } }} />
              </Box>
              <Box sx={{ p: { xs: 2, sm: 3 } }}>
                {dirty ? <Typography color="text.secondary">The client has draft edits awaiting confirmation. No current confirmed answers are shown for this chapter. Draft edits do not update the checklist.</Typography>
                  : !intake.completed.includes(step.id) ? <Typography color="text.secondary">Waiting for the client to confirm this chapter. No current confirmed answers are available.</Typography>
                  : renderSection(step.id, intake)}
              </Box>
            </Paper>;
          })}
        </Box>
      </Box>
    </div>
  );
}

function renderSection(section: SectionId, intake: Intake) {
  switch (section) {
    case "personal":
      return <Answers><Item label="Phone" value={answer(intake.personal.phone)} /><Item label="Address" value={answer(intake.personal.address)} fullWidth /></Answers>;
    case "employment":
      return <Answers>
        <Item label="Employed" value={yesNo(intake.employment.employed)} />
        {intake.employment.employed === true ? <>
          <Item label="Employer" value={answer(intake.employment.employer)} />
          <Item label="Pay frequency" value={answer(intake.employment.payFrequency)} />
          <Item label="Bonuses" value={yesNo(intake.employment.bonuses)} />
          <Item label="Commissions" value={yesNo(intake.employment.commissions)} />
        </> : null}
      </Answers>;
    case "income":
      if (intake.employment.employed === false) return <Typography>No employment income reported.</Typography>;
      return <Answers>
        <Item label="Base salary" value={money(intake.income.baseSalary)} />
        {intake.employment.bonuses || intake.employment.commissions ? <Item label="Bonus and commission income" value={money(intake.income.bonus)} /> : null}
      </Answers>;
    case "tax":
      return <Answers><Item label="Filed a return" value={yesNo(intake.tax.filed)} /><Item label="Year" value={answer(intake.tax.year)} /></Answers>;
    case "bank":
      return <Box sx={{ display: "grid", gap: 2 }}>
        <Answers><Item label="Bank accounts reported" value={yesNo(intake.bank.hasAccounts)} /></Answers>
        {intake.bank.hasAccounts === true ? intake.bank.accounts.map((account, index) => <Box key={account.id}>
          <Typography component="h3" variant="body1" sx={{ fontWeight: 600, mb: 1 }}>Bank account {index + 1}</Typography>
          <Answers><Item label="Institution" value={answer(account.institution)} /><Item label="Type" value={account.accountType} /><Item label="Last 4 digits" value={`****${account.last4}`} /><Item label="Ownership" value={account.ownership} /></Answers>
        </Box>) : null}
      </Box>;
    case "investments":
      return <Answers><Item label="Investment accounts" value={yesNo(intake.investments.has)} />{intake.investments.has === true ? <Item label="Institution" value={answer(intake.investments.institution)} /> : null}</Answers>;
    case "retirement":
      return <Answers><Item label="Retirement plan" value={yesNo(intake.retirement.has)} />{intake.retirement.has === true ? <Item label="Plan name" value={answer(intake.retirement.planName)} /> : null}</Answers>;
    case "real_estate":
      return <Answers><Item label="Owns real estate" value={yesNo(intake.realEstate.owns)} />{intake.realEstate.owns === true ? <Item label="Property address" value={answer(intake.realEstate.address)} fullWidth /> : null}</Answers>;
    case "debts":
      return <Box sx={{ display: "grid", gap: 2 }}>
        <Answers><Item label="Credit cards" value={yesNo(intake.debts.hasCards)} /></Answers>
        {intake.debts.hasCards === true ? intake.debts.cards.map((card, index) => <Box key={card.id}>
          <Typography component="h3" variant="body1" sx={{ fontWeight: 600, mb: 1 }}>Credit card {index + 1}</Typography>
          <Answers><Item label="Institution" value={answer(card.institution)} /><Item label="Last 4 digits" value={`****${card.last4}`} /></Answers>
        </Box>) : null}
        <Answers><Item label="Other loans" value={yesNo(intake.debts.hasLoans)} />{intake.debts.hasLoans === true ? <Item label="Lender" value={answer(intake.debts.loanName)} /> : null}</Answers>
      </Box>;
    case "insurance":
      return <Answers><Item label="Life insurance" value={yesNo(intake.insurance.hasLife)} /></Answers>;
    case "business":
      return <Answers><Item label="Business interest" value={yesNo(intake.business.has)} />{intake.business.has === true ? <Item label="Business name" value={answer(intake.business.name)} /> : null}</Answers>;
    case "other":
      return <Answers><Item label="Other assets notes" value={intake.other.notes || "Nothing else reported."} fullWidth /></Answers>;
    default:
      return null;
  }
}

function Answers({ children }: { children: ReactNode }) {
  return <Box component="dl" sx={{ m: 0 }}>{children}</Box>;
}

function Item({ label, value, fullWidth = false }: { label: string; value: string; fullWidth?: boolean }) {
  const stacked = fullWidth || value.length > 80 || value.includes("\n");
  return <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: stacked ? "minmax(0, 1fr)" : "160px minmax(0, 1fr)" }, gap: 0.75, py: 1.5, borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
    <Typography component="dt" variant="body2" color="text.secondary">{label}</Typography>
    <Typography component="dd" variant="body1" sx={{ m: 0, minWidth: 0, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{value}</Typography>
  </Box>;
}

function answer(value: string) {
  return value || "Not answered";
}

function yesNo(value: boolean | null) {
  return value === null ? "Not answered" : value ? "Yes" : "No";
}

function money(value: string) {
  if (!value.trim()) return "Not answered";
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(amount) : value;
}
