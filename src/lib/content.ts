import type { SectionId } from "./types";

export const TEMPLATE_ID = "nj-divorce";

export const INTAKE_STEPS: { id: SectionId; label: string; blurb: string }[] = [
  {
    id: "personal",
    label: "Personal information",
    blurb: "Confirm how your attorney can reach you.",
  },
  {
    id: "employment",
    label: "Employment",
    blurb: "Employment answers decide which income documents are required.",
  },
  {
    id: "income",
    label: "Income",
    blurb: "Amounts here stay attached to the document that supports them.",
  },
  {
    id: "tax",
    label: "Tax returns",
    blurb: "A complete return is part of every New Jersey divorce disclosure.",
  },
  {
    id: "bank",
    label: "Bank accounts",
    blurb: "Each account you add gets its own statement requirements.",
  },
  {
    id: "investments",
    label: "Investments",
    blurb: "Brokerage and other non-retirement investment accounts.",
  },
  {
    id: "retirement",
    label: "Retirement",
    blurb: "401(k), IRA, pension, and similar plans.",
  },
  {
    id: "real_estate",
    label: "Real estate",
    blurb: "Homes and other property you own.",
  },
  {
    id: "debts",
    label: "Debts",
    blurb: "Credit cards and loans.",
  },
  {
    id: "insurance",
    label: "Insurance",
    blurb: "Life insurance policies, including cash value.",
  },
  {
    id: "business",
    label: "Business interests",
    blurb: "Any business you own or have an interest in.",
  },
  {
    id: "other",
    label: "Other assets",
    blurb: "Anything else your attorney should know about.",
  },
];

export const CHECKLIST_SECTIONS: SectionId[] = [
  "income",
  "tax",
  "bank",
  "investments",
  "retirement",
  "real_estate",
  "credit",
  "loans",
  "insurance",
  "business",
  "other",
];

export const OVERVIEW_ROWS: { id: SectionId; label: string }[] = [
  { id: "income", label: "Income" },
  { id: "tax", label: "Tax returns" },
  { id: "bank", label: "Bank accounts" },
  { id: "investments", label: "Investments" },
  { id: "retirement", label: "Retirement" },
  { id: "real_estate", label: "Real estate" },
  { id: "credit", label: "Credit cards" },
  { id: "loans", label: "Loans" },
  { id: "insurance", label: "Insurance" },
  { id: "business", label: "Business interests" },
];
