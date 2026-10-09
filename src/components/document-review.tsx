"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, PageHeader, StatusPill } from "@/components/ui";
import { REQUIREMENT_LABEL, formatDate, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";

export function DocumentReview({ matterId, documentId }: { matterId: string; documentId: string }) {
  const store = useStore();
  const matter = store.state.matters.find((item) => item.id === matterId);
  const document = store.state.documents.find((item) => item.id === documentId && item.matterId === matterId);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  if (!matter || !document) {
    return <p className="text-sm text-muted">Document not found.</p>;
  }

  const linked = store.state.requirements.filter((item) => document.requirementIds.includes(item.id));

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title={document.documentType}
        description={document.filename}
        actions={
          <Link href={`/matters/${matterId}/documents`} className="btn btn-secondary">
            All documents
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <DocumentCanvas
          type={document.documentType}
          institution={document.institution}
          owner={document.owner}
          period={document.periodLabel}
          filename={document.filename}
          pages={document.pages}
        />
        <aside className="card h-fit min-w-0 p-4">
          <h2 className="text-sm font-semibold">Information</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <Row label="Type" value={document.documentType} />
            <Row label="Owner" value={document.owner} />
            <Row label="Institution" value={document.institution || "—"} />
            <Row label="Account" value={document.accountLastFour ? `****${document.accountLastFour}` : "—"} />
            <Row label="Period" value={document.periodLabel || "—"} />
            <Row label="Uploaded" value={`${formatDate(document.uploadedAt)} · ${document.uploadedBy}`} />
            {document.reviewedBy ? <Row label="Reviewed by" value={document.reviewedBy} /> : null}
          </dl>
          <div className="mt-4 border-t border-line pt-4">
            <p className="text-xs font-medium text-muted">Satisfies</p>
            <ul className="mt-2 space-y-2">
              {linked.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                  <span>{item.title}</span>
                  <StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />
                </li>
              ))}
            </ul>
          </div>
          {document.status === "NEEDS_REVIEW" ? (
            <div className="mt-4 space-y-2 border-t border-line pt-4">
              {rejecting ? (
                <>
                  <textarea
                    className="field min-h-20"
                    placeholder="What should the client send instead?"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => setRejecting(false)}>Cancel</Button>
                    <Button
                      variant="danger"
                      onClick={() => store.rejectDocument(document.id, note || "Please upload a clearer copy.")}
                    >
                      Confirm rejection
                    </Button>
                  </div>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="danger" onClick={() => setRejecting(true)}>
                    Reject
                  </Button>
                  <Button variant="primary" onClick={() => store.acceptDocument(document.id)}>
                    Accept
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 border-t border-line pt-4 text-sm text-muted">
              {document.status === "ACCEPTED" ? "Accepted. The checklist item is complete." : "This file is no longer the current upload."}
              {document.rejectNote ? ` ${document.rejectNote}` : ""}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words">{value}</dd>
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
    <div className="rounded-xl border border-line bg-[#f3f5f9] p-4 md:p-6">
      <article className="mx-auto min-h-[560px] max-w-[560px] bg-white px-8 py-8 shadow-sm">
        <header className="flex items-start justify-between border-b border-neutral-200 pb-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-neutral-500">{type}</p>
            <h2 className="mt-1 text-lg font-semibold text-neutral-900">{institution || type}</h2>
            <p className="mt-1 text-sm text-neutral-600">{owner}</p>
          </div>
          <p className="text-xs text-neutral-500">{period || "2025–2026"}</p>
        </header>
        <table className="mt-6 w-full text-left text-sm text-neutral-800">
          <tbody>
            {previewRows(type).map((row) => (
              <tr key={row[0]} className="border-b border-neutral-100">
                <td className="py-2 text-neutral-500">{row[0]}</td>
                <td className="py-2 text-right font-medium">{row[1]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-8 text-[11px] leading-relaxed text-neutral-400">
          Preview of {filename}. Page 1 of {pages}. The original file is what the client uploaded. Extracted figures on the financial profile stay separate until you accept them.
        </p>
      </article>
    </div>
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
