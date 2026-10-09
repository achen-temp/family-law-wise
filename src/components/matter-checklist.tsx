"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomRequestDialog, RequestDialog } from "@/components/request-dialog";
import { Button, PageHeader, StatusPill } from "@/components/ui";
import { CHECKLIST_SECTIONS } from "@/lib/content";
import { REQUIREMENT_LABEL, currentDocuments, matterTitle, sectionLabel, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Requirement } from "@/lib/types";

export function MatterChecklist({ matterId }: { matterId: string }) {
  const store = useStore();
  const matter = store.state.matters.find((item) => item.id === matterId);
  const [showClosed, setShowClosed] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);

  useEffect(() => {
    const id = window.location.hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, []);

  if (!matter) {
    return <p className="text-sm text-muted">Matter not found.</p>;
  }

  const requirements = store.state.requirements.filter((item) => item.matterId === matterId);
  const progress = stats(requirements);

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Checklist"
        description={`${progress.accepted} of ${progress.total} requirements accepted. A file can satisfy more than one requirement, and a requirement can have no file yet.`}
        actions={
          <>
            <Button onClick={() => setShowClosed((value) => !value)}>{showClosed ? "Hide closed" : "Show not applicable"}</Button>
            <Button onClick={() => setCustomOpen(true)}>Add request</Button>
            <Button variant="primary" onClick={() => setRequestOpen(true)}>
              Request missing
            </Button>
          </>
        }
      />
      <div className="space-y-6">
        {CHECKLIST_SECTIONS.map((section) => {
          const items = requirements.filter((item) => {
            if (item.section !== section) return false;
            if (showClosed) return true;
            return item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED";
          });
          if (items.length === 0) return null;
          const groups = groupItems(items);
          return (
            <section key={section} id={`section-${section}`} className="scroll-mt-6">
              <h2 className="mb-2 text-sm font-semibold">{sectionLabel(section)}</h2>
              <div className="card divide-y divide-line">
                {groups.map(([group, rows]) => (
                  <div key={group || section}>
                    {group ? <p className="bg-[#f4f7fd] px-4 py-2 text-xs font-medium text-muted">{group}</p> : null}
                    {rows.map((item) => (
                      <RequirementRow key={item.id} item={item} matterId={matterId} />
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {requestOpen ? (
        <RequestDialog matterId={matterId} open items={requirements} onClose={() => setRequestOpen(false)} />
      ) : null}
      {customOpen ? <CustomRequestDialog matterId={matterId} open onClose={() => setCustomOpen(false)} /> : null}
    </div>
  );
}

function RequirementRow({ item, matterId }: { item: Requirement; matterId: string }) {
  const store = useStore();
  const doc = currentDocuments(store.state.documents, item.id)[0];
  return (
    <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium">{item.title}</p>
          <StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted">{item.reason}</p>
        {item.status === "NOT_AVAILABLE" ? (
          <p className="mt-2 text-xs text-stone-700">
            {item.unavailableReason}
            {item.unavailableNote ? ` — ${item.unavailableNote}` : ""}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1">
        {doc ? (
          <Link href={`/matters/${matterId}/documents/${doc.id}`} className="btn btn-secondary h-8 px-2.5 text-xs">
            Review
          </Link>
        ) : null}
        {item.status !== "WAIVED" && item.status !== "ACCEPTED" ? (
          <Button className="h-8 px-2.5 text-xs" onClick={() => store.setRequirementStatus(item.id, "WAIVED")}>
            Waive
          </Button>
        ) : null}
        {item.status !== "NOT_APPLICABLE" && item.status !== "ACCEPTED" ? (
          <Button className="h-8 px-2.5 text-xs" onClick={() => store.setRequirementStatus(item.id, "NOT_APPLICABLE")}>
            N/A
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function groupItems(items: Requirement[]) {
  const map = new Map<string, Requirement[]>();
  for (const item of items) {
    const key = item.groupLabel ?? "";
    map.set(key, [...(map.get(key) ?? []), item]);
  }
  return [...map.entries()];
}
