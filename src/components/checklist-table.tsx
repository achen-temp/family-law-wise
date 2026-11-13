"use client";

import { Box, Chip, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import type { ReactNode } from "react";
import { latestDocument } from "@/lib/document-selectors";
import { REQUIREMENT_LABEL, sectionLabel } from "@/lib/format";
import type { DocumentFile, Requirement, SectionId } from "@/lib/types";

export function ChecklistStatus({ item, documents = [], label }: { item: Requirement; documents?: DocumentFile[]; label?: string }) {
  const returned = item.status === "MISSING" && latestDocument(documents, item.id)?.status === "REJECTED";
  const color = item.status === "ACCEPTED" ? "success" : item.status === "MISSING" ? "error" : ["UPLOADED", "NEEDS_REVIEW", "REQUESTED"].includes(item.status) ? "warning" : "default";
  return <Chip size="small" label={label || (returned ? "Returned / Missing" : REQUIREMENT_LABEL[item.status])} color={color} sx={{ height: "auto", minHeight: 24, maxWidth: "100%", "& .MuiChip-label": { whiteSpace: "normal", py: 0.25 } }} />;
}

export function ChecklistTable({ section, items, documents, actions }: { section: SectionId; items: Requirement[]; documents: DocumentFile[]; actions: (item: Requirement) => ReactNode }) {
  const groups = new Map<string, Requirement[]>();
  for (const item of items) { const key = item.groupLabel || ""; groups.set(key, [...(groups.get(key) || []), item]); }
  return <Paper component="section" variant="outlined" id={`section-${section}`} aria-labelledby={`checklist-heading-${section}`} sx={{ minWidth: 0, overflow: "hidden", scrollMarginTop: 112 }}>
    <Typography component="h2" variant="h2" id={`checklist-heading-${section}`} sx={{ px: 2, py: 2 }}>{sectionLabel(section)}</Typography>
    <TableContainer role="region" aria-label={`${sectionLabel(section)} requirements`} tabIndex={0} sx={{ "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: -2 } }}>
      <Table size="small" sx={{ minWidth: 720, tableLayout: "fixed" }}>
        <caption className="sr-only">{sectionLabel(section)}. Each requirement and period has its own status and action.</caption>
        <TableHead><TableRow><TableCell sx={{ width: "42%" }}>Requirement</TableCell><TableCell sx={{ width: "16%" }}>Period</TableCell><TableCell sx={{ width: "18%" }}>Status</TableCell><TableCell sx={{ width: "24%" }}>Action</TableCell></TableRow></TableHead>
        <TableBody>{[...groups.entries()].map(([group, rows]) => <Group key={group} group={group} items={rows} documents={documents} actions={actions} />)}</TableBody>
      </Table>
    </TableContainer>
  </Paper>;
}

function Group({ group, items, documents, actions }: { group: string; items: Requirement[]; documents: DocumentFile[]; actions: (item: Requirement) => ReactNode }) {
  return <>
    {group ? <TableRow><TableCell colSpan={4} sx={{ bgcolor: "var(--surface-subtle)", fontWeight: 600, overflowWrap: "anywhere" }}>{group}</TableCell></TableRow> : null}
    {items.map((item) => {
      const latest = latestDocument(documents, item.id);
      const returned = item.status === "MISSING" && latest?.status === "REJECTED";
      return <TableRow key={item.id} sx={{ verticalAlign: "top" }}>
        <TableCell component="th" scope="row" aria-label={group ? `${group} · ${item.title}` : item.title} sx={{ py: 2, overflowWrap: "anywhere" }}>
          <Typography sx={{ fontWeight: 500 }}>{item.title}</Typography>
          <Box component="details" sx={{ mt: 1, "& summary": { cursor: "pointer", color: "text.secondary", fontSize: 12 }, "& p": { mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" } }}>
            <summary>Reason and details</summary>
            <Typography variant="body2">{item.reason}</Typography>
            {item.description ? <Typography variant="body2">{item.description}</Typography> : null}
          </Box>
          {item.status === "NOT_AVAILABLE" ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>Client says unavailable: {item.unavailableReason}{item.unavailableNote ? ` — ${item.unavailableNote}` : ""}</Typography> : null}
          {returned ? <Typography variant="body2" color="error" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>Returned: {latest.rejectNote || "Review the returned file details."}</Typography> : null}
        </TableCell>
        <TableCell sx={{ py: 2, overflowWrap: "anywhere" }}>{item.periodLabel || "—"}</TableCell>
        <TableCell sx={{ py: 2 }}><ChecklistStatus item={item} documents={documents} /></TableCell>
        <TableCell sx={{ py: 2 }}><Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{actions(item)}</Box></TableCell>
      </TableRow>;
    })}
  </>;
}
