"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Box, Button, Chip, Divider, Paper, Stack, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TextField, Typography,
} from "@mui/material";
import { RequestDialog } from "@/components/request-dialog";
import { PageHeader, StackedBar } from "@/components/ui";
import { OVERVIEW_ROWS } from "@/lib/content";
import { MATTER_LABEL, REQUIREMENT_LABEL, clientParty, formatDate, matterTitle, personName, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Intake, MatterStatus, Requirement, SectionId } from "@/lib/types";

function matterColor(status: MatterStatus) {
  return status === "COMPLETE" ? "success" : ["CLIENT_SUBMITTED", "ATTORNEY_REVIEW", "WAITING_FOR_CLIENT"].includes(status) ? "warning" : "default";
}

export function MatterOverview({ matterId }: { matterId: string }) {
  const store = useStore();
  const matter = store.state.matters.find((item) => item.id === matterId);
  const [requestOpen, setRequestOpen] = useState(false);
  if (!matter) return <Missing />;

  const requirements = store.state.requirements.filter((item) => item.matterId === matterId);
  const progress = stats(requirements);
  const intake = store.state.intakes[matterId];
  const attention = requirements.filter((item) => ["MISSING", "REQUESTED", "NEEDS_REVIEW", "NOT_AVAILABLE"].includes(item.status));
  const discovery = store.state.discoveries.find((item) => item.matterId === matterId && item.state === "open");
  const activity = store.state.activity.filter((item) => item.matterId === matterId).slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow={matter.matterType} title={matterTitle(matter)}
        description={`${personName(clientParty(matter))} · ${matter.county} County, ${matter.state} · NJ Divorce Financial Disclosure`}
        actions={<Stack direction="row" useFlexGap spacing={1.5} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <Chip label={MATTER_LABEL[matter.status]} color={matterColor(matter.status)} />
          <Button variant="contained" onClick={() => setRequestOpen(true)} disabled={progress.missing + progress.unavailable === 0}>Request missing documents</Button>
        </Stack>}
      />
      <StatusBanner key={matterId} matterId={matterId} />
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1fr) 320px" }, gap: 3, alignItems: "start" }}>
        <Paper component="section" variant="outlined" aria-labelledby="collection-title" sx={{ minWidth: 0, overflow: "hidden" }}>
          <Box sx={{ p: 2.5 }}>
            <Stack direction="row" spacing={2} sx={{ alignItems: "start", justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography id="collection-title" component="h2" variant="h2">Collection</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{progress.accepted} accepted · {progress.review} in review · {progress.missing} missing{progress.unavailable ? ` · ${progress.unavailable} unavailable` : ""}</Typography>
              </Box>
              <Typography sx={{ fontSize: 24, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{progress.pct}%</Typography>
            </Stack>
            <Box sx={{ mt: 2 }}><StackedBar {...progress} /></Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Progress counts requirements, not files. Accepted materials do not confirm financial facts.</Typography>
          </Box>
          <TableContainer role="region" aria-label="Collection by category" tabIndex={0} sx={{ "&:focus-visible": { outline: "2px solid var(--focus-ring)", outlineOffset: -2 } }}>
            <Table size="small" sx={{ minWidth: 460, tableLayout: "fixed" }}>
              <caption className="sr-only">Collection requirements by category. Open a category to view its checklist.</caption>
              <TableHead><TableRow>
                <TableCell sx={{ width: "36%" }}>Category</TableCell>
                <TableCell sx={{ width: "36%" }}>Collection</TableCell>
                <TableCell sx={{ width: "28%" }}>Status</TableCell>
              </TableRow></TableHead>
              <TableBody>{OVERVIEW_ROWS.map((row) => {
                const sectionReqs = requirements.filter((item) => item.section === row.id);
                const sectionStats = stats(sectionReqs);
                return <TableRow key={row.id} hover sx={{ "&:last-child td, &:last-child th": { borderBottom: 0 } }}>
                  <TableCell component="th" scope="row" sx={{ py: 2, overflowWrap: "anywhere" }}>
                    <Button component={Link} href={`/matters/${matterId}/checklist#section-${row.id}`} variant="text" sx={{ minWidth: 0, p: 0, textAlign: "left", justifyContent: "flex-start", color: "primary.main" }}>{row.label}</Button>
                  </TableCell>
                  <TableCell sx={{ py: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontVariantNumeric: "tabular-nums" }}>{sectionStats.accepted} / {sectionStats.total} accepted</Typography>
                    <StackedBar {...sectionStats} />
                  </TableCell>
                  <TableCell sx={{ py: 2, overflowWrap: "anywhere" }}><Typography variant="body2" color="text.secondary">{sectionTone(sectionReqs, intake, row.id)}</Typography></TableCell>
                </TableRow>;
              })}</TableBody>
            </Table>
          </TableContainer>
          <Divider />
          <Box sx={{ px: 2, py: 1 }}><Button component={Link} href={`/matters/${matterId}/checklist`}>View full checklist</Button></Box>
        </Paper>

        <Stack component="aside" aria-label="Attention and activity" spacing={2} sx={{ minWidth: 0 }}>
          <Paper component="section" variant="outlined" aria-labelledby="attention-title" sx={{ p: 2 }}>
            <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", alignItems: "center" }}>
              <Typography id="attention-title" component="h2" variant="h2">Needs attention</Typography><Chip label={attention.length} aria-label={`${attention.length} items need attention`} />
            </Stack>
            {attention.length === 0 ? <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>The checklist is clear.</Typography> : <Box component="ul" sx={{ listStyle: "none", p: 0, my: 1 }}>
              {attention.slice(0, 8).map((item) => <Box component="li" key={item.id} sx={{ borderBottom: "1px solid", borderColor: "divider", "&:last-child": { borderBottom: 0 } }}>
                <Button component={Link} href={attentionHref(matterId, item)} sx={{ display: "block", width: "100%", textAlign: "left", px: 0.5, py: 1.25, overflowWrap: "anywhere" }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{item.groupLabel || item.title}</Typography>
                  {item.groupLabel ? <Typography variant="body2" color="text.secondary">{item.title}</Typography> : null}
                  <Typography variant="body2" sx={{ color: item.status === "NEEDS_REVIEW" ? "warning.main" : "text.secondary", mt: 0.5 }}>{item.status === "NOT_AVAILABLE" ? "Client says unavailable" : REQUIREMENT_LABEL[item.status]}</Typography>
                </Button>
              </Box>)}
            </Box>}
            {attention.length > 8 ? <Button component={Link} href={`/matters/${matterId}/checklist`}>View all {attention.length} items</Button> : null}
          </Paper>

          {discovery ? <Paper component="section" variant="outlined" aria-labelledby="possible-title" sx={{ p: 2, borderColor: "warning.main", bgcolor: "var(--review-bg)" }}>
            <Chip label="Possible · needs review" color="warning" sx={{ mb: 1 }} />
            <Typography id="possible-title" component="h2" variant="h2" sx={{ overflowWrap: "anywhere" }}>{discovery.title}</Typography>
            <Typography variant="body1" sx={{ mt: 1, overflowWrap: "anywhere" }}>{discovery.detail}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, overflowWrap: "anywhere" }}>Source: {discovery.sourceLabel}. This is not a confirmed fact.</Typography>
            <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
              <Button variant="contained" onClick={() => store.resolveDiscovery(discovery.id, "ask")}>Ask client</Button>
              <Button variant="outlined" onClick={() => store.resolveDiscovery(discovery.id, "dismiss")}>Dismiss</Button>
            </Stack>
          </Paper> : null}

          <Paper component="section" variant="outlined" aria-labelledby="activity-title" sx={{ p: 2 }}>
            <Typography id="activity-title" component="h2" variant="h2">Recent activity</Typography>
            <Box component="ul" sx={{ listStyle: "none", p: 0, my: 2, display: "grid", gap: 2 }}>
              {activity.map((item) => <Box component="li" key={item.id} sx={{ overflowWrap: "anywhere" }}>
                <Typography component="time" dateTime={item.at} variant="body2" color="text.secondary">{formatDate(item.at)}</Typography>
                <Typography variant="body1" sx={{ mt: 0.5 }}>{item.text}</Typography>
              </Box>)}
              {activity.length === 0 ? <Typography component="li" variant="body2" color="text.secondary">No activity yet.</Typography> : null}
            </Box>
            <Button component={Link} href={`/matters/${matterId}/activity`}>View all activity</Button>
          </Paper>
        </Stack>
      </Box>
      {requestOpen ? <RequestDialog matterId={matterId} open items={requirements} onClose={() => setRequestOpen(false)} /> : null}
    </div>
  );
}

function StatusBanner({ matterId }: { matterId: string }) {
  const store = useStore();
  const [confirming, setConfirming] = useState(false);
  const [prepared, setPrepared] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const matter = store.state.matters.find((item) => item.id === matterId);
  if (!matter) return null;
  if (matter.status === "DRAFT" || matter.status === "INVITED") {
    const client = clientParty(matter);
    const link = `/invite/${encodeURIComponent(matter.id)}`;
    const ready = matter.status === "INVITED" || prepared;
    async function copyInvitation() {
      const url = `${window.location.origin}${link}`;
      setInvitationUrl(url);
      try {
        await navigator.clipboard.writeText(url);
        setCopyMessage("Invitation link copied. No email was sent.");
      } catch {
        setCopyMessage("Clipboard unavailable. Select and copy the invitation link below.");
      }
    }
    return <Paper component="section" variant="outlined" aria-label="Client invitation" sx={{ p: 2, mb: 3 }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h2" variant="h2">{ready ? "Demo invitation prepared" : "Prepare a client invitation"}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{ready ? "The demo link is ready to copy or open. No email was sent." : "Confirm the intended recipient before preparing the demo link. No email will be sent."}</Typography>
        </Box>
        {!confirming ? ready ? <Stack direction="row" useFlexGap spacing={1} sx={{ alignSelf: "start", flexShrink: 0, flexWrap: "wrap" }}>
          <Button variant="outlined" onClick={copyInvitation}>Copy invitation link</Button>
          <Button component={Link} href={link} variant="contained">Open client invitation</Button>
        </Stack> : <Button variant="contained" sx={{ alignSelf: "start", flexShrink: 0 }} onClick={() => setConfirming(true)}>Prepare demo invitation</Button> : null}
      </Stack>
      {confirming ? <Box sx={{ mt: 2, p: 2, bgcolor: "var(--primary-soft)", borderRadius: 1, overflowWrap: "anywhere" }}>
        <Typography sx={{ fontWeight: 600 }}>Confirm invitation recipient</Typography>
        <Typography sx={{ mt: 1 }}>{personName(client)}</Typography>
        <Typography color="text.secondary">{client?.email || "No email on file"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{matterTitle(matter)} · {store.state.firm.name}</Typography>
        <Stack direction="row" useFlexGap spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
          <Button variant="contained" onClick={() => { store.sendInvitation(matterId); setPrepared(true); setConfirming(false); }}>Confirm and prepare demo invitation</Button>
          <Button variant="outlined" onClick={() => setConfirming(false)}>Cancel</Button>
        </Stack>
      </Box> : ready && !invitationUrl ? <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, overflowWrap: "anywhere" }}>Demo invitation: {link}</Typography> : null}
      {invitationUrl ? <TextField label="Invitation link — select to copy manually" multiline minRows={2} value={invitationUrl} sx={{ mt: 2 }} slotProps={{ input: { readOnly: true } }} onFocus={(event) => event.target.select()} /> : null}
      {copyMessage || prepared ? <Typography role="status" variant="body2" color="primary" sx={{ mt: 1.5 }}>{copyMessage || "Demo invitation prepared. No email was sent."}</Typography> : null}
    </Paper>;
  }
  const reviewing = matter.status === "CLIENT_SUBMITTED" || matter.status === "ATTORNEY_REVIEW";
  return <Paper component="section" variant="outlined" aria-label="Collection status" sx={{ p: 2, mb: 3 }}>
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}>
      <Box sx={{ minWidth: 0 }}>
        <Typography component="h2" variant="h2">{matter.status === "COMPLETE" ? "Collection complete" : reviewing ? "Ready for attorney review" : matter.status === "WAITING_FOR_CLIENT" ? "Waiting on the client" : "Collection in progress"}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{matter.status === "COMPLETE"
          ? "Collection is complete. Accepted documents stay on the file."
          : matter.status === "CLIENT_SUBMITTED" ? "The client says they have provided everything requested. Review before closing the file."
          : matter.status === "ATTORNEY_REVIEW" ? "Uploads are waiting for a decision. Accepting a document updates the checklist."
          : matter.status === "WAITING_FOR_CLIENT" ? "The client has been asked for more information. Track outstanding requirements below."
          : "The client is completing their questionnaire and providing documents."}</Typography>
      </Box>
      {reviewing ? <Stack direction="row" useFlexGap spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
        <Button variant="outlined" onClick={() => store.returnToClient(matterId)}>Return to client</Button>
        <Button variant="outlined" onClick={() => store.markComplete(matterId)}>Mark collection complete</Button>
      </Stack> : null}
    </Stack>
  </Paper>;
}

function sectionTone(requirements: Requirement[], intake: Intake | undefined, section: SectionId) {
  const applicable = requirements.filter((item) => item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED");
  if (applicable.length === 0) {
    const reportedNone = noneReported(intake, section);
    if (reportedNone === true) return "None reported";
    if (reportedNone === false) return "Not started";
    return "Not started";
  }
  const progress = stats(applicable);
  if (progress.missing > 0) return `${progress.missing} missing`;
  if (progress.review > 0) return "Review";
  if (progress.unavailable > 0) return "Unavailable";
  if (progress.accepted === progress.total) return "Complete";
  return `${progress.accepted} / ${progress.total}`;
}

function noneReported(intake: Intake | undefined, section: SectionId) {
  if (!intake) return false;
  if (section === "bank") return intake.bank.hasAccounts === false ? true : intake.bank.hasAccounts === null ? false : null;
  if (section === "investments") return intake.investments.has === false ? true : intake.investments.has === null ? false : null;
  if (section === "retirement") return intake.retirement.has === false ? true : intake.retirement.has === null ? false : null;
  if (section === "real_estate") return intake.realEstate.owns === false ? true : intake.realEstate.owns === null ? false : null;
  if (section === "credit") return intake.debts.hasCards === false ? true : intake.debts.hasCards === null ? false : null;
  if (section === "loans") return intake.debts.hasLoans === false ? true : intake.debts.hasLoans === null ? false : null;
  if (section === "insurance") return intake.insurance.hasLife === false ? true : intake.insurance.hasLife === null ? false : null;
  if (section === "business") return intake.business.has === false ? true : intake.business.has === null ? false : null;
  return null;
}

function attentionHref(matterId: string, item: Requirement) {
  if (item.status === "NEEDS_REVIEW") return `/matters/${matterId}/documents`;
  return `/matters/${matterId}/checklist#section-${item.section}`;
}

function Missing() {
  return <Paper variant="outlined" sx={{ p: 4 }}>
    <Typography component="h1" variant="h2">Matter not found</Typography>
    <Button component={Link} href="/matters" variant="outlined" sx={{ mt: 2 }}>Back to matters</Button>
  </Paper>;
}
