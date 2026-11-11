import assert from "node:assert/strict";
import test from "node:test";
import { clientMattersForEmail, demoCodeError } from "../src/lib/client-entry";
import type { Matter } from "../src/lib/types";

function matter(id: string, status: Matter["status"] = "INVITED"): Matter {
  return {
    id, status, name: "Synthetic matter", matterType: "Divorce", state: "NJ", county: "Essex", templateId: "demo", createdAt: "2026-11-11", lastClientActivity: null,
    parties: [{ id: `${id}-client`, role: "CLIENT", firstName: "Jamie", lastName: "Rivera", email: " Jamie@example.com " }],
  };
}

test("returning clients match only their invited email after trimming and case normalization", () => {
  const own = matter("own");
  const another = { ...matter("another"), parties: [{ ...own.parties[0], email: "someone@example.com" }] };
  assert.deepEqual(clientMattersForEmail([own, another], " JAMIE@EXAMPLE.COM "), [own]);
  assert.deepEqual(clientMattersForEmail([own], "unknown@example.com"), []);
  assert.deepEqual(clientMattersForEmail([own], "  "), []);
});

test("drafts and opposing parties never become returning-client matches", () => {
  const draft = matter("draft", "DRAFT");
  const other = { ...matter("other"), parties: [{ ...draft.parties[0], role: "OTHER_PARTY" as const }] };
  const missing = { ...matter("missing"), parties: [] };
  const emailMissing = { ...matter("email-missing"), parties: [{ ...draft.parties[0], email: undefined }] };
  assert.deepEqual(clientMattersForEmail([draft, other, missing, emailMissing], "jamie@example.com"), []);
  assert.deepEqual(clientMattersForEmail([emailMissing], ""), []);
});

test("all non-draft invitation lifecycle states remain eligible and multiple own matters are retained", () => {
  const statuses: Matter["status"][] = ["INVITED", "CLIENT_IN_PROGRESS", "CLIENT_SUBMITTED", "ATTORNEY_REVIEW", "WAITING_FOR_CLIENT", "COMPLETE"];
  const matters = statuses.map((status) => matter(status, status));
  assert.deepEqual(clientMattersForEmail(matters, "jamie@example.com"), matters);
});

test("both client entry flows reject incomplete, wrong and expired demo codes", () => {
  for (const code of ["", "12345", "1234567", "abcdef", " 12345"]) assert.match(demoCodeError(code, false), /six-digit/);
  assert.match(demoCodeError("654321", false), /does not match/);
  assert.match(demoCodeError("123456", true), /expired/);
  assert.equal(demoCodeError("123456", false), "");
});
