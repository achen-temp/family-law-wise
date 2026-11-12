"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AlertTriangle, FileText, RefreshCw, Upload } from "lucide-react";
import { LocalFilePreview } from "@/components/local-file-preview";
import { Button, Choice, PageHeader, StatusPill } from "@/components/ui";
import { latestDocument } from "@/lib/document-selectors";
import { DOCUMENT_ACCEPT, formatFileSize, validateDocumentFile } from "@/lib/document-upload";
import { currentDocuments, REQUIREMENT_LABEL } from "@/lib/format";
import { useStore } from "@/lib/store";

const REASONS = [
  "I do not have access",
  "Account is closed",
  "I requested it and am waiting",
  "This does not apply to me",
  "Other",
];

type Selection = {
  filename: string;
  size?: number;
  documentId?: string;
  sample?: boolean;
  file?: File;
};

export function PortalUpload({ token, itemId }: { token: string; itemId: string }) {
  const router = useRouter();
  const store = useStore();
  const item = store.state.requirements.find(
    (requirement) => requirement.id === itemId && requirement.matterId === token,
  );
  const [unavailable, setUnavailable] = useState(false);
  const [reuseOpen, setReuseOpen] = useState(false);
  const [reason, setReason] = useState(item?.unavailableReason ?? REASONS[0]);
  const [note, setNote] = useState(item?.unavailableNote ?? "");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);

  function clearPreview() {
    setFileError("");
    setPreviewFailed(false);
  }

  function cancelSelection() {
    clearPreview();
    setSubmitting(false);
    setSelection(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  if (!item) return <p className="text-sm text-muted">This request is not on your checklist.</p>;

  const current = currentDocuments(store.state.documents, item.id)[0];
  const latest = latestDocument(store.state.documents, item.id);
  const returned = latest?.status === "REJECTED" ? latest : null;
  const others = store.state.documents.filter(
    (doc) =>
      doc.matterId === token &&
      doc.status !== "REJECTED" &&
      doc.status !== "REPLACED" &&
      doc.id !== current?.id,
  );

  function submitSelection() {
    if (!selection || submitting || previewFailed) return;
    setSubmitting(true);
    if (selection.documentId) store.linkExistingDocument(item!.id, selection.documentId);
    else store.uploadToRequirement(token, item!.id, selection.filename, selection.file);
    router.push(`/portal/${token}/checklist`);
  }

  function chooseFile(file?: File) {
    if (!file) return;
    clearPreview();
    setSelection(null);
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setFileError(validationError);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setSelection({ filename: file.name, size: file.size, file });
  }

  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <PageHeader eyebrow="Checklist" title={item.groupLabel || item.title} description={item.groupLabel ? item.title : item.description} />

      <div className="grid max-w-[920px] items-start gap-6 lg:grid-cols-[minmax(0,600px)_296px]">
        <section className="card min-w-0 overflow-hidden" aria-labelledby="submission-heading">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="submission-heading" className="font-semibold">Submit a file</h2>
              <p className="mt-1 text-xs text-muted">Review your selection before sending it to your attorney.</p>
            </div>
            <span className="text-xs font-medium text-muted">Not submitted until confirmed</span>
          </div>

          <div className="p-5">
            <input
              ref={fileInput}
              type="file"
              aria-label="Choose a document"
              aria-describedby={fileError ? "document-file-error" : undefined}
              accept={DOCUMENT_ACCEPT}
              className="sr-only"
              onChange={(event) => chooseFile(event.target.files?.[0])}
            />
            {!selection ? (
              <div className="rounded-lg border border-dashed border-border-strong bg-surface-subtle p-6 text-center sm:p-8">
                <span className="mx-auto grid size-11 place-items-center rounded-full bg-brand-soft text-brand"><Upload className="size-5" aria-hidden="true" /></span>
                <p className="mt-3 text-sm font-medium">Choose a PDF, JPG, or PNG</p>
                <p className="mt-1 text-xs text-muted">Maximum 10 MB. You can preview the file before submitting.</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <Button variant="primary" onClick={() => fileInput.current?.click()}>Choose file</Button>
                  <Button onClick={() => {
                  clearPreview();
                  if (fileInput.current) fileInput.current.value = "";
                  setSelection({ filename: `${item.title.replace(/\s+/g, "-")}.pdf`, sample: true });
                  }}>Select sample PDF</Button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex min-w-0 flex-col gap-3 rounded-lg bg-brand-soft p-4 sm:flex-row sm:items-center">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white text-brand"><FileText className="size-5" aria-hidden="true" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-sm font-semibold">{selection.filename}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {selection.sample ? "Demo sample · no stored preview" : selection.documentId ? "Previously submitted file" : formatFileSize(selection.size ?? 0)}
                    </p>
                  </div>
                  <button type="button" className="text-left text-sm font-medium text-brand underline underline-offset-4" onClick={() => fileInput.current?.click()}>Choose another</button>
                </div>

                {selection.file ? (
                  <div className="mt-4"><LocalFilePreview file={selection.file} onChooseAnother={() => fileInput.current?.click()} onPreviewError={setPreviewFailed} /></div>
                ) : selection.documentId && store.state.documents.find((doc) => doc.id === selection.documentId)?.localFile ? (
                  <div className="mt-4"><LocalFilePreview file={store.state.documents.find((doc) => doc.id === selection.documentId)!.localFile!} /></div>
                ) : (
                  <div className="mt-4 rounded-lg border border-line bg-surface-subtle p-4 text-sm text-muted">
                    {selection.sample ? "This sample demonstrates the confirmation flow; no PDF contents are available to preview." : "This demo remembers the prior filename but not its file contents, so a preview is unavailable."}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-line pt-4">
                  <Button onClick={cancelSelection}>Cancel</Button>
                  <Button variant="primary" disabled={submitting || previewFailed} onClick={submitSelection}>
                    {submitting ? "Submitting…" : returned ? "Submit replacement for review" : "Submit for review"}
                  </Button>
                </div>
              </div>
            )}
            {fileError ? <p id="document-file-error" className="mt-3 text-sm text-error-text" role="alert">{fileError}</p> : null}
          </div>
        </section>

        <aside className="card min-w-0 p-5 lg:sticky lg:top-6" aria-labelledby="requirement-summary-heading">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-brand">Requirement</p>
          <h2 id="requirement-summary-heading" className="mt-1 font-semibold">What your attorney needs</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.reason}</p>
          {item.periodLabel ? <p className="mt-2 text-sm"><span className="text-muted">Period:</span> {item.periodLabel}</p> : null}
          <div className="my-4 border-t border-line" />
          <p className="text-xs font-medium text-muted">Current status</p>
          <div className="mt-2"><StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} /></div>

          {returned ? (
            <div className="mt-4 rounded-lg bg-error-bg p-3 text-sm text-error-text">
              <div className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><div>
                <p className="font-semibold">Replacement requested</p>
                <p className="mt-1 break-words">{returned.filename}</p>
                <p className="mt-1">{returned.rejectNote || "Your attorney asked for a corrected copy."}</p>
                <Link href={`/portal/${token}/documents/${returned.id}`} className="mt-2 inline-block font-medium underline underline-offset-4">View review details</Link>
              </div></div>
              <p className="mt-3 border-t border-current/20 pt-3">A replacement remains Needs review until your attorney accepts it.</p>
            </div>
          ) : null}

          {current ? (
            <div className="mt-4 text-sm">
              <p className="font-medium">Current file</p><p className="mt-1 break-words text-muted">{current.filename}</p>
              <Link href={`/portal/${token}/documents/${current.id}`} className="mt-2 inline-block text-brand underline underline-offset-4">View file details and history</Link>
              <Link href={`/matters/${token}/documents/${current.id}`} className="mt-2 block text-brand underline underline-offset-4">Demo: view as attorney</Link>
            </div>
          ) : null}

          {item.unavailableNote ? <div className="mt-4 rounded-lg bg-neutral-bg p-3 text-sm"><p className="font-medium">Submitted explanation</p><p className="mt-1 text-muted">{item.unavailableReason}: {item.unavailableNote}</p></div> : null}

          <div className="mt-5 space-y-2 border-t border-line pt-4">
            <button type="button" className="flex min-h-9 w-full items-center gap-2 text-left text-sm font-medium text-brand" onClick={() => setReuseOpen((value) => !value)}>
              <RefreshCw className="size-4" aria-hidden="true" />{reuseOpen ? "Hide uploaded files" : "Use an existing file"}
            </button>
            <button type="button" className="min-h-9 w-full text-left text-sm font-medium text-brand" onClick={() => setUnavailable((value) => !value)}>{unavailable ? "Hide explanation form" : "Can’t get this document?"}</button>
          </div>
        </aside>
      </div>

      {reuseOpen ? (
        <section className="card mt-6 max-w-[600px] overflow-hidden" aria-labelledby="existing-files-heading">
          <div className="border-b border-line px-5 py-4"><h2 id="existing-files-heading" className="font-semibold">Use a file you already uploaded</h2><p className="mt-1 text-xs text-muted">Selecting a file here does not link it until you confirm above.</p></div>
          {others.length ? <ul className="divide-y divide-line">{others.map((doc) => <li key={doc.id}><button type="button" className="flex w-full min-w-0 flex-col items-start justify-between gap-2 px-5 py-3 text-left text-sm hover:bg-surface-subtle sm:flex-row sm:items-center" onClick={() => {
            clearPreview();
            if (fileInput.current) fileInput.current.value = "";
            setSelection({ filename: doc.filename, documentId: doc.id });
            setReuseOpen(false);
          }}><span className="min-w-0 break-words font-medium">{doc.filename}</span><span className="text-xs text-muted">{doc.documentType}</span></button></li>)}</ul> : <p className="px-5 py-4 text-sm text-muted">No reusable files are available for this matter.</p>}
        </section>
      ) : null}

      {unavailable ? (
        <section className="card mt-6 max-w-[600px] space-y-4 p-5" aria-labelledby="unavailable-heading">
          <div><h2 id="unavailable-heading" className="font-semibold">Explain why this document is unavailable</h2><p className="mt-1 text-xs text-muted">Your attorney will review the explanation. It does not mark the requirement accepted.</p></div>
          <div className="grid gap-2">{REASONS.map((option) => <Choice key={option} checked={reason === option} onClick={() => setReason(option)}>{option}</Choice>)}</div>
          <label className="block"><span className="mb-1.5 block text-sm font-medium">Note for your attorney</span><textarea className="field min-h-24" placeholder="Explain what you tried and what is preventing you from getting the document" value={note} onChange={(event) => { setNote(event.target.value); setError(""); }} aria-describedby={error ? "unavailable-error" : undefined} /></label>
          {error ? <p id="unavailable-error" className="text-sm text-error-text" role="alert">{error}</p> : null}
          <div className="flex flex-wrap justify-end gap-2"><Button onClick={() => setUnavailable(false)}>Cancel</Button><Button variant="primary" onClick={() => {
            if (!note.trim()) { setError("Add a short note so your attorney can review it."); return; }
            store.markUnavailable(item.id, reason, note.trim());
            router.push(`/portal/${token}/checklist`);
          }}>Submit explanation</Button></div>
        </section>
      ) : null}

      <Link href={`/portal/${token}/checklist`} className="mt-6 inline-block text-sm text-muted hover:text-foreground">Back to checklist</Link>
    </div>
  );
}
