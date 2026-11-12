"use client";

import { useState } from "react";
import { DocumentTable, DocumentToolbar, type DocumentFilter } from "@/components/document-table";
import { PageHeader } from "@/components/ui";
import { documentSearchText } from "@/lib/document-view";
import { matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";

export function MatterDocuments({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DocumentFilter>("ALL");
  if (!matter) return <p className="text-sm text-muted">Matter not found.</p>;

  const documents = state.documents
    .filter((doc) => doc.matterId === matterId)
    .filter((doc) => {
      if (filter !== "ALL" && doc.status !== filter) return false;
      return documentSearchText(doc, matter, state.requirements).includes(query.trim().toLowerCase());
    })
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Documents"
        description="Original files stay attached to checklist requirements. Open one to review it without downloading."
      />
      <DocumentToolbar query={query} onQueryChange={setQuery} filter={filter} onFilterChange={setFilter} />
      <p className="mb-3 text-sm text-muted" role="status">{documents.length} files in this view</p>
      <DocumentTable documents={documents} versionDocuments={state.documents.filter((doc) => doc.matterId === matterId)} matters={state.matters} requirements={state.requirements} hrefFor={(doc) => `/matters/${matterId}/documents/${doc.id}`} emptyMessage="No documents match this search and status." />
    </div>
  );
}
