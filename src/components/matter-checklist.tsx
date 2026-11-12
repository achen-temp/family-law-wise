"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CustomRequestDialog, RequestDialog } from "@/components/request-dialog";
import { Button, Box } from "@mui/material";
import { PageHeader } from "@/components/ui";
import { ChecklistTable } from "@/components/checklist-table";
import { latestDocument } from "@/lib/document-selectors";
import { CHECKLIST_SECTIONS } from "@/lib/content";
import { currentDocuments, matterTitle, stats } from "@/lib/format";
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
            <Button variant="outlined" onClick={() => setShowClosed((value) => !value)}>{showClosed ? "Hide closed" : "Show not applicable"}</Button>
            <Button variant="outlined" onClick={() => setCustomOpen(true)}>Add request</Button>
            <Button variant="contained" onClick={() => setRequestOpen(true)}>
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
          return <ChecklistTable key={section} section={section} items={items} documents={store.state.documents} actions={(item) => <RequirementActions item={item} matterId={matterId} />} />;
        })}
      </div>
      {requestOpen ? (
        <RequestDialog matterId={matterId} open items={requirements} onClose={() => setRequestOpen(false)} />
      ) : null}
      {customOpen ? <CustomRequestDialog matterId={matterId} open onClose={() => setCustomOpen(false)} /> : null}
    </div>
  );
}

function RequirementActions({ item, matterId }: { item: Requirement; matterId: string }) {
  const store = useStore();
  const doc = currentDocuments(store.state.documents, item.id)[0];
  const latest = latestDocument(store.state.documents, item.id);
  const reviewDoc = doc || (item.status === "MISSING" && latest?.status === "REJECTED" ? latest : undefined);
  return (
    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {reviewDoc ? (
          <Button component={Link} variant="outlined" size="small" href={`/matters/${matterId}/documents/${reviewDoc.id}`}>
            Review
          </Button>
        ) : null}
        {item.status !== "WAIVED" && item.status !== "ACCEPTED" ? (
          <Button variant="outlined" size="small" onClick={() => store.setRequirementStatus(item.id, "WAIVED")}>
            Waive
          </Button>
        ) : null}
        {item.status !== "NOT_APPLICABLE" && item.status !== "ACCEPTED" ? (
          <Button variant="outlined" size="small" onClick={() => store.setRequirementStatus(item.id, "NOT_APPLICABLE")}>
            N/A
          </Button>
        ) : null}
    </Box>
  );
}
