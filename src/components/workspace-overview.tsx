"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Clock3, ClipboardCheck, FileText, Folder, Info, MinusCircle, Plus } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/ui";
import { MATTER_LABEL, clientParty, cn, matterTitle, personName } from "@/lib/format";
import { useStore } from "@/lib/store";
import { matterQueue, matterReviewSummary, WORK_QUEUES, workspaceCounts, type WorkQueue } from "@/lib/work-queues";

const QUEUE_ICONS = { review: ClipboardCheck, waiting: Clock3, draft: Folder, complete: Check };
const QUEUE_HINTS = { review: "Files and explanations", waiting: "Answers or information", draft: "Prepare an invitation", complete: "Marked by the attorney" };
const QUEUE_TITLES = { review: "Ready for your review", waiting: "Waiting on a client", draft: "Draft matters", complete: "Complete matters" };
const QUEUE_EMPTY = {
  review: "No matters are waiting for attorney review.",
  waiting: "No matters are waiting on a client.",
  draft: "No draft matters. Create a matter to prepare a client invitation.",
  complete: "No matters have been marked complete.",
};

export function WorkspaceOverview() {
  const { state } = useStore();
  const [selectedQueue, setSelectedQueue] = useState<WorkQueue>("review");
  const [expandedMatterId, setExpandedMatterId] = useState<string | null>(() =>
    state.matters.find((matter) => matterQueue(state, matter) === "review")?.id ?? null,
  );
  const counts = workspaceCounts(state);
  const matters = state.matters.filter((matter) => matterQueue(state, matter) === selectedQueue);

  return (
    <div className="-mx-4 -my-6 min-h-screen bg-background px-4 py-6 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <div className="mx-auto max-w-[1600px]">
        <PageHeader title="Overview" description={`${counts.open} open ${counts.open === 1 ? "matter" : "matters"} in your workspace.`}
          actions={<Link href="/matters/new" className="btn btn-primary"><Plus className="size-4" aria-hidden="true" />New matter</Link>} />
        <div className="grid items-start gap-6 lg:grid-cols-[228px_minmax(0,1fr)]">
          <aside aria-label="Matter work queues">
            <div className="mb-3 flex items-center justify-between px-3 text-xs text-muted">
              <span>Work queues</span><span>{counts.all} {counts.all === 1 ? "matter" : "matters"}</span>
            </div>
            <div className="space-y-1">
              {WORK_QUEUES.map((queue) => {
                const Icon = QUEUE_ICONS[queue.id];
                const selected = selectedQueue === queue.id;
                return (
                  <div key={queue.id} className={cn("relative flex items-center rounded-lg border", selected ? "border-line bg-surface" : "border-transparent hover:bg-surface-subtle")}>
                    {selected ? <span className="absolute inset-y-5 -left-px w-[3px] rounded bg-brand" aria-hidden="true" /> : null}
                    <button type="button" aria-pressed={selected} aria-controls="workspace-queue" onClick={() => { setSelectedQueue(queue.id); setExpandedMatterId(null); }}
                      className="flex min-h-[88px] min-w-0 flex-1 items-center gap-2.5 rounded-lg px-3 py-4 text-left">
                      <Icon className={cn("size-4 shrink-0", selected ? "text-brand" : "text-muted")} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13px] font-medium leading-5">{queue.label}</span>
                        <span className="mt-1 block text-xs leading-[18px] text-muted" title={queue.hint}>{QUEUE_HINTS[queue.id]}</span>
                      </span>
                      <span className={cn("text-[28px] font-medium leading-8 tabular-nums", selected ? "text-brand" : "text-muted")}>{counts[queue.id]}</span>
                    </button>
                    <Link href={`/matters?queue=${queue.id}`} aria-label={`Open ${queue.label} in Matters`} title={`Open ${queue.label} in Matters`}
                      className="mr-1 grid size-8 shrink-0 place-items-center rounded text-muted hover:bg-brand-soft hover:text-brand">
                      <ArrowUpRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                );
              })}
            </div>
            <p className="mx-3 mt-5 border-t border-line pt-4 text-xs leading-[18px] text-muted">
              <span className="font-medium text-foreground">Ready for review takes priority.</span><br />
              Matters with pending review stay in Ready for review even when client information is missing. Complete matters remain in their own queue.
            </p>
          </aside>
          <div className="min-w-0">
            <section id="workspace-queue" className="card min-w-0 overflow-hidden" aria-labelledby="queue-heading">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-6 py-5">
                <div><h2 id="queue-heading" className="text-base font-semibold">{QUEUE_TITLES[selectedQueue]}</h2>
                  <p className="mt-1 text-xs text-muted" role="status">{matters.length} {matters.length === 1 ? "matter" : "matters"}</p>
                </div>
                <Link href={`/matters?queue=${selectedQueue}`} className="text-xs text-brand underline underline-offset-2">View queue</Link>
              </div>
              {matters.length === 0 ? <p className="px-6 py-12 text-sm text-muted">{QUEUE_EMPTY[selectedQueue]}</p> : (
                <ul className="divide-y divide-line">
                  {matters.map((matter) => {
                    const title = matterTitle(matter);
                    const summary = matterReviewSummary(state, matter);
                    const reviewing = selectedQueue === "review";
                    const expanded = reviewing && expandedMatterId === matter.id;
                    const requirements = state.requirements.filter((item) => item.matterId === matter.id && item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED");
                    const documents = state.documents.filter((document) => document.matterId === matter.id && document.status === "NEEDS_REVIEW" &&
                      (document.requirementIds.length === 0 || requirements.some((item) => document.requirementIds.includes(item.id))));
                    const explanations = requirements.filter((item) => item.status === "NOT_AVAILABLE");
                    const pendingRequirements = requirements.filter((item) => item.status === "NEEDS_REVIEW" || item.status === "UPLOADED");
                    const reviewText = summary.pendingFiles > 0 || summary.explanations > 0
                      ? `${summary.pendingFiles} ${summary.pendingFiles === 1 ? "file" : "files"} awaiting review · ${summary.explanations} unavailable ${summary.explanations === 1 ? "explanation" : "explanations"}`
                      : summary.pendingRequirements > 0 ? `${summary.pendingRequirements} checklist items awaiting review` : "Client submission or matter review is ready.";
                    const actionLabel = !reviewing ? "Open matter" : summary.pendingFiles > 0 ? "Review files" : summary.explanations > 0 ? "Review explanations" : summary.pendingRequirements > 0 ? "Review checklist" : "Review matter";
                    const actionHref = `/matters/${matter.id}${!reviewing ? "" : summary.pendingFiles > 0 ? "/documents" : summary.explanations > 0 || summary.pendingRequirements > 0 ? "/checklist" : ""}`;
                    const action = <Link href={actionHref} className={cn("btn shrink-0", reviewing ? "btn-primary" : "btn-secondary")}>{actionLabel}<ArrowRight className="size-4" aria-hidden="true" /></Link>;
                    return (
                      <li key={matter.id} className="min-w-0">
                        <div className="flex flex-wrap items-center gap-4 px-6 py-5">
                          <div className="flex min-w-0 flex-1 basis-44 items-center gap-3">
                            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-line bg-brand-soft text-brand"><Folder className="size-5" aria-hidden="true" /></span>
                            <div className="min-w-0">
                              <h3 className={cn("[overflow-wrap:anywhere] font-semibold", expanded ? "text-xl tracking-tight" : "line-clamp-2 text-sm")}>
                                <Link href={`/matters/${matter.id}`} title={title} className="hover:text-brand hover:underline">{title}</Link>
                              </h3>
                              <p className={cn("mt-1 text-xs text-muted [overflow-wrap:anywhere]", !expanded && "line-clamp-2")}>{personName(clientParty(matter))} · {matter.state}, {matter.county}</p>
                            </div>
                          </div>
                          {!expanded && reviewing ? <p className="max-w-56 text-xs leading-[18px] text-muted">{reviewText}</p> : null}
                          {expanded || !reviewing ? <StatusPill kind="matter" status={matter.status} label={MATTER_LABEL[matter.status]} /> : null}
                          {!expanded ? action : null}
                          {reviewing ? <button type="button" aria-expanded={expanded} aria-controls={`review-details-${matter.id}`} aria-label={`${expanded ? "Collapse" : "Expand"} ${title} details`}
                            onClick={() => setExpandedMatterId(expanded ? null : matter.id)} className="grid size-8 shrink-0 place-items-center rounded-md border border-line bg-surface-subtle text-muted hover:border-brand hover:text-brand">
                            <ChevronDown className={cn("size-4", expanded && "rotate-180")} aria-hidden="true" />
                          </button> : null}
                        </div>
                        {reviewing ? (
                          <div id={`review-details-${matter.id}`} hidden={!expanded}>
                            <div className="px-6 pb-6">
                              {documents.length > 0 ? <div>
                                <p className="flex flex-wrap gap-x-1 border-t border-line pt-4 text-xs text-muted"><span className="font-semibold text-foreground">{summary.pendingFiles} submitted {summary.pendingFiles === 1 ? "file" : "files"}</span><span>awaiting your review</span></p>
                                <ul className="mt-2 divide-y divide-line">
                                  {documents.map((document) => {
                                    const requirement = requirements.find((item) => document.requirementIds.includes(item.id));
                                    return <li key={document.id} className="flex items-center gap-3 py-4">
                                      <span className="grid h-9 w-8 shrink-0 place-items-center rounded border border-line bg-surface-subtle text-muted"><FileText className="size-4" aria-hidden="true" /></span>
                                      <div className="min-w-0 flex-1"><p className="text-sm font-medium [overflow-wrap:anywhere]">{requirement?.title ?? document.documentType}</p>
                                        <p className="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]">{[document.institution, `${document.pages} ${document.pages === 1 ? "page" : "pages"}`].filter(Boolean).join(" · ")}</p>
                                        <p className="mt-0.5 break-words text-xs text-muted [overflow-wrap:anywhere]">{document.filename}</p>
                                      </div>
                                      <Link href={`/matters/${matter.id}/documents/${document.id}`} className="shrink-0 text-xs text-brand underline underline-offset-2">View file</Link>
                                    </li>;
                                  })}
                                </ul>
                              </div> : null}
                              {explanations.length > 0 ? <div className="mt-3 rounded-md border border-line bg-surface-subtle px-4 py-3">
                                <p className="flex items-center gap-2 text-xs font-medium"><MinusCircle className="size-4 text-muted" aria-hidden="true" />{summary.explanations} unavailable {summary.explanations === 1 ? "explanation" : "explanations"}</p>
                                <ul className="mt-2 divide-y divide-line">{explanations.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
                                  <div className="min-w-0 flex-1"><p className="text-sm [overflow-wrap:anywhere]">{item.title}</p>{item.groupLabel ? <p className="mt-0.5 text-xs text-muted [overflow-wrap:anywhere]">{item.groupLabel}</p> : null}</div>
                                  <Link href={`/matters/${matter.id}/checklist#section-${item.section}`} className="shrink-0 text-xs text-brand underline underline-offset-2">Read explanation</Link>
                                </li>)}</ul>
                              </div> : null}
                              {documents.length === 0 && explanations.length === 0 ? <div className="border-t border-line pt-4">
                                {pendingRequirements.length > 0 ? <ul className="divide-y divide-line">{pendingRequirements.map((item) => <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                                  <p className="min-w-0 flex-1 text-sm [overflow-wrap:anywhere]">{item.title}</p>
                                  <Link href={`/matters/${matter.id}/checklist#section-${item.section}`} className="text-xs text-brand underline underline-offset-2">Review checklist</Link>
                                </li>)}</ul> : <p className="text-sm text-muted">Client submission or matter review is ready.</p>}
                              </div> : null}
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-subtle px-6 py-4">{action}
                              <Link href={`/matters/${matter.id}/checklist`} className="text-xs text-brand underline underline-offset-2">View checklist</Link>
                            </div>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <p className="mt-4 flex items-start gap-2 text-xs leading-[18px] text-muted"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />Demo workspace: changes are held in this browser session and reset on refresh.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
