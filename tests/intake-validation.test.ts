import { strict as assert } from "node:assert";
import { test } from "node:test";
import { INTAKE_STEPS } from "../src/lib/content";
import { getIntakeValidationIssue, normalizeIntakeSection, validateIntakeSection } from "../src/lib/intake-validation";
import { blankIntake, TAX_YEAR } from "../src/lib/requirements";
import type { Intake, SectionId } from "../src/lib/types";

function validIntake(): Intake {
  return {
    ...blankIntake("test"),
    completed: ["employment"],
    personal: { phone: "+1 (201) 555-0123", address: "10 Main Street" },
    employment: { employed: true, employer: "Example Co", payFrequency: "Monthly", bonuses: false, commissions: false },
    income: { baseSalary: "0", bonus: "" },
    tax: { filed: true, year: TAX_YEAR },
    bank: { hasAccounts: true, accounts: [{ id: "bank-1", institution: "Example Bank", accountType: "Checking", last4: "0012", ownership: "Individual" }] },
    investments: { has: true, institution: "Example Investments" },
    retirement: { has: true, planName: "Example 401(k)" },
    realEstate: { owns: true, address: "10 Main Street" },
    debts: { hasCards: true, cards: [{ id: "card-1", institution: "Example Card", last4: "0034" }], hasLoans: true, loanName: "Example Lender" },
    insurance: { hasLife: true },
    business: { has: true, name: "Example Business" },
  };
}

test("all twelve questionnaire sections accept a complete valid intake", () => {
  assert.equal(INTAKE_STEPS.length, 12);
  for (const step of INTAKE_STEPS) assert.equal(validateIntakeSection(step.id, validIntake()), "", step.id);
});

test("blank required sections fail, while other notes remain optional", () => {
  for (const step of INTAKE_STEPS) {
    const error = validateIntakeSection(step.id, blankIntake("test"));
    if (step.id === "other") assert.equal(error, "");
    else assert.ok(error, step.id);
  }
});

test("personal contact details require a nonblank address and a plausible phone", () => {
  const intake = validIntake();
  for (const phone of [" ", "123", "not-a-phone", "1234567890123456"]) {
    intake.personal.phone = phone;
    assert.equal(getIntakeValidationIssue("personal", intake)?.field, "personal.phone");
  }
  intake.personal.phone = "201-555-0123";
  intake.personal.address = " \n ";
  assert.equal(getIntakeValidationIssue("personal", intake)?.field, "personal.address");
});

test("employment requires its visible employer, pay frequency and explicit yes/no answers", () => {
  const cases: [Partial<Intake["employment"]>, string][] = [
    [{ employer: "  " }, "employment.employer"],
    [{ payFrequency: "" }, "employment.payFrequency"],
    [{ bonuses: null }, "employment.bonuses"],
    [{ commissions: null }, "employment.commissions"],
  ];
  for (const [patch, field] of cases) {
    const intake = validIntake();
    Object.assign(intake.employment, patch);
    assert.equal(getIntakeValidationIssue("employment", intake)?.field, field);
  }
  const intake = blankIntake("test");
  intake.employment.employed = false;
  assert.equal(validateIntakeSection("employment", intake), "");
});

test("income waits for confirmed employment, validates money, and ignores inactive amounts", () => {
  const intake = validIntake();
  intake.completed = [];
  assert.equal(getIntakeValidationIssue("income", intake)?.field, "employment-link");
  intake.completed = ["employment"];
  for (const amount of ["", " ", "-1", "NaN", "Infinity", "1e4", "1,000", "12x", "1.234"]) {
    intake.income.baseSalary = amount;
    assert.equal(getIntakeValidationIssue("income", intake)?.field, "income.baseSalary", amount);
  }
  for (const amount of ["0", "0.00", " 123.45 "]) {
    intake.income.baseSalary = amount;
    assert.equal(validateIntakeSection("income", intake), "");
  }
  intake.employment.commissions = true;
  assert.equal(getIntakeValidationIssue("income", intake)?.field, "income.bonus");
  intake.income.bonus = "0";
  assert.equal(validateIntakeSection("income", intake), "");
  intake.employment.bonuses = true;
  intake.income.bonus = "-12";
  assert.equal(getIntakeValidationIssue("income", intake)?.field, "income.bonus");
  intake.employment.employed = false;
  intake.income.baseSalary = "invalid hidden salary";
  assert.equal(validateIntakeSection("income", intake), "");
});

test("tax return yes/no uses the fixed demo tax year", () => {
  const intake = validIntake();
  intake.tax.filed = false;
  assert.equal(validateIntakeSection("tax", intake), "");
  intake.tax.year = "2024";
  assert.match(validateIntakeSection("tax", intake), new RegExp(TAX_YEAR));
});

test("bank accounts and credit cards require an institution and exactly four numeric digits", () => {
  for (const section of ["bank", "debts"] as const) {
    const intake = validIntake();
    const account = section === "bank" ? intake.bank.accounts[0] : intake.debts.cards[0];
    const prefix = section === "bank" ? "bank.bank-1" : "debts.card-1";
    account.institution = "  ";
    assert.equal(getIntakeValidationIssue(section, intake)?.field, `${prefix}.institution`);
    account.institution = "Example";
    for (const last4 of ["", "123", "12345", "abcd", "12 4"]) {
      account.last4 = last4;
      assert.equal(getIntakeValidationIssue(section, intake)?.field, `${prefix}.last4`, last4);
    }
    account.last4 = " 0012 ";
    assert.equal(validateIntakeSection(section, intake), "");
    if (section === "bank") intake.bank.accounts = [];
    else intake.debts.cards = [];
    assert.match(validateIntakeSection(section, intake), /at least one/);
  }
});

test("conditional details and loan yes/no cannot be skipped", () => {
  const cases: [SectionId, (intake: Intake) => void, string][] = [
    ["investments", (i) => { i.investments.institution = " "; }, "investments.institution"],
    ["retirement", (i) => { i.retirement.planName = " "; }, "retirement.planName"],
    ["real_estate", (i) => { i.realEstate.address = " "; }, "realEstate.address"],
    ["debts", (i) => { i.debts.hasLoans = null; }, "debts.hasLoans"],
    ["debts", (i) => { i.debts.loanName = " "; }, "debts.loanName"],
    ["business", (i) => { i.business.name = " "; }, "business.name"],
  ];
  for (const [section, patch, field] of cases) {
    const intake = validIntake();
    patch(intake);
    assert.equal(getIntakeValidationIssue(section, intake)?.field, field);
  }
});

test("No answers ignore incomplete stale hidden details", () => {
  const intake = blankIntake("test");
  intake.completed = ["employment"];
  intake.employment.employed = false;
  intake.bank.hasAccounts = false;
  intake.bank.accounts = [{ id: "stale", institution: "", accountType: "Checking", last4: "", ownership: "Individual" }];
  intake.investments.has = false;
  intake.retirement.has = false;
  intake.realEstate.owns = false;
  intake.debts.hasCards = false;
  intake.debts.cards = [{ id: "stale", institution: "", last4: "" }];
  intake.debts.hasLoans = false;
  intake.insurance.hasLife = false;
  intake.business.has = false;
  for (const section of ["employment", "income", "bank", "investments", "retirement", "real_estate", "debts", "insurance", "business"] as const) {
    assert.equal(validateIntakeSection(section, intake), "", section);
  }
});

test("normalization trims only the completed section and preserves IDs and other drafts", () => {
  const intake = validIntake();
  intake.bank.accounts[0].institution = "  Example Bank  ";
  intake.bank.accounts[0].last4 = " 0012 ";
  intake.other.notes = " unconfirmed draft ";
  const normalized = normalizeIntakeSection("bank", intake);
  assert.equal(normalized.bank.accounts[0].institution, "Example Bank");
  assert.equal(normalized.bank.accounts[0].last4, "0012");
  assert.equal(normalized.bank.accounts[0].id, "bank-1");
  assert.equal(normalized.other, intake.other);
  assert.equal(intake.bank.accounts[0].institution, "  Example Bank  ");
  intake.debts.cards[0].institution = " Example Card ";
  intake.debts.loanName = " Example Lender ";
  const debts = normalizeIntakeSection("debts", intake).debts;
  assert.equal(debts.cards[0].institution, "Example Card");
  assert.equal(debts.loanName, "Example Lender");
});

test("checklist-only sections cannot be completed as questionnaire steps", () => {
  assert.ok(validateIntakeSection("credit", validIntake()));
  assert.ok(validateIntakeSection("loans", validIntake()));
});
