import Link from "next/link";
import { FileText, Search } from "lucide-react";
import { StatusPill } from "@/components/ui";
import { documentSourceLabel, documentVersions, linkedRequirementContext } from "@/lib/document-view";
import { formatDate, matterTitle } from "@/lib/format";
import type { DocumentFile, DocumentStatus, Matter, Requirement } from "@/lib/types";

export const DOCUMENT_STATUS_LABEL: Record<DocumentStatus, string> = {
  NEEDS_REVIEW: "Needs review",
  ACCEPTED: "Accepted",
  REJECTED: "Returned",
  REPLACED: "Replaced",
};

export type DocumentFilter = DocumentStatus | "ALL";

export function DocumentToolbar({
  query,
  onQueryChange,
  filter,
  onFilterChange,
}: {
  query: string;
  onQueryChange: (query: string) => void;
  filter: DocumentFilter;
  onFilterChange: (filter: DocumentFilter) => void;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search files, clients, matters, or requests</span>
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          className="field w-full pl-9"
          placeholder="Search files, clients, matters, or requests"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
        />
      </label>
      <select
        aria-label="Filter by review status"
        className="field w-full sm:w-44"
        value={filter}
        onChange={(event) => onFilterChange(event.target.value as DocumentFilter)}
      >
        <option value="ALL">All statuses</option>
        {Object.entries(DOCUMENT_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
  );
}

export function DocumentTable({
  documents,
  versionDocuments = documents,
  matters,
  requirements,
  hrefFor,
  showMatter = false,
  matterName,
  emptyMessage = "No files match this view.",
}: {
  documents: DocumentFile[];
  versionDocuments?: DocumentFile[];
  matters: Matter[];
  requirements: Requirement[];
  hrefFor: (document: DocumentFile) => string;
  showMatter?: boolean;
  matterName?: string;
  emptyMessage?: string;
}) {
  const versions = documentVersions(versionDocuments);

  if (!documents.length) {
    return <div className="card px-5 py-12 text-center"><p className="text-sm font-medium">No files to show</p><p className="mt-1 text-sm text-muted">{emptyMessage}</p></div>;
  }

  return (
    <div className="card overflow-x-auto" role="region" aria-label={matterName ? `${matterName} documents` : "Documents table"} tabIndex={0}>
      <table className="w-full min-w-[880px] table-fixed text-left">
        {matterName && <caption className="sr-only">{matterName} documents, newest uploads first</caption>}
        <thead className="border-b border-line bg-surface-subtle text-xs font-medium uppercase tracking-wide text-muted">
          {matterName ? <tr>
            <th scope="col" className="w-[32%] px-4 py-3">File</th>
            <th scope="col" className="w-[21%] px-4 py-3">Institution / period</th>
            <th scope="col" className="w-[15%] px-4 py-3">Owner</th>
            <th scope="col" className="w-[15%] px-4 py-3">Status</th>
            <th scope="col" className="w-[17%] px-4 py-3">Uploaded</th>
          </tr> : <tr>
            <th className={showMatter ? "w-[25%] px-4 py-3" : "w-[28%] px-4 py-3"}>File</th>
            {showMatter ? <th className="w-[18%] px-4 py-3">Client / matter</th> : null}
            <th className={showMatter ? "w-[22%] px-4 py-3" : "w-[28%] px-4 py-3"}>Checklist request</th>
            {!showMatter ? <th className="w-[12%] px-4 py-3">Version</th> : null}
            <th className="w-[13%] px-4 py-3">Source</th>
            <th className="w-[13%] px-4 py-3">Submitted</th>
            <th className="w-[13%] px-4 py-3">Status</th>
          </tr>}
        </thead>
        <tbody className="divide-y divide-line">
          {documents.map((document) => {
            const matter = matters.find((item) => item.id === document.matterId);
            const context = linkedRequirementContext(document, requirements);
            const version = versions.get(document.id);
            const versionInfo = (
              <>
                <span className="font-medium">{version?.current ? "Current" : `Previous ${version?.position ?? ""}`}</span>
                {version && version.total > 1 && <span className="block text-xs text-muted">{version.total} submissions</span>}
              </>
            );
            return (
              <tr key={document.id} className="group relative hover:bg-surface-subtle focus-within:bg-primary-soft">
                <td className="px-4 py-3 align-top">
                  <Link href={hrefFor(document)} title={document.filename} className={`flex min-w-0 gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand ${matterName ? "after:absolute after:inset-0" : ""}`}>
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand"><FileText className="size-4" /></span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-medium text-foreground group-hover:text-brand ${matterName ? "line-clamp-2 [overflow-wrap:anywhere]" : "truncate"}`}>{document.filename}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted">{document.documentType}{!matterName && document.institution ? ` · ${document.institution}` : ""}</span>
                    </span>
                  </Link>
                  {matterName && (
                    <p className="mt-1 text-xs text-muted [overflow-wrap:anywhere]">
                      <span className="sr-only">Checklist request: </span>{context.summary}
                    </p>
                  )}
                </td>
                {matterName ? <>
                  <td className="px-4 py-3 align-top text-sm [overflow-wrap:anywhere]">
                    {document.institution || "—"}
                    {document.periodLabel && <span className="block text-xs text-muted">{document.periodLabel}</span>}
                  </td>
                  <td className="px-4 py-3 align-top text-sm [overflow-wrap:anywhere]">{document.owner}</td>
                  <td className="px-4 py-3 align-top">
                    <DocumentStatusPill status={document.status} />
                    <div className="mt-1 text-xs text-muted">{versionInfo}</div>
                  </td>
                </> : <>
                  {showMatter ? <td className="px-4 py-3 align-top text-sm"><span className="block truncate font-medium">{document.owner}</span><span className="block truncate text-xs text-muted">{matter ? matterTitle(matter) : document.matterId}</span></td> : null}
                  <td className="px-4 py-3 align-top text-sm"><span className={context.removed ? "text-muted" : ""}>{context.summary}</span></td>
                  {!showMatter ? <td className="px-4 py-3 align-top text-sm">{versionInfo}</td> : null}
                  <td className="px-4 py-3 align-top text-sm">{documentSourceLabel(document)}</td>
                </>}
                <td className="px-4 py-3 align-top text-sm">
                  <span className="block">{formatDate(document.uploadedAt)}</span>
                  <span className="block truncate text-xs text-muted" title={document.uploadedBy}>{document.uploadedBy}</span>
                  {matterName && <span className="block text-xs text-muted">{documentSourceLabel(document)}</span>}
                </td>
                {!matterName && <td className="px-4 py-3 align-top"><DocumentStatusPill status={document.status} /></td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function DocumentStatusPill({ status }: { status: DocumentStatus }) {
  if (status === "ACCEPTED") return <StatusPill status="ACCEPTED" label={DOCUMENT_STATUS_LABEL[status]} />;
  if (status === "NEEDS_REVIEW") return <StatusPill status="NEEDS_REVIEW" label={DOCUMENT_STATUS_LABEL[status]} />;
  if (status === "REJECTED") return <StatusPill status="MISSING" label={DOCUMENT_STATUS_LABEL[status]} />;
  return <StatusPill status="WAIVED" label={DOCUMENT_STATUS_LABEL[status]} />;
}
