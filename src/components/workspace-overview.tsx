"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/ui";
import { matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import { matterQueue, matterReviewSummary, WORK_QUEUES, workspaceCounts } from "@/lib/work-queues";

export function WorkspaceOverview() {
  const { state } = useStore();
  const counts = workspaceCounts(state);
  const review = state.matters.filter((matter) => matterQueue(state, matter) === "review");

  return (
    <div>
      <PageHeader eyebrow="Firm" title="Overview" description={`${counts.open} open ${counts.open === 1 ? "matter" : "matters"}. Choose a queue to continue work in this preview session.`}
        actions={<Link href="/matters/new" className="btn btn-primary"><Plus className="size-4" />New matter</Link>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {WORK_QUEUES.map((queue) => (
          <Link key={queue.id} href={`/matters?queue=${queue.id}`} className="card block p-4 hover:bg-[#f4f7fd]">
            <h2 className="text-sm font-semibold">{queue.label}</h2>
            <p className="mt-2 text-3xl font-semibold tabular-nums">{counts[queue.id]}</p>
            <p className="mt-2 text-xs leading-relaxed text-muted">{queue.hint}</p>
            <span className="mt-3 block text-xs font-medium text-brand">View matters →</span>
          </Link>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted">A matter awaiting review appears in Ready for review even when client information is still missing. Complete matters stay in their own queue.</p>
      <section className="card mt-6 overflow-hidden" aria-labelledby="review-heading">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-4">
          <h2 id="review-heading" className="text-sm font-semibold">Ready for your review</h2>
          <Link href="/matters?queue=review" className="text-sm text-brand underline">View queue</Link>
        </div>
        {review.length === 0 ? <p className="p-5 text-sm text-muted">No matters are waiting for attorney review.</p> : (
          <ul className="divide-y divide-line">
            {review.map((matter) => {
              const { pendingFiles, explanations, pendingRequirements } = matterReviewSummary(state, matter);
              return (
                <li key={matter.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <Link href={`/matters/${matter.id}`} className="font-medium text-brand underline">{matterTitle(matter)}</Link>
                    <p className="mt-1 text-xs text-muted">{pendingFiles > 0 || explanations > 0 ? `${pendingFiles} ${pendingFiles === 1 ? "file" : "files"} awaiting review · ${explanations} unavailable ${explanations === 1 ? "explanation" : "explanations"}` : pendingRequirements > 0 ? `${pendingRequirements} checklist items awaiting review` : "Client submission or matter review is ready."}</p>
                  </div>
                  <Link href={`/matters/${matter.id}${pendingFiles > 0 ? "/documents" : explanations > 0 || pendingRequirements > 0 ? "/checklist" : ""}`} className="btn btn-secondary">
                    {pendingFiles > 0 ? "Review files" : explanations > 0 ? "Review explanations" : pendingRequirements > 0 ? "Review checklist" : "Review matter"}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <p className="mt-5 text-xs text-muted">Demo workspace: changes are held in this browser session and reset on refresh.</p>
    </div>
  );
}
