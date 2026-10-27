import assert from "node:assert/strict";
import test from "node:test";
import { matterMatchesQuery, matterQueue, parseQueue, workspaceCounts } from "../src/lib/work-queues";
import { firmDetailsError, reminderScheduleError } from "../src/lib/workspace-validation";
import type { DocumentFile, Matter, Requirement, State } from "../src/lib/types";

function matter(id: string, status: Matter["status"]): Matter {
  return { id, status, name: "Custom case", matterType: "Divorce", state: "NJ", county: "Essex", templateId: "nj-divorce", createdAt: "2026-04-01", lastClientActivity: null,
    parties: [{ id: "client", role: "CLIENT", firstName: "Jamie", lastName: "Rivera" }, { id: "other", role: "OTHER_PARTY", firstName: "Alex", lastName: "Park" }] };
}

function state(matters: Matter[], requirements: Requirement[] = [], documents: DocumentFile[] = []): State {
  return { firm: { name: "Firm", attorneyName: "Attorney", attorneyEmail: "a@example.com", firstReminderDays: 3, secondReminderDays: 7, attorneyAlertDays: 10 }, matters, requirements, documents, intakes: {}, activity: [], discoveries: [] };
}

function requirement(matterId: string, status: Requirement["status"]): Requirement {
  return { id: "req", matterId, status, section: "tax", title: "Return", description: "", reason: "", source: "TEMPLATE", required: true };
}

function document(matterId: string): DocumentFile {
  return { id: "doc", matterId, requirementIds: ["req"], status: "NEEDS_REVIEW", filename: "tax.pdf", documentType: "Tax", owner: "Client", uploadedAt: "2026-04-01", uploadedBy: "Client", pages: 1 };
}

test("queue counts partition matters and exclude complete from open", () => {
  const cases = [matter("draft", "DRAFT"), matter("invite", "INVITED"), matter("progress", "CLIENT_IN_PROGRESS"), matter("waiting", "WAITING_FOR_CLIENT"), matter("submitted", "CLIENT_SUBMITTED"), matter("review", "ATTORNEY_REVIEW"), matter("done", "COMPLETE")];
  assert.deepEqual(workspaceCounts(state(cases)), { all: 7, open: 6, draft: 1, waiting: 3, review: 2, complete: 1 });
});

test("pending review takes priority over waiting, including unavailable explanations", () => {
  const item = matter("m1", "WAITING_FOR_CLIENT");
  for (const status of ["NEEDS_REVIEW", "UPLOADED", "NOT_AVAILABLE"] as const) {
    assert.equal(matterQueue(state([item], [requirement(item.id, status)]), item), "review");
  }
  assert.equal(matterQueue(state([item], [requirement(item.id, "MISSING")], [document(item.id)]), item), "review");
  assert.equal(matterQueue(state([item], [requirement(item.id, "MISSING")], [{ ...document(item.id), matterId: "another" }]), item), "waiting");
});

test("inactive requirements and their files do not cause active review; complete wins", () => {
  const item = matter("m1", "WAITING_FOR_CLIENT");
  for (const status of ["WAIVED", "NOT_APPLICABLE"] as const) {
    assert.equal(matterQueue(state([item], [requirement(item.id, status)], [document(item.id)]), item), "waiting");
  }
  const done = { ...item, status: "COMPLETE" as const };
  assert.equal(matterQueue(state([done], [requirement(item.id, "NEEDS_REVIEW")], [document(item.id)]), done), "complete");
});

test("search retains custom names, both parties, and county; queue input is bounded", () => {
  const item = matter("m1", "DRAFT");
  for (const query of [" Custom CASE ", "jamie rivera", "alex park", "essex"]) assert.equal(matterMatchesQuery(item, query), true);
  assert.equal(matterMatchesQuery(item, "unrelated"), false);
  assert.equal(parseQueue("review"), "review");
  assert.equal(parseQueue("open"), "open");
  assert.equal(parseQueue("invalid"), "all");
});

test("firm settings require trimmed names and a complete email", () => {
  assert.ok(firmDetailsError("  ", "Attorney", "a@example.com"));
  assert.ok(firmDetailsError("Firm", "  ", "a@example.com"));
  for (const email of ["a@", "@example.com", "a@example", "a b@example.com"]) assert.ok(firmDetailsError("Firm", "Attorney", email));
  assert.equal(firmDetailsError(" Firm ", " Attorney ", " a@example.com "), "");
});

test("reminders require positive safe integers in strictly increasing order", () => {
  for (const schedule of [["", "7", "10"], ["1.5", "7", "10"], ["0", "7", "10"], ["3", "3", "10"], ["3", "10", "7"], ["Infinity", "7", "10"], ["9007199254740992", "7", "10"]]) {
    assert.ok(reminderScheduleError(schedule[0], schedule[1], schedule[2]));
  }
  assert.equal(reminderScheduleError("3", "7", "10"), "");
});
