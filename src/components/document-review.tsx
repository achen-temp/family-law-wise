"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { FileText } from "lucide-react";
import { Button, PageHeader, StatusPill } from "@/components/ui";
import { REQUIREMENT_LABEL, formatDate, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { DocumentStatus } from "@/lib/types";
import { LocalFilePreview } from "@/components/local-file-preview";

export function DocumentReview({ matterId, documentId }: { matterId: string; documentId: string }) {
  const store = useStore();
  const matter = store.state.matters.find((item) => item.id === matterId);
  const document = store.state.documents.find((item) => item.id === documentId && item.matterId === matterId);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [activeDocumentId, setActiveDocumentId] = useState(documentId);
  if (activeDocumentId !== documentId) {
    setActiveDocumentId(documentId);
    setRejecting(false);
    setNote("");
    setError("");
  }
  const workspaceRef = useRef<HTMLDivElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const reasonId = useId();

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    // Document-space position keeps page scrolling from changing the pane height.
    const sizeWorkspace = () => {
      const top = workspace.getBoundingClientRect().top + window.scrollY;
      workspace.style.setProperty("--review-height", `${Math.max(208, window.innerHeight - top - 24)}px`);
    };
    sizeWorkspace();
    const observer = new ResizeObserver(sizeWorkspace);
    observer.observe(workspace.parentElement!);
    window.addEventListener("resize", sizeWorkspace);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", sizeWorkspace);
    };
  }, [matterId, documentId]);

  if (!matter || !document) {
    return <p className="text-sm text-muted">Document not found.</p>;
  }

  const linked = store.state.requirements.filter((item) => document.requirementIds.includes(item.id));
  const otherSubmissions = store.state.documents.filter((other) => other.matterId === matterId && other.id !== document.id && other.requirementIds.some((id) => document.requirementIds.includes(id)));

  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <PageHeader
        eyebrow={matterTitle(matter)}
        title={document.documentType}
        description={document.filename}
        actions={
          <>
            <DocumentStatusPill status={document.status} />
            <Link href={`/matters/${matterId}/documents`} className="btn btn-secondary">
              All documents
            </Link>
          </>
        }
      />
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-xs">
        <Link href="/documents" className="text-muted underline underline-offset-4 hover:text-brand">Global review queue</Link>
        <Link href={`/portal/${matterId}/documents/${document.id}`} className="text-muted underline underline-offset-4 hover:text-brand">Demo: view file as client</Link>
      </div>
      <div ref={workspaceRef} className="grid min-w-0 gap-5 lg:h-[var(--review-height,calc(100dvh-220px))] lg:min-h-52 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-label="Original document preview" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex min-h-11 shrink-0 items-center gap-3 border-b border-line px-4 py-2 text-xs">
            <FileText aria-hidden="true" className="size-4 shrink-0 text-muted" />
            <span className="min-w-0 flex-1 font-medium">{document.filename}</span>
            <span className="shrink-0 text-muted">{document.pages > 0 ? `${document.pages} ${document.pages === 1 ? "page" : "pages"}` : "Local file"}</span>
          </div>
          {document.localFile ? (
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#E7EAE3]" tabIndex={0} aria-label="Scroll original document">
              <LocalFilePreview file={document.localFile} />
            </div>
          ) : (
            <>
              <p className="shrink-0 bg-[#E7EAE3] px-6 pt-4 text-xs leading-[18px] text-text-secondary">Demo sample preview — figures below are illustrative, not extracted from an uploaded file.</p>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#E7EAE3] p-6 pt-4" tabIndex={0} aria-label="Scroll sample document">
                <DocumentCanvas
                  type={document.documentType}
                  institution={document.institution}
                  owner={document.owner}
                  period={document.periodLabel}
                  filename={document.filename}
                  pages={document.pages}
                />
              </div>
            </>
          )}
        </section>
        <aside aria-label="Review details" className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-line bg-surface">
          <div className="flex min-h-12 shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="text-base font-semibold">Review details</h2>
            <DocumentStatusPill status={document.status} />
          </div>
          <div className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain" tabIndex={0} aria-label="Scroll review information">
            <section className="p-4">
              <h3 className="text-sm font-semibold">Linked requirements</h3>
              {linked.length ? (
                <ul className="mt-3 space-y-4">
                  {linked.map((item) => (
                    <li key={item.id} className="text-sm">
                      <p className="mb-1.5">{item.title}</p>
                      {item.periodLabel ? <p className="mb-1.5 text-xs text-muted">{item.periodLabel}</p> : null}
                      <StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-2 text-xs text-muted">No linked requirements remain for this file.</p>}
            </section>
            <section className="p-4">
              <h3 className="text-sm font-semibold">Document information</h3>
              <dl className="mt-3 space-y-3 text-sm">
                <Row label="Type" value={document.documentType} />
                <Row label="Owner" value={document.owner} />
                <Row label="Institution" value={document.institution || "—"} />
                <Row label="Account" value={document.accountLastFour ? `****${document.accountLastFour}` : "—"} />
                <Row label="Period" value={document.periodLabel || "—"} />
                <Row label="Uploaded" value={`${formatDate(document.uploadedAt)} · ${document.uploadedBy}`} />
                {document.reviewedBy ? <Row label="Reviewed by" value={document.reviewedBy} /> : null}
              </dl>
            </section>
            <section className="p-4">
              <h3 className="text-sm font-semibold">Other submissions</h3>
              <p className="mt-1 text-xs leading-[18px] text-muted">Other files linked to the same requirements and their review decisions.</p>
              {otherSubmissions.length ? (
                <ul className="mt-3 space-y-4">
                  {otherSubmissions.map((other) => (
                    <li key={other.id} className="text-xs">
                      <Link href={`/matters/${matterId}/documents/${other.id}`} className="block text-sm font-medium text-brand underline underline-offset-4">{other.filename}</Link>
                      <p className="my-1.5 text-muted">{formatDate(other.uploadedAt)}</p>
                      <DocumentStatusPill status={other.status} />
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-xs text-muted">No other submissions.</p>}
            </section>
          </div>
          <div className="max-h-[65%] shrink-0 overflow-y-auto border-t border-line bg-surface p-4">
            {document.status === "NEEDS_REVIEW" ? (
              rejecting ? (
                <form noValidate onSubmit={(event) => {
                  event.preventDefault();
                  if (!note.trim()) {
                    setError("Enter a reason so the client knows what to provide.");
                    reasonRef.current?.focus();
                    return;
                  }
                  setError("");
                  store.rejectDocument(document.id, note.trim());
                }}>
                  <label htmlFor={reasonId} className="mb-2 block text-sm font-medium">Reason for rejection <span className="text-xs text-muted">(required)</span></label>
                  <textarea
                    ref={reasonRef}
                    id={reasonId}
                    autoFocus
                    required
                    className="field min-h-20"
                    placeholder="What should the client send instead?"
                    value={note}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? `${reasonId}-error` : undefined}
                    onChange={(event) => { setNote(event.target.value); setError(""); }}
                  />
                  {error ? <p id={`${reasonId}-error`} role="alert" className="mt-2 text-xs text-error-text">{error}</p> : null}
                  <div className="mt-3 flex gap-2">
                    <Button type="button" onClick={() => {
                      setRejecting(false);
                      setNote("");
                      setError("");
                      requestAnimationFrame(() => rejectButtonRef.current?.focus());
                    }}>Cancel</Button>
                    <Button type="submit" variant="danger" className="flex-1 bg-error-text text-white hover:bg-[color-mix(in_srgb,var(--error-text),black_12%)]">Confirm rejection</Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex gap-2">
                    <button ref={rejectButtonRef} type="button" className="btn btn-danger flex-1" onClick={() => setRejecting(true)}>Reject</button>
                    <Button variant="primary" className="flex-1" onClick={() => store.acceptDocument(document.id)}>Accept</Button>
                  </div>
                </>
              )
            ) : (
              <div role="status" className="space-y-2 text-sm" tabIndex={0}>
                <p className="font-medium">{document.status === "ACCEPTED" ? "File accepted." : document.status === "REJECTED" ? "Returned for correction." : "This file has been replaced."}</p>
                {document.rejectNote ? <p className="whitespace-pre-wrap text-error-text">{document.rejectNote}</p> : null}
                {document.reviewedAt ? <p className="text-xs text-muted">Reviewed {formatDate(document.reviewedAt)}{document.reviewedBy ? ` by ${document.reviewedBy}` : ""}.</p> : null}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function DocumentStatusPill({ status }: { status: DocumentStatus }) {
  if (status === "NEEDS_REVIEW") return <StatusPill status="NEEDS_REVIEW" label="Needs review" />;
  if (status === "ACCEPTED") return <StatusPill status="ACCEPTED" label="Accepted" />;
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${status === "REJECTED" ? "bg-error-bg text-error-text" : "bg-neutral-bg text-neutral-text"}`}>{status === "REJECTED" ? "Returned" : "Replaced"}</span>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3">
      <dt className="text-xs leading-[21px] text-muted">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

function DocumentCanvas({
  type,
  institution,
  owner,
  period,
  filename,
  pages,
}: {
  type: string;
  institution?: string;
  owner: string;
  period?: string;
  filename: string;
  pages: number;
}) {
  return (
    <article className="mx-auto min-h-[640px] max-w-[560px] bg-surface p-6 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted">{type}</p>
          <h2 className="mt-1 text-lg font-semibold text-text-primary">{institution || type}</h2>
          <p className="mt-1 text-sm text-text-secondary">{owner}</p>
        </div>
        <p className="text-xs text-muted">{period || "2025–2026"}</p>
      </header>
      <table className="mt-6 w-full text-left text-sm text-text-primary">
        <tbody>
          {previewRows(type).map((row) => (
            <tr key={row[0]} className="border-b border-line">
              <td className="py-2 text-muted">{row[0]}</td>
              <td className="py-2 text-right font-medium">{row[1]}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-8 text-xs leading-[18px] text-muted">
        Demo preview of {filename}. Page 1 of {pages}. These figures are illustrative. Accepting this file does not confirm figures on the financial profile.
      </p>
    </article>
  );
}

function previewRows(type: string): [string, string][] {
  if (type === "Bank statement") {
    return [
      ["Beginning balance", "$40,120.18"],
      ["Deposits", "$8,640.00"],
      ["Withdrawals", "$6,369.44"],
      ["Ending balance", "$42,390.74"],
    ];
  }
  if (type === "W-2" || type === "Pay stub") {
    return [
      ["Employer", "Amazon"],
      ["Wages", "$185,000"],
      ["Federal tax withheld", "$38,420"],
      ["Bonus", "$30,000"],
    ];
  }
  if (type === "Tax return") {
    return [
      ["Filing status", "Married filing jointly"],
      ["Wages", "$185,000"],
      ["Interest", "$1,240"],
      ["Schedule B payer", "Fidelity Investments"],
    ];
  }
  return [
    ["Account holder", "Client"],
    ["Statement date", "March 2026"],
    ["Reported value", "See profile"],
    ["Pages", "Complete copy"],
  ];
}
