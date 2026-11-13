"use client";

import { useId, useState, type FormEvent, type ReactNode } from "react";
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, TextField, Typography } from "@mui/material";
import { ChecklistStatus } from "@/components/checklist-table";
import { useStore } from "@/lib/store";
import type { Requirement } from "@/lib/types";

function RequestWindow({ title, open, onClose, onSubmit, children, actions }: { title: string; open: boolean; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; children: ReactNode; actions: ReactNode }) {
  const titleId = useId();
  return <Dialog open={open} onClose={onClose} aria-labelledby={titleId} fullWidth maxWidth="sm" transitionDuration={0} slotProps={{ paper: { sx: { m: 2, width: "calc(100% - 32px)", maxHeight: "min(720px, calc(100dvh - 32px))" } } }}>
    <Box component="form" noValidate onSubmit={onSubmit} sx={{ display: "flex", flexDirection: "column", minHeight: 0, maxHeight: "inherit", overflow: "hidden" }}>
      <DialogTitle component="div" id={`${titleId}-bar`} sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 2, p: 2.5 }}>
        <Typography component="h2" variant="h2" id={titleId}>{title}</Typography><Button type="button" size="small" autoFocus onClick={onClose}>Close</Button>
      </DialogTitle>
      <DialogContent dividers sx={{ p: 2.5, overflowWrap: "anywhere" }}>{children}</DialogContent>
      <DialogActions sx={{ p: 2, gap: 1, flexWrap: "wrap", flexShrink: 0 }}>{actions}</DialogActions>
    </Box>
  </Dialog>;
}

export function RequestDialog({ matterId, open, onClose, items }: { matterId: string; open: boolean; onClose: () => void; items: Requirement[] }) {
  const { requestDocuments, state } = useStore();
  const candidates = items.filter((item) => item.status === "MISSING" || item.status === "REQUESTED" || item.status === "NOT_AVAILABLE");
  const [selected, setSelected] = useState<string[]>(candidates.filter((item) => item.status !== "NOT_AVAILABLE").map((item) => item.id));
  const [message, setMessage] = useState("We still need the following documents to complete your financial disclosure.");
  function toggle(id: string) { setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]); }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selected.length === 0) return;
    requestDocuments(matterId, selected, message);
    onClose();
  }
  return <RequestWindow title="Request documents" open={open} onClose={onClose} onSubmit={submit} actions={<>
    <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={selected.length === 0}>Send one request</Button>
  </>}>
    <Typography color="text.secondary">The selected items are combined into one client request. This demo does not send email.</Typography>
    <Typography role="status" variant="body2" color="text.secondary" sx={{ mt: 1 }}>{selected.length} selected of {candidates.length}</Typography>
    <Box component="ul" sx={{ listStyle: "none", p: 0, my: 2 }}>
      {candidates.length === 0 ? <Typography component="li" color="text.secondary">Nothing is missing right now.</Typography> : candidates.map((item) => <Box component="li" key={item.id} sx={{ borderBottom: "1px solid", borderColor: "divider", py: 1 }}>
        <FormControlLabel sx={{ m: 0, width: "100%", alignItems: "start", "& .MuiFormControlLabel-label": { minWidth: 0 } }} control={<Checkbox checked={selected.includes(item.id)} onChange={() => toggle(item.id)} />} label={<Box sx={{ pt: 1, overflowWrap: "anywhere" }}>
          <Typography sx={{ fontWeight: 500 }}>{item.groupLabel ? `${item.groupLabel} · ` : ""}{item.title}</Typography>
          {item.periodLabel ? <Typography variant="body2" color="text.secondary">{item.periodLabel}</Typography> : null}
          <Box sx={{ mt: 0.5 }}><ChecklistStatus item={item} documents={state.documents} label={item.status === "NOT_AVAILABLE" ? "Client says unavailable" : undefined} /></Box>
        </Box>} />
      </Box>)}
    </Box>
    <TextField label="Message" multiline minRows={3} fullWidth value={message} onChange={(event) => setMessage(event.target.value)} />
  </RequestWindow>;
}

export function CustomRequestDialog({ matterId, open, onClose }: { matterId: string; open: boolean; onClose: () => void }) {
  const { addCustomRequest } = useStore();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    addCustomRequest(matterId, title, description);
    setTitle(""); setDescription(""); onClose();
  }
  return <RequestWindow title="Add a request" open={open} onClose={onClose} onSubmit={submit} actions={<>
    <Button type="button" variant="outlined" onClick={onClose}>Cancel</Button><Button type="submit" variant="contained" disabled={!title.trim()}>Add to checklist</Button>
  </>}>
    <Box sx={{ display: "grid", gap: 3, pt: 1 }}>
      <TextField label="Title" required fullWidth helperText="Shown to the client as a checklist item." value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Venmo transaction history" />
      <TextField label="Description" fullWidth multiline minRows={3} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Please provide Venmo history from January through September 2026." />
    </Box>
  </RequestWindow>;
}
