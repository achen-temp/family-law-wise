"use client";

import Link from "next/link";
import { useState } from "react";
import { FileText } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/ui";
import { formatDate, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { DocumentStatus } from "@/lib/types";

const FILTERS = ["All", "Needs review", "Accepted"] as const;

export function MatterDocuments({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  if (!matter) return <p className="text-sm text-muted">Matter not found.</p>;

  const documents = state.documents
    .filter((doc) => doc.matterId === matterId && doc.status !== "REPLACED")
    .filter((doc) => {
      if (filter === "Needs review") return doc.status === "NEEDS_REVIEW";
      if (filter === "Accepted") return doc.status === "ACCEPTED";
      return doc.status !== "REJECTED";
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Documents"
        description="Original files stay attached to checklist requirements. Open one to review it without downloading."
      />
      <div className="mb-4 flex gap-2">
        {FILTERS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={item === filter ? "btn btn-primary h-8 px-3 text-xs" : "btn btn-secondary h-8 px-3 text-xs"}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="card divide-y divide-line">
        {documents.length === 0 ? (
          <p className="px-4 py-8 text-sm text-muted">No documents in this view.</p>
        ) : (
          documents.map((doc) => (
            <Link key={doc.id} href={`/matters/${matterId}/documents/${doc.id}`} className="flex items-center gap-4 px-4 py-3 hover:bg-[#f4f7fd]">
              <span className="grid size-10 place-items-center rounded-lg bg-brand-soft text-brand">
                <FileText className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{doc.filename}</span>
                <span className="block text-xs text-muted">
                  {doc.documentType}
                  {doc.institution ? ` · ${doc.institution}` : ""} · {formatDate(doc.uploadedAt)}
                </span>
              </span>
              <DocPill status={doc.status} />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

function DocPill({ status }: { status: DocumentStatus }) {
  if (status === "ACCEPTED") return <StatusPill status="ACCEPTED" label="Accepted" />;
  if (status === "NEEDS_REVIEW") return <StatusPill status="NEEDS_REVIEW" label="Needs review" />;
  if (status === "REJECTED") return <StatusPill status="MISSING" label="Rejected" />;
  return <StatusPill status="WAIVED" label="Replaced" />;
}
