"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button, Choice, PageHeader } from "@/components/ui";
import { REQUIREMENT_LABEL, currentDocuments } from "@/lib/format";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/ui";
import { LocalFilePreview } from "@/components/local-file-preview";
import { latestDocument } from "@/lib/document-selectors";

const REASONS = [
  "I do not have access",
  "Account is closed",
  "I requested it and am waiting",
  "This does not apply to me",
  "Other",
];

export function PortalUpload({ token, itemId }: { token: string; itemId: string }) {
  const router = useRouter();
  const store = useStore();
  const item = store.state.requirements.find((requirement) => requirement.id === itemId && requirement.matterId === token);
  const [unavailable, setUnavailable] = useState(false);
  const [reason, setReason] = useState(item?.unavailableReason ?? REASONS[0]);
  const [note, setNote] = useState(item?.unavailableNote ?? "");
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState("");
  const [previewFailed, setPreviewFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selection, setSelection] = useState<{
    filename: string;
    size?: number;
    documentId?: string;
    sample?: boolean;
    file?: File;
  } | null>(null);

  function clearPreview() {
    setFileError("");
    setPreviewFailed(false);
  }

  function cancelSelection() {
    clearPreview();
    setSelection(null);
    if (fileInput.current) fileInput.current.value = "";
  }

  if (!item) return <p className="text-sm text-muted">This request is not on your checklist.</p>;

  const current = currentDocuments(store.state.documents, item.id)[0];
  const latest = latestDocument(store.state.documents, item.id);
  const others = store.state.documents.filter(
    (doc) => doc.matterId === token && doc.status !== "REJECTED" && doc.status !== "REPLACED" && doc.id !== current?.id,
  );

  function attach(filename: string) {
    store.uploadToRequirement(token, item!.id, filename, selection?.file);
    router.push(`/portal/${token}/checklist`);
  }

  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <PageHeader
        eyebrow="Checklist"
        title={item.groupLabel ? `${item.groupLabel}` : item.title}
        description={item.groupLabel ? item.title : item.description}
        actions={<StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />}
      />
      <p className="mb-4 text-sm leading-relaxed text-muted">{item.reason}</p>
      {item.unavailableNote ? <div className="card mb-4 p-4 text-sm"><p className="font-medium">Your submitted explanation</p><p className="mt-2">{item.unavailableReason}: {item.unavailableNote}</p><p className="mt-2 text-muted">Current requirement status: {REQUIREMENT_LABEL[item.status]}. An explanation does not mean the document has been accepted.</p></div> : null}
      {latest?.status === "REJECTED" ? <div className="card mb-4 p-4 text-sm text-rose-800"><p>Returned file: {latest.filename}</p><p>{latest.rejectNote}</p><Link href={`/portal/${token}/documents/${latest.id}`} className="text-brand underline">View review details</Link><p className="mt-2">Select a corrected file below and confirm submission.</p></div> : null}
      {current ? (
        <p className="mb-4 rounded-lg border border-line bg-white px-3 py-2 text-sm [overflow-wrap:anywhere]">
          Current file: {current.filename}
        </p>
      ) : null}
      {current?.localFile ? <div className="mb-4"><LocalFilePreview file={current.localFile} /></div> : null}
      {current ? (
        <Link href={`/portal/${token}/documents/${current.id}`} className="mb-4 inline-block text-sm text-brand underline">View submitted file details and history</Link>
      ) : null}
      {current ? (
        <Link href={`/matters/${token}/documents/${current.id}`} className="mb-4 inline-block text-sm text-brand underline underline-offset-4">
          Demo: view this file as attorney
        </Link>
      ) : null}
      <div className="card min-w-0 border-dashed p-4 text-center sm:p-8">
        <p className="text-sm font-medium">Choose a PDF, JPG, or PNG</p>
        <p className="mt-1 text-xs text-muted">Select a file, then confirm submission. Demo only: submitted files remain available in this application session and reset on refresh.</p>
        <input
          ref={fileInput}
          type="file"
          aria-label="Choose a document"
          accept="application/pdf,image/png,image/jpeg"
          className="mt-4 block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-lg file:border file:border-solid file:border-brand file:bg-brand-soft file:px-4 file:py-2 file:font-semibold file:text-brand file:underline file:underline-offset-4 hover:file:bg-blue-100"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            clearPreview();
            setSelection(null);
            const type = file.type || ({ pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }[file.name.split(".").pop()?.toLowerCase() ?? ""]);
            if (!type || !["application/pdf", "image/jpeg", "image/png"].includes(type) || file.size === 0) {
              setFileError("Choose a non-empty PDF, JPG, or PNG file.");
              event.target.value = "";
              return;
            }
            setSelection({ filename: file.name, size: file.size, file });
          }}
        />
        {fileError ? <p className="mt-3 text-sm text-rose-800" role="alert">{fileError}</p> : null}
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => {
            clearPreview();
            if (fileInput.current) fileInput.current.value = "";
            setSelection({ filename: `${item.title.replace(/\s+/g, "-")}.pdf`, sample: true });
          }}
        >
          Select sample PDF
        </button>
        {selection ? (
          <div className="mt-4 rounded-lg border border-line p-4 text-left">
            <p className="text-sm font-medium break-words [overflow-wrap:anywhere]">Selected: {selection.filename}</p>
            <p className="mt-1 text-xs text-muted">
              {selection.sample ? "Demo sample. " : selection.documentId ? "Previously submitted file. " : `${Math.ceil((selection.size ?? 0) / 1024)} KB. `}
              Not submitted to this requirement yet. Choose another file to change your selection.
            </p>
            {selection.file ? (
              <div className="mt-4"><LocalFilePreview file={selection.file} onChooseAnother={() => fileInput.current?.click()} onPreviewError={setPreviewFailed} /></div>
            ) : selection.documentId && store.state.documents.find((doc) => doc.id === selection.documentId)?.localFile ? (
              <div className="mt-3"><LocalFilePreview file={store.state.documents.find((doc) => doc.id === selection.documentId)!.localFile!} /></div>
            ) : (
              <p className="mt-3 text-sm text-muted">{selection.sample ? "This sample is a demo filename only; no PDF contents are available to preview." : "File contents are not stored in this demo, so a preview is unavailable for this previously submitted file."}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button onClick={cancelSelection}>Cancel selection</Button>
              <Button variant="primary" disabled={submitting || previewFailed} onClick={() => {
                if (submitting || previewFailed) return;
                setSubmitting(true);
                if (selection.documentId) {
                  store.linkExistingDocument(item.id, selection.documentId);
                  router.push(`/portal/${token}/checklist`);
                } else {
                  attach(selection.filename);
                }
              }}>
                Confirm submission
              </Button>
            </div>
          </div>
        ) : null}
      </div>

      {others.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Or use a file you already uploaded</p>
          <ul className="card divide-y divide-line">
            {others.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  className="flex w-full min-w-0 flex-col items-start justify-between gap-2 px-4 py-3 text-left text-sm hover:bg-[#f4f7fd] sm:flex-row sm:items-center"
                  onClick={() => {
                    clearPreview();
                    if (fileInput.current) fileInput.current.value = "";
                    setSelection({ filename: doc.filename, documentId: doc.id });
                  }}
                >
                  <span className="min-w-0 [overflow-wrap:anywhere]">{doc.filename}</span>
                  <span className="text-xs text-muted">{doc.documentType}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-6">
        <button type="button" className="text-sm font-medium text-brand" onClick={() => setUnavailable((value) => !value)}>
          {unavailable ? "Hide" : "Can’t get this document?"}
        </button>
        {unavailable ? (
          <div className="card mt-3 space-y-3 p-4">
            <div className="grid gap-2">
              {REASONS.map((option) => (
                <Choice key={option} checked={reason === option} onClick={() => setReason(option)}>
                  {option}
                </Choice>
              ))}
            </div>
            <textarea className="field min-h-20" placeholder="Add a short note for your attorney" value={note} onChange={(event) => setNote(event.target.value)} />
            {error ? <p className="text-sm text-rose-800">{error}</p> : null}
            <Button
              variant="primary"
              onClick={() => {
                if (!note.trim()) {
                  setError("Add a short note so your attorney can review it.");
                  return;
                }
                store.markUnavailable(item.id, reason, note.trim());
                router.push(`/portal/${token}/checklist`);
              }}
            >
              Submit explanation
            </Button>
          </div>
        ) : null}
      </div>
      <Link href={`/portal/${token}/checklist`} className="mt-6 inline-block text-sm text-muted hover:text-foreground">
        Back to checklist
      </Link>
    </div>
  );
}
