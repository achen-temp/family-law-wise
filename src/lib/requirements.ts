import type {
  BankAccount,
  CardAccount,
  Intake,
  Requirement,
  RequirementSource,
  SectionId,
} from "./types";

// Deliberately pinned fixtures, independent of the date a demo matter is created.
export const DEMO_REFERENCE_DATE = "2026-04-01";
export const TAX_YEAR = "2025";
export const LOOKBACK = ["January 2026", "February 2026", "March 2026"];

export function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function reqKey(requirement: { title: string; groupLabel?: string }) {
  return `${requirement.groupLabel ?? ""}::${requirement.title}`;
}

export function bankGroup(account: Pick<BankAccount, "institution" | "accountType" | "last4">) {
  return `${account.institution} ${account.accountType} ****${account.last4}`;
}

export function cardGroup(card: Pick<CardAccount, "institution" | "last4">) {
  return `${card.institution} ****${card.last4}`;
}

export function blankIntake(matterId: string): Intake {
  return {
    matterId,
    completed: [],
    personal: { phone: "", address: "" },
    employment: {
      employed: null,
      employer: "",
      payFrequency: "",
      bonuses: null,
      commissions: null,
    },
    income: { baseSalary: "", bonus: "" },
    tax: { filed: null, year: TAX_YEAR },
    bank: { hasAccounts: null, accounts: [] },
    investments: { has: null, institution: "" },
    retirement: { has: null, planName: "" },
    realEstate: { owns: null, address: "" },
    debts: { hasCards: null, cards: [], hasLoans: null, loanName: "" },
    insurance: { hasLife: null },
    business: { has: null, name: "" },
    other: { notes: "" },
  };
}

type Draft = {
  answerKey: string;
  section: SectionId;
  title: string;
  description: string;
  reason: string;
  source: RequirementSource;
  groupLabel?: string;
  periodLabel?: string;
};

function addRequirement(list: Requirement[], matterId: string, draft: Draft) {
  list.push({
    id: `req-${matterId}-${draft.answerKey}`,
    matterId,
    status: "MISSING",
    required: true,
    ...draft,
  });
}

export function syncRequirements(existing: Requirement[], intake: Intake, matterId: string) {
  const list: Requirement[] = [];
  const rest = existing.filter((item) => item.matterId !== matterId);
  const employer = intake.employment.employer.trim() || "the employer";

  if (intake.tax.filed !== false) addRequirement(list, matterId, {
    answerKey: "tax-return",
    section: "tax",
    title: `${TAX_YEAR} federal tax return`,
    description: "Upload the complete federal return, including all schedules.",
    reason: "Required by the NJ Divorce Financial Disclosure template.",
    source: "TEMPLATE",
  });

  if (intake.employment.employed === true) {
    addRequirement(list, matterId, {
      answerKey: "employment-w2",
      section: "income",
      title: `${TAX_YEAR} W-2`,
      description: "The most recent Form W-2.",
      reason: `Client reported employment at ${employer}.`,
      source: "QUESTIONNAIRE",
    });
    for (const number of [1, 2, 3]) {
      addRequirement(list, matterId, {
        answerKey: `employment-pay-stub-${number}`,
        section: "income",
        title: `Pay stub #${number}`,
        description: number === 1 ? "The most recent pay stub." : `Pay stub ${number} of the last three.`,
        reason: `Client is paid ${intake.employment.payFrequency || "regularly"} by ${employer}. The template asks for the last three stubs.`,
        source: "QUESTIONNAIRE",
      });
    }
    if (intake.employment.bonuses) {
      addRequirement(list, matterId, {
        answerKey: "employment-bonus",
        section: "income",
        title: "Bonus documentation",
        description: "A recent bonus statement, letter, or pay stub that shows the bonus.",
        reason: "Client reported bonus income.",
        source: "QUESTIONNAIRE",
      });
    }
    if (intake.employment.commissions) {
      addRequirement(list, matterId, {
        answerKey: "employment-commission",
        section: "income",
        title: "Commission documentation",
        description: "A statement showing commission income.",
        reason: "Client reported commission income.",
        source: "QUESTIONNAIRE",
      });
    }
  }

  if (intake.bank.hasAccounts === true) {
    for (const account of intake.bank.accounts) {
      if (!account.institution.trim() || !/^\d{4}$/.test(account.last4.trim())) continue;
      const group = bankGroup(account);
      for (const month of LOOKBACK) {
        addRequirement(list, matterId, {
          answerKey: `bank-${account.id}-${slug(month)}`,
          section: "bank",
          title: `${month} statement`,
          description: `Statement covering ${month}.`,
          reason: `Client reported ${group}.`,
          source: "QUESTIONNAIRE",
          groupLabel: group,
          periodLabel: month,
        });
      }
    }
  }

  if (intake.investments.has === true && intake.investments.institution.trim()) {
    addRequirement(list, matterId, {
      answerKey: "investments-statement",
      section: "investments",
      title: "Latest brokerage statement",
      description: "The most recent brokerage or investment statement.",
      reason: `Client reported an account at ${intake.investments.institution.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.investments.institution.trim(),
    });
  }

  if (intake.retirement.has === true && intake.retirement.planName.trim()) {
    addRequirement(list, matterId, {
      answerKey: "retirement-statement",
      section: "retirement",
      title: "Latest statement",
      description: "The most recent retirement plan statement.",
      reason: `Client reported ${intake.retirement.planName.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.retirement.planName.trim(),
    });
  }

  if (intake.realEstate.owns === true && intake.realEstate.address.trim()) {
    const group = intake.realEstate.address.trim();
    addRequirement(list, matterId, {
      answerKey: "real-estate-mortgage",
      section: "real_estate",
      title: "Mortgage statement",
      description: "The most recent mortgage statement.",
      reason: `Client reported real estate at ${group}.`,
      source: "QUESTIONNAIRE",
      groupLabel: group,
    });
    addRequirement(list, matterId, {
      answerKey: "real-estate-tax",
      section: "real_estate",
      title: "Property tax statement",
      description: "The most recent property tax bill or statement.",
      reason: `Client reported real estate at ${group}.`,
      source: "QUESTIONNAIRE",
      groupLabel: group,
    });
  }

  if (intake.debts.hasCards === true) {
    for (const card of intake.debts.cards) {
      if (!card.institution.trim() || !/^\d{4}$/.test(card.last4.trim())) continue;
      const group = cardGroup(card);
      addRequirement(list, matterId, {
        answerKey: `credit-${card.id}`,
        section: "credit",
        title: "Latest statement",
        description: "The most recent credit card statement.",
        reason: `Client reported ${group}.`,
        source: "QUESTIONNAIRE",
        groupLabel: group,
      });
    }
  }

  if (intake.debts.hasLoans === true && intake.debts.loanName.trim()) {
    addRequirement(list, matterId, {
      answerKey: "loan-statement",
      section: "loans",
      title: "Latest loan statement",
      description: "The most recent loan statement.",
      reason: `Client reported a loan with ${intake.debts.loanName.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.debts.loanName.trim(),
    });
  }

  if (intake.insurance.hasLife === true) {
    addRequirement(list, matterId, {
      answerKey: "insurance-statement",
      section: "insurance",
      title: "Life insurance statement",
      description: "A recent statement showing the policy and any cash value.",
      reason: "Client reported a life insurance policy.",
      source: "QUESTIONNAIRE",
    });
  }

  if (intake.business.has === true && intake.business.name.trim()) {
    addRequirement(list, matterId, {
      answerKey: "business-financials",
      section: "business",
      title: "Recent business financials",
      description: "A recent profit and loss statement or business tax return.",
      reason: `Client reported an interest in ${intake.business.name.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.business.name.trim(),
    });
  }

  const previous = existing.filter((item) => item.matterId === matterId);
  const reconciled = previous.map((item): Requirement => {
    if (!item.answerKey) return item; // Attorney requests and discovery are independently managed.
    const next = list.find((candidate) => candidate.answerKey === item.answerKey);
    if (next) {
      return { ...item, ...next, id: item.id, status: item.inactiveStatus ?? item.status,
        inactiveStatus: undefined };
    }
    if (item.status === "NOT_APPLICABLE") return item;
    return { ...item, status: "NOT_APPLICABLE", inactiveStatus: item.status };
  });
  const added = list.filter((item) => !previous.some((prior) => prior.answerKey === item.answerKey));
  return [...rest, ...reconciled, ...added];
}

export function baselineRequirements(matterId: string) {
  return syncRequirements([], blankIntake(matterId), matterId);
}
