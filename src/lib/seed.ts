import { INTAKE_STEPS, TEMPLATE_ID } from "./content";
import { reqKey, slug, syncRequirements } from "./requirements";
import type {
  BalanceFact,
  DocumentFile,
  Intake,
  Matter,
  Requirement,
  RequirementStatus,
  State,
} from "./types";

const johnIntake: Intake = {
  matterId: "matter-john",
  completed: INTAKE_STEPS.map((step) => step.id),
  personal: { phone: "(973) 555-0148", address: "123 Main Street, Montclair, NJ 07042" },
  employment: {
    employed: true,
    employer: "Amazon",
    payFrequency: "Bi-weekly",
    bonuses: true,
    commissions: false,
  },
  income: { baseSalary: "185000", bonus: "30000" },
  tax: { filed: true, year: "2025" },
  bank: {
    hasAccounts: true,
    accounts: [
      {
        id: "acct-chase",
        institution: "Chase",
        accountType: "Checking",
        last4: "1234",
        ownership: "Individual",
      },
      {
        id: "acct-boa",
        institution: "Bank of America",
        accountType: "Savings",
        last4: "8821",
        ownership: "Joint",
      },
    ],
  },
  investments: { has: true, institution: "Vanguard" },
  retirement: { has: true, planName: "Fidelity 401(k)" },
  realEstate: { owns: true, address: "123 Main Street, Montclair, NJ" },
  debts: {
    hasCards: true,
    cards: [
      { id: "card-amex", institution: "Amex", last4: "1008" },
      { id: "card-visa", institution: "Visa", last4: "4412" },
    ],
    hasLoans: true,
    loanName: "Honda Financial",
  },
  insurance: { hasLife: true },
  business: { has: false, name: "" },
  other: { notes: "No cryptocurrency or private loans to report." },
};

const JOHN_STATUS: Record<string, RequirementStatus> = {
  "::Pay stub #3": "MISSING",
  "Chase Checking ****1234::February 2026 statement": "MISSING",
  "Chase Checking ****1234::March 2026 statement": "NEEDS_REVIEW",
  "Bank of America Savings ****8821::February 2026 statement": "MISSING",
  "Vanguard::Latest brokerage statement": "NEEDS_REVIEW",
  "Fidelity 401(k)::Latest statement": "MISSING",
  "Visa ****4412::Latest statement": "MISSING",
  "::Life insurance statement": "NOT_AVAILABLE",
};

const sarahIntake: Intake = {
  matterId: "matter-sarah",
  completed: INTAKE_STEPS.map((step) => step.id),
  personal: { phone: "(201) 555-0172", address: "48 Grove Street, Montclair, NJ 07042" },
  employment: {
    employed: true,
    employer: "Maplewood Public Schools",
    payFrequency: "Bi-weekly",
    bonuses: false,
    commissions: false,
  },
  income: { baseSalary: "92000", bonus: "" },
  tax: { filed: true, year: "2025" },
  bank: {
    hasAccounts: true,
    accounts: [
      {
        id: "acct-pnc",
        institution: "PNC",
        accountType: "Checking",
        last4: "2290",
        ownership: "Individual",
      },
    ],
  },
  investments: { has: false, institution: "" },
  retirement: { has: true, planName: "NJ TPAF pension" },
  realEstate: { owns: true, address: "48 Grove Street, Montclair, NJ" },
  debts: {
    hasCards: true,
    cards: [{ id: "card-chase", institution: "Chase", last4: "7781" }],
    hasLoans: false,
    loanName: "",
  },
  insurance: { hasLife: false },
  business: { has: false, name: "" },
  other: { notes: "" },
};

function applyJohnStatus(requirements: Requirement[]) {
  return requirements.map((item) => {
    const status = JOHN_STATUS[reqKey(item)] ?? "ACCEPTED";
    if (status === "NOT_AVAILABLE") {
      return {
        ...item,
        status,
        unavailableReason: "I do not have access",
        unavailableNote: "The policy is held by my parents. I asked them for a copy on October 7.",
      };
    }
    return { ...item, status };
  });
}

function documentType(requirement: Requirement) {
  if (requirement.title.includes("W-2")) return "W-2";
  if (requirement.title.includes("Pay stub")) return "Pay stub";
  if (requirement.title.includes("Bonus")) return "Bonus letter";
  if (requirement.section === "tax") return "Tax return";
  if (requirement.section === "bank") return "Bank statement";
  if (requirement.section === "investments") return "Brokerage statement";
  if (requirement.section === "retirement") return "Retirement statement";
  if (requirement.title.includes("Mortgage")) return "Mortgage statement";
  if (requirement.title.includes("Property tax")) return "Property tax";
  if (requirement.section === "credit") return "Credit card statement";
  if (requirement.section === "loans") return "Loan statement";
  if (requirement.section === "insurance") return "Life insurance";
  return "Financial document";
}

function toDocument(
  requirement: Requirement,
  client: string,
  employer: string,
  uploadedAt: string,
  reviewer: string,
): DocumentFile {
  const last4 = requirement.groupLabel?.match(/\*\*\*\*(\d{4})/)?.[1];
  const accepted = requirement.status === "ACCEPTED";
  return {
    id: `doc-${requirement.id}`,
    matterId: requirement.matterId,
    requirementIds: [requirement.id],
    filename: `${slug(requirement.groupLabel ? `${requirement.groupLabel} ${requirement.title}` : requirement.title)}.pdf`,
    documentType: documentType(requirement),
    owner: client,
    institution:
      requirement.section === "income" || requirement.section === "tax"
        ? employer
        : requirement.groupLabel,
    accountLastFour: last4,
    periodLabel: requirement.periodLabel,
    uploadedAt,
    uploadedBy: client,
    status: accepted ? "ACCEPTED" : "NEEDS_REVIEW",
    pages: requirement.section === "tax" ? 18 : requirement.section === "bank" ? 4 : 2,
    reviewedAt: accepted ? "2026-10-07T15:00:00.000Z" : undefined,
    reviewedBy: accepted ? reviewer : undefined,
  };
}

function buildMatterRequirements(intake: Intake, overlay?: (items: Requirement[]) => Requirement[]) {
  const generated = syncRequirements([], intake, intake.matterId).filter(
    (item) => item.matterId === intake.matterId,
  );
  return overlay ? overlay(generated) : generated.map((item) => ({ ...item, status: "ACCEPTED" as const }));
}

const johnRequirements = buildMatterRequirements(johnIntake, applyJohnStatus);
const sarahRequirements = buildMatterRequirements(sarahIntake);

const johnMatter: Matter = {
  id: "matter-john",
  name: "Smith divorce",
  matterType: "Divorce",
  state: "NJ",
  county: "Essex",
  templateId: TEMPLATE_ID,
  status: "ATTORNEY_REVIEW",
  createdAt: "2026-10-02T15:00:00.000Z",
  lastClientActivity: "2026-10-08T15:00:00.000Z",
  parties: [
    { id: "party-john", role: "CLIENT", firstName: "John", lastName: "Smith", email: "john.smith@example.com" },
    { id: "party-jane", role: "OTHER_PARTY", firstName: "Jane", lastName: "Smith" },
  ],
};

const sarahMatter: Matter = {
  id: "matter-sarah",
  name: "Lee divorce",
  matterType: "Divorce",
  state: "NJ",
  county: "Essex",
  templateId: TEMPLATE_ID,
  status: "COMPLETE",
  createdAt: "2026-09-12T15:00:00.000Z",
  lastClientActivity: "2026-09-28T15:00:00.000Z",
  parties: [
    { id: "party-sarah", role: "CLIENT", firstName: "Sarah", lastName: "Lee", email: "sarah.lee@example.com" },
    { id: "party-david", role: "OTHER_PARTY", firstName: "David", lastName: "Lee" },
  ],
};

function documentsFor(requirements: Requirement[], client: string, employer: string, uploadedAt: string) {
  return requirements
    .filter((item) => item.status === "ACCEPTED" || item.status === "NEEDS_REVIEW")
    .map((item) => toDocument(item, client, employer, uploadedAt, "Alex Morgan"));
}

export const BALANCES: BalanceFact[] = [
  {
    matterId: "matter-john",
    group: "income-salary",
    value: "$185,000",
    source: "2025 W-2 · accepted",
    confirmed: true,
  },
  {
    matterId: "matter-john",
    group: "income-bonus",
    value: "$30,000",
    source: "2025 W-2 · accepted",
    confirmed: true,
  },
  {
    matterId: "matter-john",
    group: "Chase Checking ****1234",
    value: "$42,391",
    source: "Chase statement · January 31, 2026 · page 1",
    confirmed: true,
  },
  {
    matterId: "matter-john",
    group: "Bank of America Savings ****8821",
    value: "$18,440",
    source: "Bank of America statement · January 31, 2026 · page 1",
    confirmed: true,
  },
  {
    matterId: "matter-john",
    group: "Vanguard",
    value: "$96,120",
    source: "Vanguard statement · awaiting attorney review",
    confirmed: false,
  },
  {
    matterId: "matter-john",
    group: "Fidelity 401(k)",
    value: "$284,221",
    source: "Reported on intake · statement still missing",
    confirmed: false,
  },
  {
    matterId: "matter-john",
    group: "123 Main Street, Montclair, NJ",
    value: "$428,210",
    source: "Mortgage statement · March 2026 · page 1",
    confirmed: true,
  },
  {
    matterId: "matter-sarah",
    group: "income-salary",
    value: "$92,000",
    source: "2025 W-2 · accepted",
    confirmed: true,
  },
  {
    matterId: "matter-sarah",
    group: "PNC Checking ****2290",
    value: "$6,840",
    source: "PNC statement · March 2026 · page 1",
    confirmed: true,
  },
];

export const initialState: State = {
  firm: {
    name: "Hartwell Family Law",
    attorneyName: "Alex Morgan",
    attorneyEmail: "alex.morgan@hartwell.example",
    firstReminderDays: 3,
    secondReminderDays: 7,
    attorneyAlertDays: 11,
  },
  matters: [johnMatter, sarahMatter],
  intakes: {
    "matter-john": johnIntake,
    "matter-sarah": sarahIntake,
  },
  requirements: [...johnRequirements, ...sarahRequirements],
  documents: [
    ...documentsFor(johnRequirements, "John Smith", "Amazon", "2026-10-06T15:00:00.000Z"),
    ...documentsFor(sarahRequirements, "Sarah Lee", "Maplewood Public Schools", "2026-09-20T15:00:00.000Z"),
  ],
  activity: [
    {
      id: "act-john-1",
      matterId: "matter-john",
      at: "2026-10-08T15:00:00.000Z",
      actor: "John Smith",
      text: "Uploaded the Vanguard brokerage statement.",
    },
    {
      id: "act-john-2",
      matterId: "matter-john",
      at: "2026-10-07T18:00:00.000Z",
      actor: "John Smith",
      text: "Marked life insurance as unavailable.",
    },
    {
      id: "act-john-3",
      matterId: "matter-john",
      at: "2026-10-07T15:00:00.000Z",
      actor: "Alex Morgan",
      text: "Accepted the Chase January statement.",
    },
    {
      id: "act-john-4",
      matterId: "matter-john",
      at: "2026-10-06T16:00:00.000Z",
      actor: "Family Law Wise",
      text: "Classified an upload as a bank statement.",
    },
    {
      id: "act-john-5",
      matterId: "matter-john",
      at: "2026-10-06T15:30:00.000Z",
      actor: "John Smith",
      text: "Uploaded the Chase January statement.",
    },
    {
      id: "act-john-6",
      matterId: "matter-john",
      at: "2026-10-04T15:00:00.000Z",
      actor: "John Smith",
      text: "Finished employment and bank account questions.",
    },
    {
      id: "act-john-7",
      matterId: "matter-john",
      at: "2026-10-03T15:00:00.000Z",
      actor: "John Smith",
      text: "Opened the secure invitation.",
    },
    {
      id: "act-john-8",
      matterId: "matter-john",
      at: "2026-10-02T15:00:00.000Z",
      actor: "Alex Morgan",
      text: "Created the matter and sent the client invitation.",
    },
    {
      id: "act-sarah-1",
      matterId: "matter-sarah",
      at: "2026-09-28T15:00:00.000Z",
      actor: "Alex Morgan",
      text: "Marked the financial disclosure collection complete.",
    },
    {
      id: "act-sarah-2",
      matterId: "matter-sarah",
      at: "2026-09-22T15:00:00.000Z",
      actor: "Sarah Lee",
      text: "Submitted the financial disclosure.",
    },
    {
      id: "act-sarah-3",
      matterId: "matter-sarah",
      at: "2026-09-14T15:00:00.000Z",
      actor: "Alex Morgan",
      text: "Sent the client invitation.",
    },
  ],
  discoveries: [
    {
      id: "disc-fidelity",
      matterId: "matter-john",
      title: "Possible investment account",
      detail:
        "Fidelity Investments appears on the 2025 federal tax return. No Fidelity brokerage account was reported. The Fidelity 401(k) is a separate retirement plan.",
      sourceLabel: "2025 federal tax return",
      state: "open",
    },
  ],
};
