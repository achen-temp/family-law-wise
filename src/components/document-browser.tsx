"use client";

import Link from "next/link";
import { useState } from "react";
import { PageHeader, StatusPill } from "@/components/ui";
import { LocalFilePreview } from "@/components/local-file-preview";
import { useStore } from "@/lib/store";
import { formatDate, matterTitle, REQUIREMENT_LABEL } from "@/lib/format";
import type { DocumentStatus } from "@/lib/types";

const labels: Record<DocumentStatus, string> = { NEEDS_REVIEW: "Needs review", ACCEPTED: "Accepted", REJECTED: "Returned", REPLACED: "Replaced" };

export function DocumentBrowser({ token }: { token?: string }) {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentStatus | "ALL">(token ? "ALL" : "NEEDS_REVIEW");
  if (token && !state.matters.some((matter) => matter.id === token)) return <p>Matter not found.</p>;
  const documents = state.documents.filter((doc) => {
    if (token && doc.matterId !== token) return false;
    if (filter !== "ALL" && doc.status !== filter) return false;
    const matter = state.matters.find((item) => item.id === doc.matterId);
    return `${doc.filename} ${doc.owner} ${matter?.name ?? ""} ${matter ? matterTitle(matter) : ""}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <PageHeader title={token ? "Submitted files" : "Document review queue"} description="Demo session files. Refreshing resets changes. All files includes previous and returned submissions." />
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <input aria-label="Search files, clients, or matters" className="field min-w-0 flex-1" placeholder="Search files, clients, or matters" value={query} onChange={(event) => setQuery(event.target.value)} />
      <select aria-label="Filter by review status" className="field w-full sm:w-auto" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
        <option value="ALL">All files</option>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
    <p className="mb-3 text-sm text-muted" role="status">{documents.length} files in this view</p>
    <div className="card divide-y divide-line">
      {!documents.length ? <p className="p-6 text-sm text-muted">No files match this view.</p> : documents.map((doc) => {
        const matter = state.matters.find((item) => item.id === doc.matterId);
        return <Link key={doc.id} href={token ? `/portal/${token}/documents/${doc.id}` : `/matters/${doc.matterId}/documents/${doc.id}`} className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-brand-soft">
          <div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{doc.filename}</p><p className="text-xs text-muted">{matter ? matterTitle(matter) : doc.matterId} · {formatDate(doc.uploadedAt)}</p><p className="text-xs text-muted">{doc.localFile ? "Local file" : "Demo sample"} · {doc.requirementIds.length} linked requirements</p></div>
          <span className="text-sm">{labels[doc.status]}</span>
        </Link>;
      })}
    </div>
    {token ? <section className="card mt-5 space-y-3 p-4"><h2 className="font-semibold">Explanation and checklist updates</h2><p className="text-xs text-muted">Submitted explanations and attorney waivers or applicability decisions remain in this session history.</p>{state.activity.filter((item) => item.matterId === token && /as unavailable|^Waived |^Marked not applicable /.test(item.text)).map((item) => <div key={item.id} className="text-sm"><p className="text-xs text-muted">{formatDate(item.at)} · {item.actor}</p><p className="mt-1 break-words">{item.text}</p></div>)}</section> : null}
  </div>;
}

export function PortalDocumentDetail({ token, documentId }: { token: string; documentId: string }) {
  const { state } = useStore();
  const doc = state.documents.find((item) => item.id === documentId && item.matterId === token);
  if (!doc) return <div className="card p-6"><p>File not found in this matter.</p><Link href={`/portal/${token}/documents`} className="text-brand underline">Back to submitted files</Link></div>;
  const linked = state.requirements.filter((item) => item.matterId === token && doc.requirementIds.includes(item.id));
  const related = state.documents.filter((item) => item.matterId === token && item.id !== doc.id && item.requirementIds.some((id) => doc.requirementIds.includes(id))).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return <div className="min-w-0 space-y-4 [overflow-wrap:anywhere]">
    <PageHeader title="File details" description={doc.filename} actions={<Link href={`/portal/${token}/documents`} className="btn btn-secondary">All submitted files</Link>} />
    <p className="text-sm text-muted">{labels[doc.status]} · Submitted {formatDate(doc.uploadedAt)} by {doc.uploadedBy}</p>
    {doc.localFile ? <LocalFilePreview file={doc.localFile} /> : <div className="card p-5 text-sm text-muted">Demo sample record. No original file contents are available.</div>}
    {doc.reviewedBy ? <div className="card p-4 text-sm">Reviewed by {doc.reviewedBy}{doc.reviewedAt ? ` on ${formatDate(doc.reviewedAt)}` : ""}.{doc.rejectNote ? <p className="mt-2 text-rose-800">Return reason: {doc.rejectNote}</p> : null}</div> : null}
    <section className="card space-y-3 p-4"><h2 className="font-semibold">Linked requirements</h2>
      {linked.length ? linked.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 text-sm"><Link href={`/portal/${token}/checklist/${item.id}`} className="text-brand underline">{item.groupLabel ? `${item.groupLabel} · ` : ""}{item.title}</Link><StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} /></div>) : <p className="text-sm text-muted">The linked requirement is no longer on the active checklist. This file record remains available.</p>}
    </section>
    <section className="card space-y-3 p-4"><h2 className="font-semibold">Other submissions for these requirements</h2><p className="text-xs text-muted">Previous files linked to these requirements and their review decisions.</p>
      {related.length ? related.map((item) => <Link key={item.id} href={`/portal/${token}/documents/${item.id}`} className="block text-sm text-brand underline">{item.filename} · {formatDate(item.uploadedAt)} · {labels[item.status]}</Link>) : <p className="text-sm text-muted">No other submissions.</p>}
    </section>
    <Link href={`/matters/${token}/documents/${doc.id}`} className="inline-block text-sm text-brand underline">Demo: view as attorney</Link>
  </div>;
}
