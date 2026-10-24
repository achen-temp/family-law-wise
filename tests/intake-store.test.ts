import assert from "node:assert/strict";
import test from "node:test";
import { reducer } from "../src/lib/store";
import { initialState } from "../src/lib/seed";
import { matterQueue, workspaceCounts } from "../src/lib/work-queues";

const id = "matter-john";

test("invalid drafts survive navigation without changing requirements or files", () => {
  const draft = structuredClone(initialState.intakes[id]);
  draft.bank.accounts[0].institution = "";
  const edited = reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId: id, intake: draft, section: "bank" });
  assert.equal(edited.intakeDrafts?.[id].bank.accounts[0].institution, "");
  assert.equal(edited.intakes[id].bank.accounts[0].institution, "Chase");
  assert.equal(edited.intakes[id].completed.includes("bank"), false);
  assert.equal(edited.requirements, initialState.requirements);
  assert.equal(edited.documents, initialState.documents);
  assert.equal(reducer(edited, { type: "SAVE_INTAKE", matterId: id, intake: draft, completedSection: "bank" }), edited);
});

test("submitting another section leaves unfinished drafts intact and uncommitted", () => {
  const draft = structuredClone(initialState.intakes[id]);
  draft.bank.accounts[0].institution = "New Bank";
  const edited = reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId: id, intake: draft, section: "bank" });
  draft.personal.phone = " 9735551234 ";
  const saved = reducer(edited, { type: "SAVE_INTAKE", matterId: id, intake: draft, completedSection: "personal" });
  assert.equal(saved.intakes[id].personal.phone, "9735551234");
  assert.equal(saved.intakes[id].bank.accounts[0].institution, "Chase");
  assert.equal(saved.intakeDrafts?.[id].bank.accounts[0].institution, "New Bank");
  assert.deepEqual(saved.intakeDirtySections?.[id], ["bank"]);
});

test("submitting changed bank answers synchronizes requirements and preserves document objects", () => {
  const draft = structuredClone(initialState.intakes[id]);
  draft.bank.accounts = [draft.bank.accounts[0]];
  draft.bank.accounts[0].institution = "Chase Bank";
  const edited = reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId: id, intake: draft, section: "bank" });
  const saved = reducer(edited, { type: "SAVE_INTAKE", matterId: id, intake: draft, completedSection: "bank" });
  assert.equal(saved.documents, initialState.documents);
  assert.ok(saved.requirements.filter((item) => item.matterId === id && item.groupLabel?.includes("8821")).every((item) => item.status === "NOT_APPLICABLE"));
  assert.ok(saved.requirements.some((item) => item.matterId === id && item.groupLabel?.includes("Chase Bank") && item.status === "ACCEPTED"));
  assert.deepEqual(saved.intakeDirtySections?.[id], []);
});

test("employment edit invalidates income completion and blocks submission against unconfirmed employment", () => {
  const draft = structuredClone(initialState.intakes[id]);
  draft.employment.employer = "Another employer";
  const edited = reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId: id, intake: draft, section: "employment" });
  assert.equal(edited.intakes[id].completed.includes("income"), false);
  assert.equal(edited.intakes[id].completed.includes("employment"), false);
  assert.equal(reducer(edited, { type: "SAVE_INTAKE", matterId: id, intake: draft, completedSection: "income" }), edited);
});

test("reviewing a retired requirement updates the decision restored on reactivation", () => {
  for (const decision of ["ACCEPT_DOCUMENT", "REJECT_DOCUMENT"] as const) {
    const original = initialState.intakes[id];
    const draft = { ...original, bank: { ...original.bank, hasAccounts: false } };
    const retired = reducer(initialState, { type: "SAVE_INTAKE", matterId: id, intake: draft, completedSection: "bank" });
    const requirement = initialState.requirements.find((item) => item.matterId === id && item.section === "bank" && item.status === "NEEDS_REVIEW")!;
    const document = initialState.documents.find((item) => item.requirementIds.includes(requirement.id))!;
    const reviewed = reducer(retired, decision === "ACCEPT_DOCUMENT"
      ? { type: decision, documentId: document.id }
      : { type: decision, documentId: document.id, note: "Wrong statement" });
    assert.equal(reviewed.requirements.find((item) => item.id === requirement.id)?.status, "NOT_APPLICABLE");
    const restored = reducer(reviewed, { type: "SAVE_INTAKE", matterId: id, intake: original, completedSection: "bank" });
    assert.equal(restored.requirements.find((item) => item.id === requirement.id)?.status, decision === "ACCEPT_DOCUMENT" ? "ACCEPTED" : "MISSING");
  }
});

test("editing a complete questionnaire reopens the matter and records why", () => {
  const matterId = "matter-sarah";
  const draft = structuredClone(initialState.intakes[matterId]);
  assert.equal(reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId, intake: draft, section: "bank" }), initialState);
  draft.bank.accounts[0].institution = "PNC Bank";
  const edited = reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId, intake: draft, section: "bank" });
  assert.equal(edited.matters.find((item) => item.id === matterId)?.status, "CLIENT_IN_PROGRESS");
  assert.equal(edited.intakes[matterId].completed.includes("bank"), false);
  assert.match(edited.activity[0].text, /Reopened/);
  assert.equal(workspaceCounts(edited).complete, 0);
  const saved = reducer(edited, { type: "SAVE_INTAKE", matterId, intake: draft, completedSection: "bank" });
  assert.equal(matterQueue(saved, saved.matters.find((item) => item.id === matterId)!), "waiting");
});
