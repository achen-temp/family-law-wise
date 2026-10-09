export type MatterType = "Divorce" | "Post Judgment" | "Child Support" | "Other";

export type MatterStatus =
  | "DRAFT"
  | "INVITED"
  | "CLIENT_IN_PROGRESS"
  | "CLIENT_SUBMITTED"
  | "ATTORNEY_REVIEW"
  | "WAITING_FOR_CLIENT"
  | "COMPLETE";

export type RequirementStatus =
  | "MISSING"
  | "REQUESTED"
  | "UPLOADED"
  | "NEEDS_REVIEW"
  | "ACCEPTED"
  | "NOT_AVAILABLE"
  | "NOT_APPLICABLE"
  | "WAIVED";

export type RequirementSource = "TEMPLATE" | "QUESTIONNAIRE" | "ATTORNEY" | "AI_DISCOVERY";

export type DocumentStatus = "NEEDS_REVIEW" | "ACCEPTED" | "REJECTED" | "REPLACED";

export type SectionId =
  | "personal"
  | "employment"
  | "income"
  | "tax"
  | "bank"
  | "investments"
  | "retirement"
  | "real_estate"
  | "debts"
  | "credit"
  | "loans"
  | "insurance"
  | "business"
  | "other";

export type PayFrequency = "" | "Weekly" | "Bi-weekly" | "Semi-monthly" | "Monthly";

export type Party = {
  id: string;
  role: "CLIENT" | "OTHER_PARTY";
  firstName: string;
  lastName: string;
  email?: string;
};

export type Matter = {
  id: string;
  name: string;
  matterType: MatterType;
  state: string;
  county: string;
  templateId: string;
  status: MatterStatus;
  createdAt: string;
  lastClientActivity: string | null;
  parties: Party[];
  lastRequest?: {
    at: string;
    message: string;
    requirementIds: string[];
  };
};

export type BankAccount = {
  id: string;
  institution: string;
  accountType: "Checking" | "Savings" | "Money market";
  last4: string;
  ownership: "Individual" | "Joint";
};

export type CardAccount = {
  id: string;
  institution: string;
  last4: string;
};

export type Intake = {
  matterId: string;
  completed: SectionId[];
  personal: { phone: string; address: string };
  employment: {
    employed: boolean | null;
    employer: string;
    payFrequency: PayFrequency;
    bonuses: boolean | null;
    commissions: boolean | null;
  };
  income: { baseSalary: string; bonus: string };
  tax: { filed: boolean | null; year: string };
  bank: { hasAccounts: boolean | null; accounts: BankAccount[] };
  investments: { has: boolean | null; institution: string };
  retirement: { has: boolean | null; planName: string };
  realEstate: { owns: boolean | null; address: string };
  debts: { hasCards: boolean | null; cards: CardAccount[]; hasLoans: boolean | null; loanName: string };
  insurance: { hasLife: boolean | null };
  business: { has: boolean | null; name: string };
  other: { notes: string };
};

export type Requirement = {
  id: string;
  matterId: string;
  section: SectionId;
  title: string;
  description: string;
  reason: string;
  source: RequirementSource;
  status: RequirementStatus;
  required: boolean;
  groupLabel?: string;
  periodLabel?: string;
  unavailableReason?: string;
  unavailableNote?: string;
};

export type DocumentFile = {
  id: string;
  matterId: string;
  requirementIds: string[];
  filename: string;
  documentType: string;
  owner: string;
  institution?: string;
  accountLastFour?: string;
  periodLabel?: string;
  uploadedAt: string;
  uploadedBy: string;
  status: DocumentStatus;
  pages: number;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectNote?: string;
};

export type Activity = {
  id: string;
  matterId: string;
  at: string;
  actor: string;
  text: string;
};

export type Discovery = {
  id: string;
  matterId: string;
  title: string;
  detail: string;
  sourceLabel: string;
  state: "open" | "asked" | "dismissed";
};

export type Firm = {
  name: string;
  attorneyName: string;
  attorneyEmail: string;
  firstReminderDays: number;
  secondReminderDays: number;
  attorneyAlertDays: number;
};

export type BalanceFact = {
  matterId: string;
  group: string;
  value: string;
  source: string;
  confirmed: boolean;
};

export type State = {
  firm: Firm;
  matters: Matter[];
  intakes: Record<string, Intake>;
  requirements: Requirement[];
  documents: DocumentFile[];
  activity: Activity[];
  discoveries: Discovery[];
};
