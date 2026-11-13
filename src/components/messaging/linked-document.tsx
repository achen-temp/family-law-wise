"use client";

import Link from "next/link";
import { ArrowUpRight, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import type { ConversationRole } from "@/lib/types";

const labels = {
  NEEDS_REVIEW: "Awaiting review",
  ACCEPTED: "Accepted",
  REJECTED: "Needs replacement",
  REPLACED: "Previous version",
};

export function LinkedDocument({
  documentId,
  matterId,
  role,
}: {
  documentId: string;
  matterId: string;
  role: ConversationRole;
}) {
  const { state } = useStore();
  const document = state.documents.find(
    (item) => item.id === documentId && item.matterId === matterId,
  );
  if (!document)
    return (
      <p className="mt-2 text-xs text-muted">
        Linked file is no longer available.
      </p>
    );
  const content = (
    <>
      <FileText className="mt-0.5 size-4 shrink-0 text-muted" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">
          {document.filename}
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          Linked file · {labels[document.status]}
        </span>
      </span>
      <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 text-muted" />
    </>
  );
  const className =
    "mt-2 flex w-full min-w-0 items-start gap-2 rounded-md border border-line bg-surface-subtle px-2.5 py-2 text-left hover:border-border-strong hover:bg-white";
  return (
    <Link
      href={
        role === "ATTORNEY"
          ? `/matters/${matterId}/documents/${documentId}`
          : `/portal/${matterId}/documents/${documentId}`
      }
      className={className}
    >
      {content}
    </Link>
  );
}
