import type { Intake, SectionId } from "./types";
import { TAX_YEAR } from "./requirements";

function validAmount(value: string) {
  const amount = value.trim();
  return /^\d+(\.\d{1,2})?$/.test(amount) && Number.isFinite(Number(amount));
}

export type IntakeValidationIssue = { field: string; message: string };

function issue(field: string, message: string): IntakeValidationIssue {
  return { field, message };
}

/** Validate only visible answers in the section being completed. */
export function getIntakeValidationIssue(section: SectionId, intake: Intake): IntakeValidationIssue | null {
  switch (section) {
    case "personal": {
      const phone = intake.personal.phone.trim();
      if (!phone) return issue("personal.phone", "Add a phone number.");
      const digits = phone.replace(/\D/g, "");
      if (!/^[+\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15) {
        return issue("personal.phone", "Enter a phone number with 7–15 digits.");
      }
      return intake.personal.address.trim() ? null : issue("personal.address", "Add your address.");
    }
    case "employment":
      if (intake.employment.employed === null) return issue("employment.employed", "Say whether you are employed.");
      if (!intake.employment.employed) return null;
      if (!intake.employment.employer.trim()) return issue("employment.employer", "Add the employer name.");
      if (!["Weekly", "Bi-weekly", "Semi-monthly", "Monthly"].includes(intake.employment.payFrequency)) {
        return issue("employment.payFrequency", "Select how often you are paid.");
      }
      if (intake.employment.bonuses === null) return issue("employment.bonuses", "Say whether you receive bonuses.");
      return intake.employment.commissions === null ? issue("employment.commissions", "Say whether you receive commissions.") : null;
    case "income":
      if (!intake.completed.includes("employment") || validateIntakeSection("employment", intake)) return issue("employment-link", "Complete the employment section before confirming income.");
      if (!intake.employment.employed) return null;
      if (!validAmount(intake.income.baseSalary)) return issue("income.baseSalary", "Enter a base salary of 0 or more, using numbers and up to two decimal places.");
      if ((intake.employment.bonuses || intake.employment.commissions) && !validAmount(intake.income.bonus)) {
        return issue("income.bonus", "Enter bonus and commission income of 0 or more, using numbers and up to two decimal places.");
      }
      return null;
    case "tax":
      if (intake.tax.year.trim() !== TAX_YEAR) return issue("tax.filed", `This dated demo uses tax year ${TAX_YEAR}.`);
      return intake.tax.filed === null ? issue("tax.filed", "Say whether you filed a return.") : null;
    case "bank":
      if (intake.bank.hasAccounts === null) return issue("bank.hasAccounts", "Say whether you have bank accounts.");
      if (!intake.bank.hasAccounts) return null;
      if (!intake.bank.accounts.length) return issue("bank.add", "Add at least one bank account, or choose No.");
      for (const [index, account] of intake.bank.accounts.entries()) {
        if (!account.institution.trim()) return issue(`bank.${account.id}.institution`, `Add the institution for bank account ${index + 1}, or remove the account.`);
        if (!/^\d{4}$/.test(account.last4.trim())) return issue(`bank.${account.id}.last4`, `Enter exactly 4 digits for bank account ${index + 1}.`);
      }
      return null;
    case "investments":
      if (intake.investments.has === null) return issue("investments.has", "Say whether you have investment accounts.");
      return intake.investments.has && !intake.investments.institution.trim() ? issue("investments.institution", "Add the investment institution.") : null;
    case "retirement":
      if (intake.retirement.has === null) return issue("retirement.has", "Say whether you have a retirement plan.");
      return intake.retirement.has && !intake.retirement.planName.trim() ? issue("retirement.planName", "Add the retirement plan name.") : null;
    case "real_estate":
      if (intake.realEstate.owns === null) return issue("realEstate.owns", "Say whether you own real estate.");
      return intake.realEstate.owns && !intake.realEstate.address.trim() ? issue("realEstate.address", "Add the property address.") : null;
    case "debts":
      if (intake.debts.hasCards === null) return issue("debts.hasCards", "Say whether you have credit cards.");
      if (intake.debts.hasCards) {
        if (!intake.debts.cards.length) return issue("debts.add", "Add at least one credit card, or choose No.");
        for (const [index, card] of intake.debts.cards.entries()) {
          if (!card.institution.trim()) return issue(`debts.${card.id}.institution`, `Add the institution for credit card ${index + 1}, or remove the card.`);
          if (!/^\d{4}$/.test(card.last4.trim())) return issue(`debts.${card.id}.last4`, `Enter exactly 4 digits for credit card ${index + 1}.`);
        }
      }
      if (intake.debts.hasLoans === null) return issue("debts.hasLoans", "Say whether you have other loans.");
      return intake.debts.hasLoans && !intake.debts.loanName.trim() ? issue("debts.loanName", "Add the lender name.") : null;
    case "insurance":
      return intake.insurance.hasLife === null ? issue("insurance.hasLife", "Say whether you have life insurance.") : null;
    case "business":
      if (intake.business.has === null) return issue("business.has", "Say whether you have a business interest.");
      return intake.business.has && !intake.business.name.trim() ? issue("business.name", "Add the business name.") : null;
    case "other":
      return null;
    default:
      return issue("section", "This section is not part of the questionnaire.");
  }
}

export function validateIntakeSection(section: SectionId, intake: Intake): string {
  return getIntakeValidationIssue(section, intake)?.message ?? "";
}

/** Trim the completed section without changing drafts in other sections. */
export function normalizeIntakeSection(section: SectionId, intake: Intake): Intake {
  switch (section) {
    case "personal":
      return { ...intake, personal: { phone: intake.personal.phone.trim(), address: intake.personal.address.trim() } };
    case "employment":
      return { ...intake, employment: { ...intake.employment, employer: intake.employment.employer.trim() } };
    case "income":
      return { ...intake, income: { baseSalary: intake.income.baseSalary.trim(), bonus: intake.income.bonus.trim() } };
    case "tax":
      return { ...intake, tax: { ...intake.tax, year: intake.tax.year.trim() } };
    case "bank":
      return { ...intake, bank: { ...intake.bank, accounts: intake.bank.accounts.map((account) => ({ ...account, institution: account.institution.trim(), last4: account.last4.trim() })) } };
    case "investments":
      return { ...intake, investments: { ...intake.investments, institution: intake.investments.institution.trim() } };
    case "retirement":
      return { ...intake, retirement: { ...intake.retirement, planName: intake.retirement.planName.trim() } };
    case "real_estate":
      return { ...intake, realEstate: { ...intake.realEstate, address: intake.realEstate.address.trim() } };
    case "debts":
      return { ...intake, debts: { ...intake.debts, loanName: intake.debts.loanName.trim(), cards: intake.debts.cards.map((card) => ({ ...card, institution: card.institution.trim(), last4: card.last4.trim() })) } };
    case "business":
      return { ...intake, business: { ...intake.business, name: intake.business.name.trim() } };
    case "other":
      return { ...intake, other: { notes: intake.other.notes.trim() } };
    default:
      return intake;
  }
}
