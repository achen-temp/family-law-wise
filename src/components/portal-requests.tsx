"use client";

import Link from "next/link";
import { FileCheck2, Inbox, RotateCcw } from "lucide-react";
import { PageHeader, StatusPill } from "@/components/ui";
import { clientRequests, latestDocument } from "@/lib/document-selectors";
import { formatDate, REQUIREMENT_LABEL } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { DocumentFile, Requirement } from "@/lib/types";

export function PortalRequests({ token }: { token: string }) {
  const { state, submitDisclosure } = useStore();
  const matter = state.matters.find((item) => item.id === token);
  const items = clientRequests(state, token);
  if (!matter) return null;

  const done = items.length === 0;

  return (
    <div className="min-w-0 [overflow-wrap:anywhere]">
      <PageHeader
        eyebrow="From your attorney"
        title={done ? "No open requests" : `${items.length} document${items.length === 1 ? "" : "s"} need action`}
        description={matter.lastRequest?.message ?? "Review each request, address any returned files, and submit the right document for attorney review."}
      />

      {matter.lastRequest ? <p className="mb-4 text-xs text-muted">Request sent {formatDate(matter.lastRequest.at)}</p> : null}

      {done ? (
        <section className="card max-w-3xl p-6 text-center" aria-labelledby="no-requests-heading">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-brand-soft text-brand"><Inbox className="size-5" aria-hidden="true" /></span>
          <h2 id="no-requests-heading" className="mt-3 font-semibold">Nothing is waiting on a formal request</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted">Your checklist may still contain missing items. Continue there to upload documents that your questionnaire requires.</p>
          <Link href={`/portal/${token}/checklist`} className="btn btn-secondary mt-4">Open checklist</Link>
        </section>
      ) : (
        <section className="card max-w-5xl overflow-hidden" aria-label="Documents that need action">
          <div className="flex flex-col gap-2 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h2 className="font-semibold">Documents that need action</h2><p className="mt-1 text-xs text-muted">Each item stays open until a valid file or explanation is submitted.</p></div>
            <span className="text-sm font-medium text-muted">{items.length} open</span>
          </div>
          <div className="divide-y divide-line">
            {items.map((item) => <RequestRow key={item.id} item={item} token={token} documents={state.documents} />)}
          </div>
        </section>
      )}

      {!done ? (
        <div className="mt-5 flex max-w-5xl flex-col gap-3 rounded-lg border border-line bg-surface-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-sm font-medium">Finished with every open request?</p><p className="mt-1 text-xs text-muted">This notifies your attorney that the requested set is ready for review.</p></div>
          <button type="button" className="btn btn-secondary shrink-0" onClick={() => submitDisclosure(token)}>I’ve provided everything requested</button>
        </div>
      ) : null}
    </div>
  );
}

function RequestRow({ item, token, documents }: { item: Requirement; token: string; documents: DocumentFile[] }) {
  const latest = latestDocument(documents, item.id);
  const rejected = latest?.status === "REJECTED";
  const actionLabel = rejected ? "Replace file" : "Upload document";

  return (
    <article className="grid gap-4 px-5 py-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            {rejected ? <RotateCcw className="size-4" aria-hidden="true" /> : <FileCheck2 className="size-4" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            {item.groupLabel ? <p className="text-xs font-medium text-muted">{item.groupLabel}</p> : null}
            <h3 className="break-words text-sm font-semibold">{item.title}</h3>
            <p className="mt-1 text-xs leading-relaxed text-muted">{item.description}</p>
            {item.periodLabel ? <p className="mt-1 text-xs"><span className="text-muted">Requested period:</span> {item.periodLabel}</p> : null}
          </div>
        </div>

        {rejected ? (
          <div className="ml-12 mt-3 rounded-lg bg-error-bg p-3 text-sm text-error-text">
            <p className="font-semibold">Returned: {latest.filename}</p>
            <p className="mt-1">{latest.rejectNote || "Your attorney requested a corrected copy."}</p>
            <Link className="mt-2 inline-block font-medium underline underline-offset-4" href={`/portal/${token}/documents/${latest.id}`}>View file and review details</Link>
          </div>
        ) : null}
      </div>

      <div className="ml-12 flex flex-wrap items-center gap-2 md:ml-0 md:justify-end">
        <StatusPill status={item.status} label={rejected ? "Needs replacement" : REQUIREMENT_LABEL[item.status]} />
        <Link href={`/portal/${token}/checklist/${item.id}`} className="btn btn-primary h-9 px-3 text-xs">{actionLabel}</Link>
      </div>
    </article>
  );
}
