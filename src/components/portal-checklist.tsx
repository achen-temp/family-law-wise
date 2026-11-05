"use client";

import Link from "next/link";
import { FileText } from "lucide-react";
import { PageHeader, StackedBar, StatusPill } from "@/components/ui";
import { CHECKLIST_SECTIONS } from "@/lib/content";
import { REQUIREMENT_LABEL, sectionLabel, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Requirement } from "@/lib/types";

export function PortalChecklist({ token }: { token: string }) {
  const { state, submitDisclosure, dismissSubmissionReceipt } = useStore();
  const matter = state.matters.find((item) => item.id === token);
  const requirements = state.requirements.filter(
    (item) => item.matterId === token && item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED",
  );
  if (!matter) return null;
  const progress = stats(requirements);
  const receipt = state.submissionReceipt?.matterId === token ? state.submissionReceipt : undefined;
  const submitted = receipt && state.documents.find((doc) => doc.id === receipt.documentId && doc.matterId === token);
  const submittedFor = receipt && state.requirements.find((item) => item.id === receipt.requirementId && item.matterId === token);

  return (
    <div>
      <PageHeader
        eyebrow="Your checklist"
        title="Documents"
        description="Upload what the questionnaire asked for. One file can be reused for more than one item."
        actions={
          matter.status !== "COMPLETE" && matter.status !== "CLIENT_SUBMITTED" ? (
            <button type="button" className="btn btn-primary" onClick={() => submitDisclosure(token)}>
              I’ve provided everything requested
            </button>
          ) : null
        }
      />
      <div className="card mb-5 p-4">
        {submitted && submittedFor ? (
          <section role="status" aria-label="Submission result" className="mb-4 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm">
            <h2 className="font-semibold">{receipt.kind === "UPLOAD" ? "File submitted successfully" : "Existing file linked successfully"}</h2>
            <p className="break-words [overflow-wrap:anywhere]">{submitted.filename}</p>
            <p className="break-words">For: {submittedFor.groupLabel ? `${submittedFor.groupLabel} · ` : ""}{submittedFor.title}</p>
            <p>{submitted.status === "NEEDS_REVIEW" ? "Needs review — waiting for your attorney. Submission does not mean acceptance." : submitted.status === "ACCEPTED" ? "This file already has an attorney acceptance. Linking it does not record a new review." : "The review status has changed. Open the file for the latest decision."}</p>
            <p className="text-xs text-muted">Demo session only. Refreshing resets changes.</p>
            <div className="flex flex-wrap gap-3">
              <Link href={`/portal/${token}/documents/${submitted.id}`} className="font-medium text-brand underline">View submitted file</Link>
              <button type="button" onClick={dismissSubmissionReceipt} className="text-brand underline">Dismiss confirmation</button>
            </div>
          </section>
        ) : null}
        {progress.review > 0 ? <p className="mb-3 text-sm text-brand" role="status">Submitted files are waiting for attorney review. Submission does not mean acceptance.</p> : null}
        <div className="mb-2 flex items-center justify-between text-sm">
          <span>{progress.pct}% accepted</span>
          <span className="text-muted">
            {progress.missing} still needed · {progress.review} in review
          </span>
        </div>
        <StackedBar {...progress} />
      </div>
      <div className="space-y-5">
        {CHECKLIST_SECTIONS.map((section) => {
          const items = requirements.filter((item) => item.section === section);
          if (items.length === 0) return null;
          return (
            <section key={section}>
              <h2 className="mb-2 text-sm font-semibold">{sectionLabel(section)}</h2>
              <div className="card divide-y divide-line">
                {group(items).map(([label, rows]) => (
                  <div key={label || section}>
                    {label ? <p className="bg-[#f4f7fd] px-4 py-2 text-xs font-medium text-muted">{label}</p> : null}
                    {rows.map((item) => (
                      <Link key={item.id} href={`/portal/${token}/checklist/${item.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[#f4f7fd]">
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                            <FileText className="size-4" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{item.title}</span>
                            <span className="text-xs text-muted">{item.reason}</span>
                          </span>
                        </span>
                        <StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function group(items: Requirement[]) {
  const map = new Map<string, Requirement[]>();
  for (const item of items) {
    const key = item.groupLabel ?? "";
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()];
}
