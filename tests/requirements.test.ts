import assert from "node:assert/strict";
import test from "node:test";
import { baselineRequirements, blankIntake, LOOKBACK, syncRequirements, TAX_YEAR } from "../src/lib/requirements";
import type { Requirement } from "../src/lib/types";

function withBank() {
  const intake = blankIntake("test");
  intake.bank = { hasAccounts: true, accounts: [
    { id: "account-1", institution: "Chase", last4: "1234", accountType: "Checking", ownership: "Individual" },
  ] };
  return intake;
}

test("blank matter does not presume employment; demo periods stay pinned", () => {
  assert.deepEqual(baselineRequirements("test").map((item) => item.title), [`${TAX_YEAR} federal tax return`]);
  const requirements = syncRequirements([], withBank(), "test");
  assert.deepEqual(requirements.filter((item) => item.section === "bank").map((item) => item.periodLabel), LOOKBACK);
});

test("renaming an account updates labels without losing IDs, decisions or file links", () => {
  const intake = withBank();
  const original = syncRequirements([], intake, "test").map((item): Requirement => ({ ...item, status: "ACCEPTED" }));
  const linkedIds = original.filter((item) => item.section === "bank").map((item) => item.id);
  intake.bank.accounts[0].institution = "Chase Bank";
  const updated = syncRequirements(original, intake, "test");
  assert.equal(updated.length, original.length);
  for (const id of linkedIds) {
    const requirement = updated.find((item) => item.id === id)!;
    assert.equal(requirement.status, "ACCEPTED");
    assert.equal(requirement.groupLabel, "Chase Bank Checking ****1234");
  }
});

test("removal retires all statuses and restoration preserves their prior decisions", () => {
  const intake = withBank();
  const statuses = ["ACCEPTED", "NEEDS_REVIEW", "NOT_AVAILABLE"] as const;
  const original = syncRequirements([], intake, "test").map((item, index): Requirement => item.section === "bank"
    ? { ...item, status: statuses[(index - 1) % 3], unavailableNote: "Waiting for bank" } : item);
  const removed = syncRequirements(original, { ...intake, bank: { hasAccounts: false, accounts: [] } }, "test");
  assert.equal(removed.filter((item) => item.section === "bank" && item.status === "NOT_APPLICABLE").length, 3);
  const restored = syncRequirements(removed, intake, "test");
  assert.deepEqual(restored.map((item) => [item.id, item.status, item.unavailableNote]), original.map((item) => [item.id, item.status, item.unavailableNote]));
});

test("new account gets independent requirements while removed account history remains", () => {
  const intake = withBank();
  const original = syncRequirements([], intake, "test");
  intake.bank.accounts[0] = { ...intake.bank.accounts[0], id: "account-2", institution: "PNC" };
  const changed = syncRequirements(original, intake, "test");
  assert.equal(changed.filter((item) => item.section === "bank" && item.status === "MISSING").length, 3);
  assert.equal(changed.filter((item) => item.section === "bank" && item.status === "NOT_APPLICABLE").length, 3);
});

test("conditional changes retire generated requests only, retain custom/discovery and other matters", () => {
  const intake = withBank();
  intake.employment = { employed: true, employer: "Employer", payFrequency: "Monthly", bonuses: true, commissions: true };
  intake.investments = { has: true, institution: "Broker" };
  const original = syncRequirements([], intake, "test");
  const custom: Requirement = { ...original[0], id: "custom", answerKey: undefined, source: "ATTORNEY", status: "REQUESTED" };
  const discovery: Requirement = { ...custom, id: "discovery", source: "AI_DISCOVERY" };
  const other = { ...original[0], id: "other", matterId: "unrelated" };
  const waived: Requirement = { ...original[0], status: "WAIVED" };
  const changed = syncRequirements([waived, ...original.slice(1), custom, discovery, other], blankIntake("test"), "test");
  assert.deepEqual(changed.find((item) => item.id === "custom"), custom);
  assert.deepEqual(changed.find((item) => item.id === "discovery"), discovery);
  assert.deepEqual(changed.find((item) => item.id === "other"), other);
  assert.equal(changed.find((item) => item.id === waived.id)?.status, "WAIVED");
  assert.ok(changed.filter((item) => item.section === "income").every((item) => item.status === "NOT_APPLICABLE"));
});
