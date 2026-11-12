"use client";

import { Alert, Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { BALANCES } from "@/lib/seed";
import { PageHeader } from "@/components/ui";
import { bankGroup, cardGroup } from "@/lib/requirements";
import { formatMoney, matterTitle, REQUIREMENT_LABEL, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { BalanceFact, Requirement } from "@/lib/types";

export function FinancialProfile({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const intake = state.intakes[matterId];
  if (!matter || !intake) return <Typography color="text.secondary">Matter not found.</Typography>;

  const requirements = state.requirements.filter((item) => item.matterId === matterId);
  const balance = (group: string) => BALANCES.find((item) => item.matterId === matterId && item.group === group);

  return (
    <div>
      <PageHeader eyebrow={matterTitle(matter)} title="Financial profile" description="Financial facts, questionnaire answers and material coverage, with a source description for each row." />
      <Alert severity="info" icon={false} sx={{ mb: 3 }}>Demo figures retain their recorded Confirmed or Unconfirmed status. These are illustrative records, not verified financial facts. Source descriptions are text; no linked document records are supplied.</Alert>
      <Box sx={{ display: "grid", gap: 3 }}>
        <FactTable title="Income" id="income">
          <Fact label="Employer" value={intake.employment.employed === false ? "None reported." : intake.employment.employer || "Not started."} source="Client intake · Employment" />
          <Fact label="Pay frequency" value={intake.employment.employed === false ? "None reported." : intake.employment.payFrequency || "Not started."} source="Client intake · Employment" />
          <Fact label="Base salary" value={formatMoney(intake.income.baseSalary)} source="Client intake · Income" record={balance("income-salary")} monetary />
          <Fact label="Bonus" value={intake.income.bonus ? formatMoney(intake.income.bonus) : "Not reported"} source="Client intake · Income" record={balance("income-bonus")} monetary />
        </FactTable>

        <FactTable title="Real estate" id="real-estate">
          {intake.realEstate.owns === true && intake.realEstate.address ? <Fact label="Mortgage balance" detail={intake.realEstate.address} value="Not confirmed" source="Client intake · Real estate. No recorded balance source." record={balance(intake.realEstate.address)} monetary />
            : <Fact label="Property" value={intake.realEstate.owns === false ? "None reported." : "Not started."} source="Client intake · Real estate" />}
        </FactTable>

        <FactTable title="Bank accounts" id="bank">
          {intake.bank.hasAccounts === false ? <Fact label="Bank accounts" value="None reported." source="Client intake · Bank accounts" />
            : intake.bank.accounts.length === 0 ? <Fact label="Bank accounts" value="Not started." source="Client intake · Bank accounts" />
            : intake.bank.accounts.map((account) => {
              const group = bankGroup(account);
              const months = requirements.filter((item) => item.section === "bank" && item.groupLabel === group);
              return <Fact key={account.id} label={group} detail={account.ownership} value="Balance not confirmed" source={months.some((month) => month.status === "ACCEPTED") ? "Accepted statement requirement; no balance fact recorded." : "Waiting for an accepted statement."} record={balance(group)} monetary coverage={months} />;
            })}
        </FactTable>

        <FactTable title="Investments and retirement" id="investments-retirement">
          {intake.investments.has === true && intake.investments.institution ? <Fact label={intake.investments.institution} detail="Investment account" value="Not confirmed" source="Client intake · Investments" record={balance(intake.investments.institution)} monetary />
            : <Fact label="Investment accounts" value={intake.investments.has === false ? "None reported." : "Not started."} source="Client intake · Investments" />}
          {intake.retirement.has === true && intake.retirement.planName ? <Fact label={intake.retirement.planName} detail="Retirement plan" value="Not confirmed" source="Client intake · Retirement" record={balance(intake.retirement.planName)} monetary />
            : <Fact label="Retirement plan" value={intake.retirement.has === false ? "None reported." : "Not started."} source="Client intake · Retirement" />}
        </FactTable>

        <FactTable title="Debts" id="debts">
          {intake.debts.hasCards === false ? <Fact label="Credit cards" value="None reported." source="Client intake · Debts" />
            : intake.debts.cards.length === 0 ? <Fact label="Credit cards" value="Not started." source="Client intake · Debts" />
            : intake.debts.cards.map((card) => <Fact key={card.id} label={cardGroup(card)} value="Balance not confirmed" source={stats(requirements.filter((item) => item.groupLabel === cardGroup(card))).accepted > 0 ? "Statement accepted" : "Statement not accepted yet"} monetary />)}
          {intake.debts.hasLoans === true && intake.debts.loanName ? <Fact label={intake.debts.loanName} value="Balance not confirmed" source="Loan reported on intake" monetary />
            : <Fact label="Other loans" value={intake.debts.hasLoans === false ? "None reported." : "Not started."} source="Client intake · Debts" />}
        </FactTable>
      </Box>
    </div>
  );
}

function FactTable({ title, id, children }: { title: string; id: string; children: ReactNode }) {
  return <Paper component="section" variant="outlined" aria-labelledby={`profile-${id}`} sx={{ minWidth: 0, overflow: "hidden" }}>
    <Typography id={`profile-${id}`} component="h2" variant="h2" sx={{ px: 2, py: 2 }}>{title}</Typography>
    <TableContainer role="region" aria-label={`${title} facts`} tabIndex={0} sx={{ "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: -2 } }}>
      <Table size="small" sx={{ minWidth: 600, tableLayout: "fixed" }}>
        <caption className="sr-only">{title}: facts and source descriptions. Demo record status is separate from material acceptance.</caption>
        <TableHead><TableRow><TableCell sx={{ width: "50%" }}>Fact and source</TableCell><TableCell align="right" sx={{ width: "25%" }}>Value / amount</TableCell><TableCell sx={{ width: "25%" }}>Status</TableCell></TableRow></TableHead>
        <TableBody>{children}</TableBody>
      </Table>
    </TableContainer>
  </Paper>;
}

function Fact({ label, value, source, record, detail, monetary = false, coverage }: {
  label: string; value: string; source: string; record?: BalanceFact; detail?: string; monetary?: boolean; coverage?: Requirement[];
}) {
  // A seeded amount and its source stay together. No document link is inferred from source text.
  const displayValue = record?.value ?? value;
  const displaySource = record?.source ?? source;
  return <TableRow sx={{ verticalAlign: "top", "&:last-child td, &:last-child th": { borderBottom: 0 } }}>
    <TableCell component="th" scope="row" sx={{ py: 2, overflowWrap: "anywhere" }}>
      <Typography sx={{ fontWeight: 500 }}>{label}</Typography>
      {detail ? <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{detail}</Typography> : null}
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, whiteSpace: "pre-wrap" }}>Source: {displaySource}</Typography>
      {coverage ? <Box sx={{ mt: 1.5 }}>
        <Typography variant="body2" color="text.secondary">Statement coverage</Typography>
        {coverage.length === 0 ? <Typography variant="body2" color="text.secondary">No statement requirements recorded.</Typography> : <Box component="ul" sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, listStyle: "none", m: 0, mt: 0.75, p: 0 }}>
          {coverage.map((month) => <Box component="li" key={month.id}><Chip size="small" label={`${month.periodLabel || month.title}: ${REQUIREMENT_LABEL[month.status]}`} color={month.status === "ACCEPTED" ? "success" : ["NEEDS_REVIEW", "UPLOADED"].includes(month.status) ? "warning" : "default"} sx={{ height: "auto", minHeight: 24, maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 0.25 } }} /></Box>)}
        </Box>}
      </Box> : null}
    </TableCell>
    <TableCell align="right" sx={{ py: 2, overflowWrap: "anywhere", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{displayValue}</TableCell>
    <TableCell sx={{ py: 2 }}><Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
      {record ? <Chip label="Demo" size="small" /> : null}
      <Chip label={record ? record.confirmed ? "Confirmed" : "Unconfirmed" : monetary ? "Unconfirmed" : "Client intake"} color={record?.confirmed === false || (!record && monetary) ? "warning" : "default"} size="small" />
    </Box></TableCell>
  </TableRow>;
}
