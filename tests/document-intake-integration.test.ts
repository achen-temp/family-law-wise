import assert from "node:assert/strict";
import test from "node:test";
import { reducer } from "../src/lib/store";
import { initialState } from "../src/lib/seed";
import { clientRequests } from "../src/lib/document-selectors";
import {
  formatFileSize,
  MAX_DOCUMENT_BYTES,
  validateDocumentFile,
} from "../src/lib/document-upload";

const matterId = "matter-john";

test("DESK-15: document selection validates type, size and empty files", () => {
  assert.equal(
    validateDocumentFile(new File([], "empty.pdf", { type: "application/pdf" })),
    "Choose a file that is not empty.",
  );
  assert.equal(
    validateDocumentFile(new File(["x"], "notes.txt", { type: "text/plain" })),
    "Choose a PDF, JPG, or PNG file.",
  );
  assert.equal(
    validateDocumentFile(
      new File([new Uint8Array(MAX_DOCUMENT_BYTES + 1)], "large.pdf", {
        type: "application/pdf",
      }),
    ),
    "Choose a file no larger than 10 MB.",
  );
  assert.equal(
    validateDocumentFile(new File(["image"], "photo.jpg", { type: "image/jpeg" })),
    null,
  );
  assert.equal(
    validateDocumentFile(new File(["pdf"], "statement.pdf", { type: "" })),
    null,
  );
  assert.equal(formatFileSize(1_843_200), "1.8 MB");
});

test("DESK-15: a replacement remains in review and closes the returned request", () => {
  const requirement = initialState.requirements.find(
    (item) => item.matterId === matterId && item.status === "NEEDS_REVIEW",
  )!;
  const original = initialState.documents.find(
    (document) => document.requirementIds.includes(requirement.id) && document.status === "NEEDS_REVIEW",
  )!;
  const rejected = reducer(initialState, {
    type: "REJECT_DOCUMENT",
    documentId: original.id,
    note: "The statement period does not match the request.",
  });
  assert.equal(clientRequests(rejected, matterId).some((item) => item.id === requirement.id), true);

  const replacement = new File(["replacement"], "correct-period.pdf", {
    type: "application/pdf",
  });
  const replaced = reducer(rejected, {
    type: "UPLOAD",
    matterId,
    requirementId: requirement.id,
    filename: replacement.name,
    localFile: replacement,
  });

  assert.equal(replaced.documents[0].status, "NEEDS_REVIEW");
  assert.equal(replaced.documents.find((document) => document.id === original.id)?.status, "REJECTED");
  assert.equal(replaced.requirements.find((item) => item.id === requirement.id)?.status, "NEEDS_REVIEW");
  assert.equal(clientRequests(replaced, matterId).some((item) => item.id === requirement.id), false);
});

test("M1-04/M2-01: uploading a local file preserves an unfinished questionnaire draft", () => {
  const intake = structuredClone(initialState.intakes[matterId]);
  intake.bank.accounts[0].institution = "";
  const draft = reducer(initialState, { type: "SAVE_INTAKE_DRAFT", matterId, intake, section: "bank" });
  const requirement = initialState.requirements.find((item) => item.matterId === matterId && item.title === "Pay stub #3")!;
  const localFile = new File(["demo image"], "pay-stub.png", { type: "image/png" });
  const uploaded = reducer(draft, { type: "UPLOAD", matterId, requirementId: requirement.id, filename: localFile.name, localFile });

  assert.equal(uploaded.intakeDrafts, draft.intakeDrafts);
  assert.equal(uploaded.intakeDirtySections, draft.intakeDirtySections);
  assert.equal(uploaded.intakes[matterId].completed.includes("bank"), false);
  assert.equal(uploaded.documents[0].localFile, localFile);
  assert.equal(uploaded.documents[0].status, "NEEDS_REVIEW");
  assert.equal(uploaded.submissionReceipt?.documentId, uploaded.documents[0].id);
  const dismissed = reducer(uploaded, { type: "DISMISS_SUBMISSION_RECEIPT" });
  assert.equal(dismissed.submissionReceipt, undefined);
  assert.equal(dismissed.documents, uploaded.documents);
  assert.equal(dismissed.intakeDrafts, draft.intakeDrafts);
});

test("M1-05/M2-02: renaming an account preserves its requirement ID and local document", () => {
  const requirement = initialState.requirements.find((item) => item.matterId === matterId && item.section === "bank" && item.status === "MISSING")!;
  const localFile = new File(["demo"], "bank.pdf", { type: "application/pdf" });
  const uploaded = reducer(initialState, { type: "UPLOAD", matterId, requirementId: requirement.id, filename: localFile.name, localFile });
  const intake = structuredClone(uploaded.intakes[matterId]);
  intake.bank.accounts[0].institution = "Renamed Chase";
  const renamed = reducer(uploaded, { type: "SAVE_INTAKE", matterId, intake, completedSection: "bank" });

  const updated = renamed.requirements.find((item) => item.id === requirement.id)!;
  assert.match(updated.groupLabel!, /Renamed Chase/);
  assert.equal(updated.status, "NEEDS_REVIEW");
  assert.equal(renamed.documents, uploaded.documents);
  assert.equal(renamed.documents[0].localFile, localFile);
  assert.deepEqual(renamed.documents[0].requirementIds, [requirement.id]);
});

test("M1-05/M2-03: retiring and restoring an account keeps the local file and intervening rejection", () => {
  const requirement = initialState.requirements.find((item) => item.matterId === matterId && item.section === "bank" && item.status === "MISSING")!;
  const localFile = new File(["demo"], "bank.pdf", { type: "application/pdf" });
  const uploaded = reducer(initialState, { type: "UPLOAD", matterId, requirementId: requirement.id, filename: localFile.name, localFile });
  const original = uploaded.intakes[matterId];
  const intake = structuredClone(original);
  intake.bank.hasAccounts = false;
  const retired = reducer(uploaded, { type: "SAVE_INTAKE", matterId, intake, completedSection: "bank" });
  assert.equal(retired.requirements.find((item) => item.id === requirement.id)?.status, "NOT_APPLICABLE");
  assert.equal(retired.documents[0].localFile, localFile);

  const rejected = reducer(retired, { type: "REJECT_DOCUMENT", documentId: uploaded.documents[0].id, note: "Please provide all pages." });
  assert.equal(rejected.requirements.find((item) => item.id === requirement.id)?.status, "NOT_APPLICABLE");
  assert.equal(clientRequests(rejected, matterId).some((item) => item.id === requirement.id), false);
  const restored = reducer(rejected, { type: "SAVE_INTAKE", matterId, intake: original, completedSection: "bank" });
  assert.equal(restored.requirements.find((item) => item.id === requirement.id)?.status, "MISSING");
  assert.equal(restored.documents[0].status, "REJECTED");
  assert.equal(restored.documents[0].localFile, localFile);
  assert.equal(clientRequests(restored, matterId).some((item) => item.id === requirement.id), true);
});
