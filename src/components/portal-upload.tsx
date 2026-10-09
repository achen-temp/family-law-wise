"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Choice, PageHeader } from "@/components/ui";
import { REQUIREMENT_LABEL, currentDocuments } from "@/lib/format";
import { useStore } from "@/lib/store";
import { StatusPill } from "@/components/ui";

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
  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  if (!item) return <p className="text-sm text-muted">This request is not on your checklist.</p>;

  const current = currentDocuments(store.state.documents, item.id)[0];
  const others = store.state.documents.filter(
    (doc) => doc.matterId === token && doc.status !== "REJECTED" && doc.status !== "REPLACED" && doc.id !== current?.id,
  );

  function attach(filename: string) {
    store.uploadToRequirement(token, item!.id, filename);
    router.push(`/portal/${token}/checklist`);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Checklist"
        title={item.groupLabel ? `${item.groupLabel}` : item.title}
        description={item.groupLabel ? item.title : item.description}
        actions={<StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />}
      />
      <p className="mb-4 text-sm leading-relaxed text-muted">{item.reason}</p>
      {current ? (
        <p className="mb-4 rounded-lg border border-line bg-white px-3 py-2 text-sm">
          Current file: {current.filename}
        </p>
      ) : null}
      <div className="card border-dashed p-8 text-center">
        <p className="text-sm font-medium">Drop a PDF, JPG, or PNG here</p>
        <p className="mt-1 text-xs text-muted">Choose a file from your computer, or attach a sample PDF in this preview.</p>
        <input
          type="file"
          accept="application/pdf,image/png,image/jpeg"
          className="mt-4 block w-full text-sm"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) attach(file.name);
          }}
        />
        <button
          type="button"
          className="btn btn-primary mt-4"
          onClick={() => attach(`${item.title.replace(/\s+/g, "-")}.pdf`)}
        >
          Attach sample PDF
        </button>
      </div>

      {others.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium">Or use a file you already uploaded</p>
          <ul className="card divide-y divide-line">
            {others.map((doc) => (
              <li key={doc.id}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-[#f4f7fd]"
                  onClick={() => {
                    store.linkExistingDocument(item.id, doc.id);
                    router.push(`/portal/${token}/checklist`);
                  }}
                >
                  <span>{doc.filename}</span>
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
