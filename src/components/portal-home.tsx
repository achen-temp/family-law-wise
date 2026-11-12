"use client";

import Link from "next/link";
import { ArrowRight, Check, CircleAlert, ClipboardList, FileText, Inbox, MessageSquare } from "lucide-react";
import "./portal-home.css";
import { StatusPill } from "@/components/ui";
import { INTAKE_STEPS } from "@/lib/content";
import { REQUIREMENT_LABEL, clientParty, initials, matterTitle, personName, sectionLabel, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import { threadMessages, unreadCount } from "@/lib/messaging";
import { clientRequests } from "@/lib/document-selectors";
import { matterReviewSummary } from "@/lib/work-queues";

export function PortalHome({ token }: { token: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === token);
  const intake = state.intakes[token];
  if (!matter || !intake) return null;

  const client = clientParty(matter);
  const done = INTAKE_STEPS.filter((step) => intake.completed.includes(step.id)).length;
  const draftCount = state.intakeDirtySections?.[token]?.length ?? 0;
  const next = INTAKE_STEPS.find((step) => !intake.completed.includes(step.id)) ?? INTAKE_STEPS[0];
  const requirements = state.requirements.filter((item) => item.matterId === token);
  const progress = stats(requirements);
  const { pendingFiles } = matterReviewSummary(state, matter);
  const requested = clientRequests(state, token);
  const openItems = requirements.filter((item) => item.status === "MISSING" || item.status === "REQUESTED").slice(0, 4);
  const unread = unreadCount(state, "CLIENT", token);
  const messageThread = state.threads.find((thread) => thread.matterId === token && unreadCount(state, "CLIENT", token, thread.id) > 0);
  const message = messageThread
    ? threadMessages(state, messageThread.id, "CLIENT").filter((item) => item.authorRole === "ATTORNEY" && !item.readBy.includes("CLIENT")).at(-1)
    : undefined;

  return (
    <div data-portal-home className="-mx-4 -my-6 min-h-screen bg-canvas px-4 py-6 md:-mx-8 md:-my-8 md:px-8 md:py-8">
      <header className="mx-auto mb-7 flex max-w-[1440px] items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-[30px] font-semibold leading-[38px] tracking-tight">To-do</h1>
          <p className="mt-1.5 text-sm leading-[21px] text-muted">
            {state.firm.attorneyName} requested financial information for your {matter.matterType.toLowerCase()} matter.
          </p>
        </div>
        <p title={matterTitle(matter)} className="mt-2 hidden max-w-48 shrink-0 truncate text-xs text-muted xl:block">{matterTitle(matter)}</p>
      </header>

      <div className="mx-auto grid max-w-[1440px] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section aria-label="Your to-do list" className="min-w-0 overflow-hidden rounded-lg border border-line bg-surface">
          <div className="border-b border-line bg-brand-soft px-5 py-5 xl:px-6">
            <p className="flex items-center gap-2 text-xs font-medium text-brand">
              <MessageSquare className="size-4" aria-hidden="true" />
              {unread ? "Messages with your legal team" : "Your conversation"}
            </p>
            <h2 className="mt-3 text-xl font-semibold leading-7 tracking-tight">
              {unread ? `${unread} new message${unread === 1 ? "" : "s"} from your legal team` : "Messages with your legal team"}
            </h2>
            <p className="mt-2.5 line-clamp-3 break-words text-sm leading-[22px] text-brand [overflow-wrap:anywhere]">
              {message?.body ?? "Ask a question or share an update with your attorney."}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2 text-xs text-muted">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/10 text-[10px] font-medium text-brand" aria-hidden="true">
                  {initials(message?.authorName ?? state.firm.attorneyName)}
                </span>
                <span className="min-w-0 break-words">{message?.authorName ?? state.firm.attorneyName}{messageThread ? ` · ${messageThread.subject}` : " · Your legal team"}</span>
              </div>
              <Link href={`/portal/${token}/messages${messageThread ? `?thread=${messageThread.id}` : ""}`} className="btn btn-primary shrink-0">
                {unread ? "Read message" : "Open messages"}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <Link href={`/portal/${token}/intake/${next.id}`} className="flex items-center gap-3 border-b border-line px-5 py-4 hover:bg-surface-subtle xl:px-6">
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
              {done === INTAKE_STEPS.length ? <Check className="size-4" aria-hidden="true" /> : <ClipboardList className="size-4" aria-hidden="true" />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{done === INTAKE_STEPS.length ? "Review questionnaire" : "Complete questionnaire"}</span>
              <span className="mt-1 block text-xs leading-[18px] text-muted">
                {done} of {INTAKE_STEPS.length} sections {done === INTAKE_STEPS.length ? "confirmed" : "· about 20–30 minutes"}
                {draftCount > 0 ? ` · ${draftCount} ${draftCount === 1 ? "section has" : "sections have"} draft edits` : ""}
              </span>
            </span>
            <span className="hidden shrink-0 text-xs font-medium text-brand xl:block">{done === INTAKE_STEPS.length ? "Review answers" : "Continue"}</span>
            <ArrowRight className="size-4 shrink-0 text-brand" aria-hidden="true" />
          </Link>

          <Link href={`/portal/${token}/checklist`} className="flex items-start justify-between gap-3 px-5 pb-3 pt-5 hover:bg-surface-subtle xl:px-6">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold">{progress.missing > 0 ? "Documents still needed" : "Your documents"}</h2>
              <span className="mt-1 block text-xs leading-[18px] text-muted">{progress.missing > 0 ? "Provide these files, or explain why they are unavailable." : "View your checklist and the status of submitted files."}</span>
            </div>
            <span className="shrink-0 rounded bg-neutral-bg px-2 py-1 text-xs font-medium text-neutral-text">{progress.missing} still needed</span>
          </Link>

          {requested.length > 0 ? (
            <Link href={`/portal/${token}/requests`} className="mx-5 mb-2 flex items-start gap-3 rounded-md border border-line bg-surface-subtle p-3 hover:border-brand/40 xl:mx-6">
              <Inbox className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{requested.length} document{requested.length === 1 ? "" : "s"} requested</span>
                <span className="mt-1 line-clamp-2 break-words text-xs leading-[18px] text-muted [overflow-wrap:anywhere]">{matter.lastRequest?.message ?? "Your attorney asked for these files."}</span>
              </span>
              <ArrowRight className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden="true" />
            </Link>
          ) : null}

          <ul className="divide-y divide-line px-5 xl:px-6">
            {openItems.map((item) => (
              <li key={item.id}>
                <Link href={`/portal/${token}/checklist/${item.id}`} className="flex items-center gap-3 py-3 hover:text-brand">
                  <span className="grid h-8 w-7 shrink-0 place-items-center rounded border border-line bg-surface-subtle text-muted">
                    <FileText className="size-3.5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block break-words text-sm font-medium">{item.title}</span>
                    <span className="mt-1 block break-words text-xs leading-[18px] text-muted">{item.groupLabel ?? sectionLabel(item.section)}</span>
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1">
                    {item.status === "MISSING" ? <CircleAlert className="size-3 text-error-text" aria-hidden="true" /> : null}
                    <StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />
                  </span>
                  <ArrowRight className="size-3.5 shrink-0 text-brand" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-surface-subtle px-5 py-3 text-xs xl:px-6">
            <p className="text-muted">{progress.missing > 0 ? `Showing ${openItems.length} of ${progress.missing} outstanding items` : progress.total > 0 ? "No items need an upload right now." : "No requirements yet."}</p>
            <Link href={`/portal/${token}/checklist`} className="font-medium text-brand underline underline-offset-4">View full checklist</Link>
          </div>
        </section>

        <aside className="min-w-0">
          <section aria-labelledby="collection-title" className="rounded-lg border border-line bg-surface-subtle p-5">
            <p className="text-xs text-muted">Your collection</p>
            <h2 id="collection-title" title={matterTitle(matter)} className="mt-2 line-clamp-2 break-words text-lg font-semibold tracking-tight [overflow-wrap:anywhere]">{matterTitle(matter)}</h2>
            <p className="mt-1 text-xs text-muted">{personName(client)} · {matter.state}, {matter.county}</p>
            <div className="mt-5 flex items-baseline justify-between gap-2">
              <strong className="text-[32px] font-semibold leading-10 tracking-tight">{progress.pct}%</strong>
              <span className="text-[11px] text-brand">accepted by your attorney</span>
            </div>
            <div role="img" aria-label={`${progress.accepted} of ${progress.total} applicable requirements accepted`} className="mt-2 h-1.5 overflow-hidden rounded-sm bg-line">
              <span className="block h-full bg-success-text" style={{ width: `${progress.total ? (progress.accepted / progress.total) * 100 : 0}%` }} />
            </div>
            <p className="mt-2 text-xs text-muted">{progress.accepted} of {progress.total} applicable requirements</p>
            <dl className="mt-4 space-y-2 border-t border-line pt-4 text-xs">
              <div className="flex justify-between gap-3"><dt className="text-muted">Awaiting review</dt><dd className="font-medium">{pendingFiles} {pendingFiles === 1 ? "file" : "files"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Still needed</dt><dd className="font-medium">{progress.missing} {progress.missing === 1 ? "item" : "items"}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Unavailable {progress.unavailable === 1 ? "explanation" : "explanations"}</dt><dd className="font-medium">{progress.unavailable}</dd></div>
            </dl>
          </section>

          <section aria-labelledby="legal-team-title" className="border-b border-line px-1 py-6">
            <h2 id="legal-team-title" className="text-xs font-semibold">Your legal team</h2>
            <div className="mt-4 flex items-center gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-[11px] font-medium text-brand" aria-hidden="true">{initials(state.firm.attorneyName)}</span>
              <div className="min-w-0">
                <p className="break-words text-xs font-semibold">{state.firm.attorneyName}</p>
                <p className="mt-1 break-words text-xs text-muted">{state.firm.name}</p>
              </div>
            </div>
            <a href={`mailto:${state.firm.attorneyEmail}`} className="mt-4 block break-all text-xs text-brand underline underline-offset-4">{state.firm.attorneyEmail}</a>
          </section>

          <div className="space-y-3 px-1 py-5">
            <Link href={`/portal/${token}/checklist`} className="flex items-center justify-between gap-2 text-xs font-medium text-brand hover:underline">Upload documents <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
            <Link href={`/portal/${token}/requests`} className="flex items-center justify-between gap-2 text-xs font-medium text-brand hover:underline">View requests <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
            <Link href={`/portal/${token}/intake/${next.id}`} className="flex items-center justify-between gap-2 text-xs font-medium text-brand hover:underline">{done === INTAKE_STEPS.length ? "Review questionnaire" : "Continue questionnaire"} <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
          </div>
          <p className="mt-1 border-t border-line pt-4 text-xs leading-[18px] text-muted">
            Demo preview. Answers and drafts remain only while it stays open; refreshing or closing resets changes.
            {draftCount > 0 ? " Confirm each section with draft edits to update the checklist." : ""}
          </p>
        </aside>
      </div>
    </div>
  );
}
