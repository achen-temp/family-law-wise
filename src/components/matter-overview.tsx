"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Banknote,
  Building2,
  ChevronRight,
  CreditCard,
  FileText,
  Home,
  Landmark,
  PiggyBank,
  Shield,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { RequestDialog } from "@/components/request-dialog";
import { Button, PageHeader, StackedBar, StatusPill } from "@/components/ui";
import { OVERVIEW_ROWS } from "@/lib/content";
import {
  MATTER_LABEL,
  clientParty,
  formatDate,
  matterTitle,
  personName,
  stats,
} from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Intake, Requirement, SectionId } from "@/lib/types";

const ROW_ICON: Record<string, typeof Banknote> = {
  income: Banknote,
  tax: FileText,
  bank: Landmark,
  investments: TrendingUp,
  retirement: PiggyBank,
  real_estate: Home,
  credit: CreditCard,
  loans: Wallet,
  insurance: Shield,
  business: Building2,
};

export function MatterOverview({ matterId }: { matterId: string }) {
  const store = useStore();
  const matter = store.state.matters.find((item) => item.id === matterId);
  const [requestOpen, setRequestOpen] = useState(false);
  if (!matter) return <Missing />;

  const requirements = store.state.requirements.filter((item) => item.matterId === matterId);
  const progress = stats(requirements);
  const intake = store.state.intakes[matterId];
  const attention = requirements.filter((item) =>
    ["MISSING", "REQUESTED", "NEEDS_REVIEW", "NOT_AVAILABLE"].includes(item.status),
  );
  const discovery = store.state.discoveries.find((item) => item.matterId === matterId && item.state === "open");
  const activity = store.state.activity.filter((item) => item.matterId === matterId).slice(0, 4);

  return (
    <div>
      <PageHeader
        eyebrow={matter.matterType}
        title={matterTitle(matter)}
        description={`${personName(clientParty(matter))} · ${matter.county} County, ${matter.state} · NJ Divorce Financial Disclosure`}
        actions={
          <>
            <StatusPill kind="matter" status={matter.status} label={MATTER_LABEL[matter.status]} />
            <Button variant="primary" onClick={() => setRequestOpen(true)} disabled={progress.missing + progress.unavailable === 0}>
              Request missing documents
            </Button>
          </>
        }
      />

      <StatusBanner key={matterId} matterId={matterId} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="card p-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold">Collection</h2>
              <p className="mt-1 text-sm text-muted">
                {progress.accepted} accepted · {progress.review} in review · {progress.missing} missing
                {progress.unavailable ? ` · ${progress.unavailable} unavailable` : ""}
              </p>
            </div>
            <p className="text-2xl font-semibold tabular-nums">{progress.pct}%</p>
          </div>
          <div className="mt-4">
            <StackedBar {...progress} />
          </div>
          <ul className="mt-5 divide-y divide-line">
            {OVERVIEW_ROWS.map((row) => {
              const sectionReqs = requirements.filter((item) => item.section === row.id);
              const sectionStats = stats(sectionReqs);
              const tone = sectionTone(sectionReqs, intake, row.id);
              const Icon = ROW_ICON[row.id] ?? FileText;
              return (
                <li key={row.id}>
                  <Link
                    href={`/matters/${matterId}/checklist#section-${row.id}`}
                    className="flex items-center gap-3 py-3 hover:bg-[#f4f7fd]"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                      <Icon className="size-4" />
                    </span>
                    <span className="w-32 shrink-0 text-sm font-medium">{row.label}</span>
                    <span className="min-w-0 flex-1">
                      <StackedBar {...sectionStats} />
                    </span>
                    <span className="w-28 text-right text-sm text-muted">{tone}</span>
                    <ChevronRight className="size-4 text-muted" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="text-sm font-semibold">{attention.length} items need attention</h2>
            <ul className="mt-3 space-y-2">
              {attention.length === 0 ? (
                <li className="text-sm text-muted">The checklist is clear.</li>
              ) : (
                attention.slice(0, 8).map((item) => (
                  <li key={item.id}>
                    <Link href={attentionHref(matterId, item)} className="block rounded-lg px-2 py-1.5 hover:bg-[#f4f7fd]">
                      <span className="block text-sm">{item.groupLabel ? `${item.groupLabel}` : item.title}</span>
                      <span className="text-xs text-muted">
                        {item.groupLabel ? `${item.title} · ` : ""}
                        {item.status === "NEEDS_REVIEW"
                          ? "Needs review"
                          : item.status === "NOT_AVAILABLE"
                            ? "Client says unavailable"
                            : item.status === "REQUESTED"
                              ? "Requested"
                              : "Missing"}
                      </span>
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </div>

          {discovery ? (
            <div className="card border-amber-200 bg-amber-50/60 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-900">Possible · needs review</p>
              <h2 className="mt-1 text-sm font-semibold">{discovery.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-950/80">{discovery.detail}</p>
              <p className="mt-2 text-xs text-amber-900/70">Source: {discovery.sourceLabel}. This is not a confirmed fact.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="primary" onClick={() => store.resolveDiscovery(discovery.id, "ask")}>
                  Ask client
                </Button>
                <Button onClick={() => store.resolveDiscovery(discovery.id, "dismiss")}>Dismiss</Button>
              </div>
            </div>
          ) : null}

          <div className="card p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">Recent activity</h2>
              <Link href={`/matters/${matterId}/activity`} className="text-xs font-medium text-brand">
                View all
              </Link>
            </div>
            <ul className="mt-3 space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="text-sm">
                  <span className="text-muted">{formatDate(item.at)}</span>
                  <span className="mt-0.5 block">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      {requestOpen ? (
        <RequestDialog matterId={matterId} open items={requirements} onClose={() => setRequestOpen(false)} />
      ) : null}
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

    return (
      <div className="card mb-6 space-y-4 p-4">
        <div>
          <h2 className="text-sm font-semibold">{ready ? "Demo invitation prepared" : "Prepare a client invitation"}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">{ready ? "The demo link is ready to copy or open. No email was sent." : "Confirm the intended recipient before preparing the demo link. No email will be sent."}</p>
        </div>
        {confirming ? (
          <div className="rounded-xl border border-line bg-brand-soft/40 p-4">
            <p className="text-sm font-medium">Confirm invitation recipient</p>
            <p className="mt-2 text-sm">{personName(client)}</p>
            <p className="break-all text-sm text-muted">{client?.email || "No email on file"}</p>
            <p className="mt-2 break-words text-sm text-muted">{matterTitle(matter)} · {store.state.firm.name}</p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button variant="primary" className="min-h-11" onClick={() => {
                store.sendInvitation(matterId);
                setPrepared(true);
                setConfirming(false);
              }}>Confirm and prepare demo invitation</Button>
              <Button className="min-h-11" onClick={() => setConfirming(false)}>Cancel</Button>
            </div>
          </div>
        ) : ready ? (
          <>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button className="min-h-11" onClick={copyInvitation}>Copy invitation link</Button>
              <Link href={link} className="btn btn-primary min-h-11">Open client invitation</Link>
            </div>
            {invitationUrl ? (
              <div>
                <label htmlFor="demo-invitation-url" className="mb-1.5 block text-xs font-medium">Invitation link — select to copy manually</label>
                <textarea id="demo-invitation-url" className="field break-all" rows={2} readOnly value={invitationUrl} onFocus={(event) => event.target.select()} />
              </div>
            ) : <p className="break-all text-xs text-muted">Demo invitation: {link}</p>}
          </>
        ) : <Button variant="primary" className="min-h-11" onClick={() => setConfirming(true)}>Prepare demo invitation</Button>}
        <p role="status" className="text-sm text-brand">{copyMessage || (prepared ? "Demo invitation prepared. No email was sent." : "")}</p>
      </div>
    );
  }
  if (matter.status === "CLIENT_SUBMITTED" || matter.status === "COMPLETE" || matter.status === "ATTORNEY_REVIEW") {
    return (
      <div className="card mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          {matter.status === "COMPLETE"
            ? "Collection is complete. Accepted documents stay on the file."
            : matter.status === "CLIENT_SUBMITTED"
              ? "The client says they have provided everything requested. Review before closing the file."
              : "Uploads are waiting for a decision. Accepting a document updates the checklist."}
        </p>
        {matter.status !== "COMPLETE" ? (
          <div className="flex shrink-0 gap-2">
            <Button className="whitespace-nowrap" onClick={() => store.returnToClient(matterId)}>Return to client</Button>
            <Button variant="primary" className="whitespace-nowrap" onClick={() => store.markComplete(matterId)}>
              Mark collection complete
            </Button>
          </div>
        ) : null}
      </div>
    );
  }
  return null;
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
  if (progress.missing > 0) return `${progress.accepted} / ${progress.total}`;
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
  return (
    <div className="card p-8">
      <h1 className="text-lg font-semibold">Matter not found</h1>
      <Link href="/matters" className="btn btn-secondary mt-4">
        Back to matters
      </Link>
    </div>
  );
}
