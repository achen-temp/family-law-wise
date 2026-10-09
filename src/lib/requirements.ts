import type {
  BankAccount,
  CardAccount,
  Intake,
  Requirement,
  RequirementSource,
  SectionId,
} from "./types";

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
    tax: { filed: null, year: "2025" },
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
  section: SectionId;
  title: string;
  description: string;
  reason: string;
  source: RequirementSource;
  groupLabel?: string;
  periodLabel?: string;
};

function requirementId(matterId: string, draft: Draft) {
  return [
    "req",
    matterId,
    draft.section,
    slug(draft.groupLabel ?? "x"),
    slug(draft.title),
    slug(draft.periodLabel ?? "x"),
  ].join("-");
}

function ensure(list: Requirement[], matterId: string, draft: Draft) {
  const key = reqKey(draft);
  const found = list.find((item) => item.section === draft.section && reqKey(item) === key);
  if (found) {
    return list.map((item) => {
      if (item.id !== found.id) return item;
      return {
        ...item,
        description: draft.description,
        reason: draft.reason,
        status: item.status === "NOT_APPLICABLE" ? "MISSING" : item.status,
        unavailableReason: item.status === "NOT_APPLICABLE" ? undefined : item.unavailableReason,
        unavailableNote: item.status === "NOT_APPLICABLE" ? undefined : item.unavailableNote,
      };
    });
  }
  const created: Requirement = {
    id: requirementId(matterId, draft),
    matterId,
    status: "MISSING",
    required: true,
    ...draft,
  };
  return [...list, created];
}

function closeOpen(list: Requirement[], predicate: (item: Requirement) => boolean): Requirement[] {
  return list.map((item) =>
    predicate(item) && (item.status === "MISSING" || item.status === "REQUESTED")
      ? { ...item, status: "NOT_APPLICABLE" as const }
      : item,
  );
}

export function syncRequirements(existing: Requirement[], intake: Intake, matterId: string) {
  let list = existing.filter((item) => item.matterId === matterId);
  const rest = existing.filter((item) => item.matterId !== matterId);
  const employer = intake.employment.employer.trim() || "the employer";

  list = ensure(list, matterId, {
    section: "tax",
    title: "2025 federal tax return",
    description: "Upload the complete federal return, including all schedules.",
    reason: "Required by the NJ Divorce Financial Disclosure template.",
    source: "TEMPLATE",
  });

  if (intake.employment.employed === true) {
    list = ensure(list, matterId, {
      section: "income",
      title: "2025 W-2",
      description: "The most recent Form W-2.",
      reason: `Client reported employment at ${employer}.`,
      source: "QUESTIONNAIRE",
    });
    for (const number of [1, 2, 3]) {
      list = ensure(list, matterId, {
        section: "income",
        title: `Pay stub #${number}`,
        description: number === 1 ? "The most recent pay stub." : `Pay stub ${number} of the last three.`,
        reason: `Client is paid ${intake.employment.payFrequency || "regularly"} by ${employer}. The template asks for the last three stubs.`,
        source: "QUESTIONNAIRE",
      });
    }
    if (intake.employment.bonuses) {
      list = ensure(list, matterId, {
        section: "income",
        title: "Bonus documentation",
        description: "A recent bonus statement, letter, or pay stub that shows the bonus.",
        reason: "Client reported bonus income.",
        source: "QUESTIONNAIRE",
      });
    } else if (intake.employment.bonuses === false) {
      list = closeOpen(list, (item) => item.title === "Bonus documentation");
    }
    if (intake.employment.commissions) {
      list = ensure(list, matterId, {
        section: "income",
        title: "Commission documentation",
        description: "A statement showing commission income.",
        reason: "Client reported commission income.",
        source: "QUESTIONNAIRE",
      });
    } else if (intake.employment.commissions === false) {
      list = closeOpen(list, (item) => item.title === "Commission documentation");
    }
  } else if (intake.employment.employed === false) {
    list = closeOpen(
      list,
      (item) => item.section === "income" && ["2025 W-2", "Pay stub #1", "Pay stub #2", "Pay stub #3", "Bonus documentation", "Commission documentation"].includes(item.title),
    );
  }

  if (intake.tax.filed === false) {
    list = closeOpen(list, (item) => item.section === "tax");
  }

  if (intake.bank.hasAccounts === true) {
    for (const account of intake.bank.accounts) {
      if (!account.institution.trim() || account.last4.trim().length < 4) continue;
      const group = bankGroup(account);
      for (const month of LOOKBACK) {
        list = ensure(list, matterId, {
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
  } else if (intake.bank.hasAccounts === false) {
    list = closeOpen(list, (item) => item.section === "bank");
  }

  if (intake.investments.has === true && intake.investments.institution.trim()) {
    list = ensure(list, matterId, {
      section: "investments",
      title: "Latest brokerage statement",
      description: "The most recent brokerage or investment statement.",
      reason: `Client reported an account at ${intake.investments.institution.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.investments.institution.trim(),
    });
  } else if (intake.investments.has === false) {
    list = closeOpen(list, (item) => item.section === "investments" && item.source !== "AI_DISCOVERY");
  }

  if (intake.retirement.has === true && intake.retirement.planName.trim()) {
    list = ensure(list, matterId, {
      section: "retirement",
      title: "Latest statement",
      description: "The most recent retirement plan statement.",
      reason: `Client reported ${intake.retirement.planName.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.retirement.planName.trim(),
    });
  } else if (intake.retirement.has === false) {
    list = closeOpen(list, (item) => item.section === "retirement");
  }

  if (intake.realEstate.owns === true && intake.realEstate.address.trim()) {
    const group = intake.realEstate.address.trim();
    list = ensure(list, matterId, {
      section: "real_estate",
      title: "Mortgage statement",
      description: "The most recent mortgage statement.",
      reason: `Client reported real estate at ${group}.`,
      source: "QUESTIONNAIRE",
      groupLabel: group,
    });
    list = ensure(list, matterId, {
      section: "real_estate",
      title: "Property tax statement",
      description: "The most recent property tax bill or statement.",
      reason: `Client reported real estate at ${group}.`,
      source: "QUESTIONNAIRE",
      groupLabel: group,
    });
  } else if (intake.realEstate.owns === false) {
    list = closeOpen(list, (item) => item.section === "real_estate");
  }

  if (intake.debts.hasCards === true) {
    for (const card of intake.debts.cards) {
      if (!card.institution.trim() || card.last4.trim().length < 4) continue;
      const group = cardGroup(card);
      list = ensure(list, matterId, {
        section: "credit",
        title: "Latest statement",
        description: "The most recent credit card statement.",
        reason: `Client reported ${group}.`,
        source: "QUESTIONNAIRE",
        groupLabel: group,
      });
    }
  } else if (intake.debts.hasCards === false) {
    list = closeOpen(list, (item) => item.section === "credit");
  }

  if (intake.debts.hasLoans === true && intake.debts.loanName.trim()) {
    list = ensure(list, matterId, {
      section: "loans",
      title: "Latest loan statement",
      description: "The most recent loan statement.",
      reason: `Client reported a loan with ${intake.debts.loanName.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.debts.loanName.trim(),
    });
  } else if (intake.debts.hasLoans === false) {
    list = closeOpen(list, (item) => item.section === "loans");
  }

  if (intake.insurance.hasLife === true) {
    list = ensure(list, matterId, {
      section: "insurance",
      title: "Life insurance statement",
      description: "A recent statement showing the policy and any cash value.",
      reason: "Client reported a life insurance policy.",
      source: "QUESTIONNAIRE",
    });
  } else if (intake.insurance.hasLife === false) {
    list = closeOpen(list, (item) => item.section === "insurance");
  }

  if (intake.business.has === true && intake.business.name.trim()) {
    list = ensure(list, matterId, {
      section: "business",
      title: "Recent business financials",
      description: "A recent profit and loss statement or business tax return.",
      reason: `Client reported an interest in ${intake.business.name.trim()}.`,
      source: "QUESTIONNAIRE",
      groupLabel: intake.business.name.trim(),
    });
  } else if (intake.business.has === false) {
    list = closeOpen(list, (item) => item.section === "business");
  }

  return [...rest, ...list];
}

export function baselineRequirements(matterId: string) {
  const intake = blankIntake(matterId);
  intake.employment.employed = true;
  intake.employment.payFrequency = "Bi-weekly";
  intake.tax.filed = true;
  return syncRequirements([], intake, matterId).map((item) => ({
    ...item,
    source: "TEMPLATE" as const,
    reason: "Required by the NJ Divorce Financial Disclosure template.",
  }));
}
