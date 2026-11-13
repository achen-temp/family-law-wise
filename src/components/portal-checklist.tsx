"use client";

import Link from "next/link";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { PageHeader, StackedBar } from "@/components/ui";
import { ChecklistTable } from "@/components/checklist-table";
import { CHECKLIST_SECTIONS } from "@/lib/content";
import { stats } from "@/lib/format";
import { latestDocument } from "@/lib/document-selectors";
import { useStore } from "@/lib/store";

export function PortalChecklist({ token }: { token: string }) {
  const { state, submitDisclosure, dismissSubmissionReceipt } = useStore();
  const matter = state.matters.find((item) => item.id === token);
  const requirements = state.requirements.filter((item) => item.matterId === token && item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED");
  if (!matter) return null;
  const progress = stats(requirements);
  const receipt = state.submissionReceipt?.matterId === token ? state.submissionReceipt : undefined;
  const submitted = receipt && state.documents.find((doc) => doc.id === receipt.documentId && doc.matterId === token);
  const submittedFor = receipt && state.requirements.find((item) => item.id === receipt.requirementId && item.matterId === token);

  return <div>
    <PageHeader eyebrow="Your checklist" title="Documents" description="Upload what the questionnaire asked for. One file can be reused for more than one item."
      actions={matter.status !== "COMPLETE" && matter.status !== "CLIENT_SUBMITTED" ? <Button variant="contained" onClick={() => submitDisclosure(token)}>I’ve provided everything requested</Button> : null} />
    <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
      {submitted && submittedFor ? <Alert severity="success" icon={false} role="status" aria-label="Submission result" sx={{ mb: 2, overflowWrap: "anywhere" }}>
        <Typography component="h2" sx={{ fontWeight: 600 }}>{receipt.kind === "UPLOAD" ? "File submitted successfully" : "Existing file linked successfully"}</Typography>
        <Typography>{submitted.filename}</Typography>
        <Typography>For: {submittedFor.groupLabel ? `${submittedFor.groupLabel} · ` : ""}{submittedFor.title}</Typography>
        <Typography>{submitted.status === "NEEDS_REVIEW" ? "Needs review — waiting for your attorney. Submission does not mean acceptance." : submitted.status === "ACCEPTED" ? "This file already has an attorney acceptance. Linking it does not record a new review." : "The review status has changed. Open the file for the latest decision."}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>Demo session only. Refreshing resets changes.</Typography>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
          <Button component={Link} href={`/portal/${token}/documents/${submitted.id}`}>View submitted file</Button>
          <Button onClick={dismissSubmissionReceipt}>Dismiss confirmation</Button>
        </Box>
      </Alert> : null}
      {progress.review > 0 ? <Typography role="status" color="primary" sx={{ mb: 2 }}>Submitted files are waiting for attorney review. Submission does not mean acceptance.</Typography> : null}
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 1, mb: 1 }}>
        <Typography>{progress.pct}% accepted</Typography><Typography color="text.secondary">{progress.missing} still needed · {progress.review} in review</Typography>
      </Box>
      <StackedBar {...progress} />
    </Paper>
    <Box sx={{ display: "grid", gap: 3 }}>
      {CHECKLIST_SECTIONS.map((section) => {
        const items = requirements.filter((item) => item.section === section);
        if (!items.length) return null;
        return <ChecklistTable key={section} section={section} items={items} documents={state.documents} actions={(item) => {
          const returned = item.status === "MISSING" && latestDocument(state.documents, item.id)?.status === "REJECTED";
          const label = returned ? "Replace file" : item.status === "ACCEPTED" ? "View requirement" : ["NEEDS_REVIEW", "UPLOADED"].includes(item.status) ? "View submission" : item.status === "NOT_AVAILABLE" ? "Open explanation" : "Upload / explain";
          return <Button component={Link} variant="outlined" size="small" href={`/portal/${token}/checklist/${item.id}`}>{label}</Button>;
        }} />;
      })}
    </Box>
  </div>;
}
