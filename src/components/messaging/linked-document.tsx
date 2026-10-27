"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
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
  const [open, setOpen] = useState(false);
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
    <>
      {role === "ATTORNEY" ? (
        <Link
          href={`/matters/${matterId}/documents/${documentId}`}
          className={className}
        >
          {content}
        </Link>
      ) : (
        <button
          type="button"
          className={className}
          onClick={() => setOpen(true)}
        >
          {content}
        </button>
      )}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="linked-file-title"
      >
        <DialogTitle id="linked-file-title">Linked file</DialogTitle>
        <DialogContent>
          <div className="rounded-xl border border-line bg-brand-soft/40 p-5">
            <FileText className="mb-3 size-8 text-brand" />
            <h3 className="break-all font-semibold">{document.filename}</h3>
            <p className="mt-1 text-sm text-muted">
              {document.documentType} · {labels[document.status]}
            </p>
          </div>
          <dl className="my-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">Owner</dt>
            <dd>{document.owner}</dd>
            <dt className="text-muted">Period</dt>
            <dd>{document.periodLabel || "Not specified"}</dd>
            <dt className="text-muted">Uploaded by</dt>
            <dd>{document.uploadedBy}</dd>
          </dl>
          {document.rejectNote && (
            <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              Attorney feedback: {document.rejectNote}
            </p>
          )}
          <p className="text-xs text-muted">
            Sample file record. An original file preview is not available in
            this demo.
          </p>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          {document.requirementIds[0] && (
            <Button
              component={Link}
              href={`/portal/${matterId}/checklist/${document.requirementIds[0]}`}
              onClick={() => setOpen(false)}
            >
              Open checklist item
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
