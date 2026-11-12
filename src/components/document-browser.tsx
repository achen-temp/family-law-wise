"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { DOCUMENT_STATUS_LABEL, DocumentStatusPill, DocumentTable, DocumentToolbar, type DocumentFilter } from "@/components/document-table";
import { PageHeader, StatusPill } from "@/components/ui";
import { LocalFilePreview } from "@/components/local-file-preview";
import { useStore } from "@/lib/store";
import { formatDate, REQUIREMENT_LABEL } from "@/lib/format";
import { documentSearchText, documentSourceLabel, documentVersions, linkedRequirementContext } from "@/lib/document-view";

export function DocumentBrowser({ token }: { token?: string }) {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>(token ? "ALL" : "NEEDS_REVIEW");
  if (token && !state.matters.some((matter) => matter.id === token)) return <p>Matter not found.</p>;
  const documents = state.documents.filter((doc) => {
    if (token && doc.matterId !== token) return false;
    if (filter !== "ALL" && doc.status !== filter) return false;
    const matter = state.matters.find((item) => item.id === doc.matterId);
    return documentSearchText(doc, matter, state.requirements).includes(query.trim().toLowerCase());
  }).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <PageHeader title={token ? "Submitted files" : "Document review queue"} description="Demo session files. Refreshing resets changes. All files includes previous and returned submissions." />
    <DocumentToolbar query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} />
    <p className="mb-3 text-sm text-muted" role="status">{documents.length} files in this view</p>
    <DocumentTable documents={documents} versionDocuments={state.documents.filter((doc) => !token || doc.matterId === token)} matters={state.matters} requirements={state.requirements} showMatter={!token} hrefFor={(doc) => token ? `/portal/${token}/documents/${doc.id}` : `/matters/${doc.matterId}/documents/${doc.id}`} />
    {token ? <section className="card mt-5 space-y-3 p-4"><h2 className="font-semibold">Explanation and checklist updates</h2><p className="text-xs text-muted">Submitted explanations and attorney waivers or applicability decisions remain in this session history.</p>{state.activity.filter((item) => item.matterId === token && /as unavailable|^Waived |^Marked not applicable /.test(item.text)).map((item) => <div key={item.id} className="text-sm"><p className="text-xs text-muted">{formatDate(item.at)} · {item.actor}</p><p className="mt-1 break-words">{item.text}</p></div>)}</section> : null}
  </div>;
}

export function PortalDocumentDetail({ token, documentId }: { token: string; documentId: string }) {
  const { state } = useStore();
  const doc = state.documents.find((item) => item.id === documentId && item.matterId === token);
  if (!doc) return <div className="card p-6"><p>File not found in this matter.</p><Link href={`/portal/${token}/documents`} className="text-brand underline">Back to submitted files</Link></div>;
  const linked = state.requirements.filter((item) => item.matterId === token && doc.requirementIds.includes(item.id));
  const related = state.documents.filter((item) => item.matterId === token && item.requirementIds.some((id) => doc.requirementIds.includes(id))).sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  const context = linkedRequirementContext(doc, state.requirements);
  const version = documentVersions(related).get(doc.id);
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    <PageHeader title={doc.filename} description="Original file, checklist context, and submission history." actions={<Link href={`/portal/${token}/documents`} className="btn btn-secondary">All submitted files</Link>} />
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
      <main className="min-w-0 space-y-4">
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div><h2 className="text-sm font-semibold">Original file</h2><p className="text-xs text-muted">{documentSourceLabel(doc)} · {doc.pages} {doc.pages === 1 ? "page" : "pages"}</p></div>
            <DocumentStatusPill status={doc.status} />
          </div>
          <div className="p-4">
            {doc.localFile ? <LocalFilePreview file={doc.localFile} /> : <div className="grid min-h-80 place-items-center rounded-lg border border-dashed border-border-strong bg-surface-subtle px-6 text-center"><div><p className="text-sm font-medium">Preview unavailable for this demo sample</p><p className="mt-1 max-w-sm text-sm text-muted">The file record and review history are available, but sample contents are not stored in this frontend demo.</p></div></div>}
          </div>
        </section>
        {doc.rejectNote ? <section className="card border-error-text/30 bg-error-bg p-4"><h2 className="text-sm font-semibold text-error-text">Why this file was returned</h2><p className="mt-1 text-sm text-error-text">{doc.rejectNote}</p></section> : null}
      </main>
      <aside className="space-y-4 lg:sticky lg:top-5">
        <section className="card p-4">
          <h2 className="font-semibold">File information</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <DetailTerm label="Status"><DocumentStatusPill status={doc.status} /></DetailTerm>
            <DetailTerm label="Version">{version?.current ? "Current submission" : `Previous submission ${version?.position ?? ""}`}{version && version.total > 1 ? ` of ${version.total}` : ""}</DetailTerm>
            <DetailTerm label="Submitted">{formatDate(doc.uploadedAt)}</DetailTerm>
            <DetailTerm label="Submitted by">{doc.uploadedBy}</DetailTerm>
            <DetailTerm label="Source">{documentSourceLabel(doc)}</DetailTerm>
            <DetailTerm label="Document type">{doc.documentType}</DetailTerm>
            {doc.institution ? <DetailTerm label="Institution">{doc.institution}</DetailTerm> : null}
            {doc.periodLabel ? <DetailTerm label="Period">{doc.periodLabel}</DetailTerm> : null}
            {doc.reviewedBy ? <DetailTerm label="Reviewed by">{doc.reviewedBy}{doc.reviewedAt ? ` · ${formatDate(doc.reviewedAt)}` : ""}</DetailTerm> : null}
          </dl>
        </section>
        <section className="card space-y-3 p-4"><h2 className="font-semibold">Checklist request</h2>
          {linked.length ? linked.map((item) => <div key={item.id} className="space-y-2 text-sm"><Link href={`/portal/${token}/checklist/${item.id}`} className="font-medium text-brand underline">{item.groupLabel ? `${item.groupLabel} · ` : ""}{item.title}</Link><div><StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} /></div></div>) : <div><p className="text-sm font-medium">{context.summary}</p><p className="mt-1 text-xs text-muted">This request is no longer on the active checklist. The file remains in the submission history.</p></div>}
        </section>
        <section className="card p-4"><h2 className="font-semibold">Submission history</h2><p className="mt-1 text-xs text-muted">Newest submission first.</p>
          <div className="mt-3 divide-y divide-line">{related.map((item, index) => <Link key={item.id} href={`/portal/${token}/documents/${item.id}`} aria-current={item.id === doc.id ? "page" : undefined} className="block py-3 text-sm first:pt-0 last:pb-0"><span className="flex items-start justify-between gap-2"><span className={item.id === doc.id ? "font-semibold text-brand" : "font-medium"}>{index === 0 ? "Current" : `Previous ${index}`}</span><span className="text-xs text-muted">{formatDate(item.uploadedAt)}</span></span><span className="mt-1 block break-words text-xs text-muted">{item.filename} · {DOCUMENT_STATUS_LABEL[item.status]}</span></Link>)}</div>
        </section>
        <Link href={`/matters/${token}/documents/${doc.id}`} className="inline-block text-sm text-brand underline">Demo: view as attorney</Link>
      </aside>
    </div>
  </div>;
}

function DetailTerm({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt><dd className="mt-0.5 break-words">{children}</dd></div>;
}
