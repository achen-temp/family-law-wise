"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/ui";
import { formatDate, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { DocumentStatus } from "@/lib/types";

const FILTERS = ["All", "Needs review", "Accepted", "Rejected", "Replaced"] as const;

export function MatterDocuments({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  if (!matter) return <p className="text-sm text-muted">Matter not found.</p>;

  const documents = state.documents
    .filter((doc) => doc.matterId === matterId)
    .filter((doc) => {
      if (filter === "Needs review") return doc.status === "NEEDS_REVIEW";
      if (filter === "Accepted") return doc.status === "ACCEPTED";
      if (filter === "Rejected") return doc.status === "REJECTED";
      if (filter === "Replaced") return doc.status === "REPLACED";
      return true;
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Documents"
        description="Original files stay attached to checklist requirements. Open one to review it without downloading."
      />
      <div role="group" aria-label="Filter documents by status" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            aria-pressed={item === filter}
            className={item === filter ? "btn btn-primary h-8 px-3 text-xs" : "btn btn-secondary h-8 px-3 text-xs"}
          >
            {item === "Rejected" ? "Returned" : item}
          </button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg border border-line bg-surface" tabIndex={0} aria-label="Documents table">
        <table className="w-full min-w-[900px] table-fixed text-left text-sm">
          <caption className="sr-only">{matterTitle(matter)} documents, {filter === "Rejected" ? "returned" : filter.toLowerCase()}, newest uploads first</caption>
          <colgroup>
            <col className="w-[34%]" />
            <col className="w-[23%]" />
            <col className="w-[13%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead className="border-b border-line bg-surface-subtle text-xs text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">File</th>
              <th scope="col" className="px-3 py-3 font-semibold">Institution / period</th>
              <th scope="col" className="px-3 py-3 font-semibold">Owner</th>
              <th scope="col" className="px-3 py-3 font-semibold">Status</th>
              <th scope="col" className="px-3 py-3 font-semibold">Uploaded</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {documents.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-muted">No documents in this view.</td></tr>
            ) : documents.map((doc) => (
              <tr key={doc.id} className="relative h-16 align-middle hover:bg-surface-subtle focus-within:bg-primary-soft">
                <th scope="row" className="px-4 py-3 font-normal">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
                    <div className="min-w-0">
                      <Link href={`/matters/${matterId}/documents/${doc.id}`} title={doc.filename} className="line-clamp-2 break-words font-medium text-brand underline-offset-4 after:absolute after:inset-0 hover:underline [overflow-wrap:anywhere]">{doc.filename}</Link>
                      <p className="mt-1 text-xs text-muted">{doc.documentType}</p>
                    </div>
                  </div>
                </th>
                <td className="break-words px-3 py-3 [overflow-wrap:anywhere]">
                  <p>{doc.institution || "—"}</p>
                  {doc.periodLabel ? <p className="mt-1 text-xs text-muted">{doc.periodLabel}</p> : null}
                </td>
                <td className="break-words px-3 py-3 [overflow-wrap:anywhere]">{doc.owner}</td>
                <td className="px-3 py-3">
                  <DocPill status={doc.status} />
                  {doc.status === "REPLACED" ? <p className="mt-1 text-xs text-muted">Historical file</p> : null}
                </td>
                <td className="px-3 py-3 text-xs tabular-nums text-muted">{formatDate(doc.uploadedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DocPill({ status }: { status: DocumentStatus }) {
  if (status === "ACCEPTED") return <StatusPill status="ACCEPTED" label="Accepted" />;
  if (status === "NEEDS_REVIEW") return <StatusPill status="NEEDS_REVIEW" label="Needs review" />;
  return <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${status === "REJECTED" ? "bg-error-bg text-error-text" : "bg-neutral-bg text-neutral-text"}`}>{status === "REJECTED" ? "Returned" : "Replaced"}</span>;
}
