import assert from "node:assert/strict";
import test from "node:test";
import {
  documentSearchText,
  documentSourceLabel,
  documentVersions,
  linkedRequirementContext,
} from "../src/lib/document-view";
import type { DocumentFile, Matter, Requirement } from "../src/lib/types";

const matter: Matter = {
  id: "matter-1",
  name: "Smith divorce",
  matterType: "Divorce",
  state: "NJ",
  county: "Essex",
  templateId: "template-1",
  status: "ATTORNEY_REVIEW",
  createdAt: "2026-01-01T00:00:00.000Z",
  lastClientActivity: null,
  parties: [
    { id: "party-1", role: "CLIENT", firstName: "John", lastName: "Smith" },
    { id: "party-2", role: "OTHER_PARTY", firstName: "Jane", lastName: "Smith" },
  ],
};

const requirement: Requirement = {
  id: "req-bank",
  matterId: matter.id,
  section: "bank",
  title: "January bank statement",
  description: "Monthly statement",
  reason: "Financial disclosure",
  source: "QUESTIONNAIRE",
  status: "NEEDS_REVIEW",
  required: true,
  groupLabel: "Chase checking",
};

function document(overrides: Partial<DocumentFile> = {}): DocumentFile {
  return {
    id: "doc-1",
    matterId: matter.id,
    requirementIds: [requirement.id],
    filename: "chase-january.pdf",
    documentType: "Bank statement",
    owner: "John Smith",
    institution: "Chase",
    uploadedAt: "2026-10-06T15:00:00.000Z",
    uploadedBy: "John Smith",
    status: "NEEDS_REVIEW",
    pages: 2,
    ...overrides,
  };
}

test("document source distinguishes browser uploads from demo samples", () => {
  assert.equal(documentSourceLabel(document()), "Demo sample");
  assert.equal(documentSourceLabel(document({ localFile: new File(["sample"], "sample.pdf") })), "Local upload");
});

test("linked requirement context keeps labels and provides a stable removed-request fallback", () => {
  assert.deepEqual(linkedRequirementContext(document(), [requirement]), {
    labels: ["Chase checking · January bank statement"],
    summary: "Chase checking · January bank statement",
    removed: false,
  });
  assert.deepEqual(linkedRequirementContext(document(), []), {
    labels: [],
    summary: "Removed checklist request",
    removed: true,
  });
});

test("document search includes file, matter, people, source and requirement context", () => {
  const searchable = documentSearchText(document(), matter, [requirement]);
  for (const term of ["chase-january.pdf", "smith divorce", "john smith", "jane smith", "demo sample", "january bank statement"]) {
    assert.match(searchable, new RegExp(term, "i"));
  }
});

test("document versions group overlapping requests newest-first without merging unrelated files", () => {
  const newest = document({ id: "new", uploadedAt: "2026-10-08T15:00:00.000Z" });
  const older = document({ id: "old", uploadedAt: "2026-10-01T15:00:00.000Z", status: "REPLACED" });
  const unrelated = document({ id: "other", requirementIds: ["req-tax"], uploadedAt: "2026-10-09T15:00:00.000Z" });
  const versions = documentVersions([older, unrelated, newest]);

  assert.deepEqual(versions.get("new"), { position: 1, total: 2, current: true });
  assert.deepEqual(versions.get("old"), { position: 2, total: 2, current: false });
  assert.deepEqual(versions.get("other"), { position: 1, total: 1, current: true });
});
