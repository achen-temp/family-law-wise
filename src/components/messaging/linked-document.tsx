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
      <FileText className="mt-0.5 size-5 shrink-0 text-brand" />
      <span className="min-w-0 flex-1">
        <span className="block break-all text-sm font-medium">
          {document.filename}
        </span>
        <span className="mt-1 block text-xs text-muted">
          Linked file · {labels[document.status]}
        </span>
      </span>
      <ArrowUpRight className="size-4 shrink-0 text-muted" />
    </>
  );
  const className =
    "mt-3 flex w-full items-start gap-3 rounded-xl border border-line bg-white p-3 text-left hover:border-brand/50";
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
