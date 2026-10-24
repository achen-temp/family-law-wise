"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ClipboardList,
  FileUp,
  Inbox,
  ListChecks,
  Mail,
  Square,
  Upload,
} from "lucide-react";
import { INTAKE_STEPS } from "@/lib/content";
import { clientParty, personName, stats } from "@/lib/format";
import { useStore } from "@/lib/store";

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
  const requested = requirements.filter((item) => item.status === "REQUESTED");
  const openItems = requirements.filter((item) => item.status === "MISSING" || item.status === "REQUESTED").slice(0, 4);

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">To-do</h1>
        <p className="mt-1 text-sm text-muted">
          {state.firm.attorneyName} requested financial information for your {matter.matterType.toLowerCase()} matter.
        </p>
        <p className="mt-3 text-xs leading-relaxed text-muted">
          This is a demo preview. Answers and drafts remain only while it stays open; refreshing or closing resets changes.
          {draftCount > 0 ? ` ${draftCount} questionnaire section${draftCount === 1 ? " has" : "s have"} draft edits. Confirm each section to update the checklist.` : ""}
        </p>
        <ul className="mt-5 space-y-3">
          <TodoCard
            href={`/portal/${token}/intake/${next.id}`}
            icon={ClipboardList}
            tone="bg-amber-50 text-amber-700"
            title={done === INTAKE_STEPS.length ? "Review questionnaire" : "Complete questionnaire"}
            detail={`${done} of ${INTAKE_STEPS.length} sections · about 20–30 minutes`}
          />
          <TodoCard
            href={`/portal/${token}/checklist`}
            icon={FileUp}
            tone="bg-sky-50 text-sky-700"
            title="Documents still needed"
            detail={`${progress.missing} missing · ${progress.pct}% accepted by your attorney`}
          />
          {requested.length > 0 ? (
            <TodoCard
              href={`/portal/${token}/requests`}
              icon={Inbox}
              tone="bg-emerald-50 text-emerald-700"
              title={`${requested.length} document${requested.length === 1 ? "" : "s"} requested`}
              detail={matter.lastRequest?.message ?? "Your attorney asked for these files."}
            />
          ) : null}
          {openItems.map((item) => (
            <li key={item.id}>
              <Link
                href={`/portal/${token}/checklist/${item.id}`}
                className="card flex items-center gap-3 px-4 py-3 hover:border-brand/40"
              >
                <Square className="size-4 shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted">{item.groupLabel ?? "Upload this file"}</span>
                </span>
                <ArrowUpRight className="size-4 shrink-0 text-brand" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <aside className="space-y-6">
        <div className="space-y-2">
          <Link href={`/portal/${token}/checklist`} className="flex items-center gap-2 text-sm font-medium text-brand hover:underline">
            <Upload className="size-4" />
            Upload documents
          </Link>
          <Link href={`/portal/${token}/requests`} className="flex items-center gap-2 text-sm font-medium text-brand hover:underline">
            <Inbox className="size-4" />
            View requests
          </Link>
          <Link href={`/portal/${token}/intake/${next.id}`} className="flex items-center gap-2 text-sm font-medium text-brand hover:underline">
            <ListChecks className="size-4" />
            Continue questionnaire
          </Link>
        </div>
        <div>
          <h2 className="text-base font-semibold">Contact</h2>
          <div className="mt-3 h-px bg-line" />
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2.5 text-brand">
              <Mail className="mt-0.5 size-4 shrink-0" />
              <span className="break-all">{state.firm.attorneyEmail}</span>
            </li>
            <li className="text-muted">
              {state.firm.attorneyName}
              <span className="mt-0.5 block text-xs">{state.firm.name}</span>
            </li>
            <li className="text-xs leading-relaxed text-muted">{personName(client)}</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function TodoCard({
  href,
  icon: Icon,
  tone,
  title,
  detail,
}: {
  href: string;
  icon: typeof ClipboardList;
  tone: string;
  title: string;
  detail: string;
}) {
  return (
    <li>
      <Link href={href} className="card flex items-center gap-3 px-4 py-3 hover:border-brand/40">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${tone}`}>
          <Icon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          <span className="block truncate text-xs text-muted">{detail}</span>
        </span>
        <ArrowUpRight className="size-4 shrink-0 text-brand" />
      </Link>
    </li>
  );
}
