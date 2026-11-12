"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader, StackedBar, StatusPill } from "@/components/ui";
import { MATTER_LABEL, formatDate, matterTitle, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import { matterMatchesQuery, matterQueue, parseQueue, WORK_QUEUES, workspaceCounts } from "@/lib/work-queues";
import type { MatterStatus } from "@/lib/types";

export function MattersList({ initialQueue }: { initialQueue?: string }) {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<MatterStatus | "all">("all");
  const queue = parseQueue(initialQueue);
  const counts = workspaceCounts(state);
  const rows = state.matters.filter((matter) => {
    const category = matterQueue(state, matter);
    return (queue === "all" || (queue === "open" ? category !== "complete" : category === queue)) &&
      (status === "all" || matter.status === status) && matterMatchesQuery(matter, query);
  });
  const filtered = queue !== "all" || status !== "all" || Boolean(query.trim());

  return (
    <div>
      <PageHeader
        eyebrow="Firm"
        title="Matters"
        description="Financial disclosure collection. Progress is counted from requirements, not from the number of files."
        actions={
          <Link href="/matters/new" className="btn btn-primary">
            <Plus className="size-4" />
            New matter
          </Link>
        }
      />
      <div className="mb-5 flex flex-wrap gap-x-8 gap-y-3 border-b border-line pb-5">
        <Stat href="/matters?queue=open" label="Open" value={counts.open} hint="Not yet complete" />
        <Stat href="/matters?queue=review" label="Ready for review" value={counts.review} hint="Submissions, files, or explanations to review" />
        <Stat href="/matters?queue=waiting" label="Waiting on a client" value={counts.waiting} hint="Invited or collecting answers and materials" />
      </div>
      <nav aria-label="Matter work queues" className="mb-3 flex min-w-0 gap-5 overflow-x-auto border-b border-line">
        {[{ id: "all" as const, label: "All matters" }, ...WORK_QUEUES].map((item) => (
          <Link key={item.id} href={item.id === "all" ? "/matters" : `/matters?queue=${item.id}`} aria-current={queue === item.id ? "page" : undefined}
            className={`flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 text-sm font-medium ${queue === item.id ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`}>
            {item.label} <span className="rounded bg-neutral-bg px-1.5 text-xs tabular-nums text-neutral-text">{counts[item.id]}</span>
          </Link>
        ))}
      </nav>
      <p className="mb-4 text-xs text-muted">Ready for review takes priority when a matter also needs client information. Complete matters are excluded from active queues.</p>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <label className="flex min-w-0 basis-64 flex-1 items-center gap-2 rounded border border-border-strong px-3 py-2 focus-within:ring-2 focus-within:ring-focus">
            <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="sr-only">Search matter name, party, or county</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, party, or county"
              className="min-w-0 w-full bg-transparent text-sm outline-none placeholder:text-muted"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">Status
            <select className="field w-auto text-sm" value={status} onChange={(event) => setStatus(event.target.value as MatterStatus | "all")}>
              <option value="all">All statuses</option>
              {Object.entries(MATTER_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {filtered ? <Link href="/matters" className="text-sm text-brand underline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Link> : null}
        </div>
        <p role="status" className="px-4 py-2 text-xs text-muted">{rows.length} {rows.length === 1 ? "matter" : "matters"} shown</p>
        <div role="region" aria-label="Matters table" tabIndex={0} className="overflow-x-auto focus-visible:outline-2 focus-visible:outline-focus">
          <table className="w-full min-w-[760px] table-fixed text-left text-sm">
            <caption className="sr-only">Matters matching the selected queue, search, and status. Collection progress is based on requirements.</caption>
            <colgroup>
              <col className="w-[35%]" /><col className="w-[17%]" /><col className="w-[23%]" /><col className="w-[10%]" /><col className="w-[15%]" />
            </colgroup>
            <thead className="border-y border-line bg-surface-subtle text-[11px] uppercase tracking-wider text-muted">
              <tr>{["Matter", "Status", "Collection", "Missing", "Last activity"].map((label) => <th key={label} scope="col" className="px-4 py-3 font-semibold">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((matter) => {
                const progress = stats(state.requirements.filter((item) => item.matterId === matter.id));
                return (
                  <tr key={matter.id} className="align-middle hover:bg-surface-subtle focus-within:bg-surface-subtle">
                    <th scope="row" className="px-4 py-4 font-normal">
                      <Link href={`/matters/${matter.id}`} className="block [overflow-wrap:anywhere] font-medium text-brand hover:underline">
                        {matterTitle(matter)}
                      </Link>
                      <p className="mt-1 [overflow-wrap:anywhere] text-xs text-muted">{matter.parties.map((party) => `${party.firstName} ${party.lastName}`).join(" · ")}</p>
                      <p className="mt-1 [overflow-wrap:anywhere] text-xs text-muted">{matter.matterType} · {matter.county} County, {matter.state}</p>
                    </th>
                    <td className="px-4 py-4"><StatusPill kind="matter" status={matter.status} label={MATTER_LABEL[matter.status]} /></td>
                    <td className="px-4 py-4">
                      <p className="mb-2 text-xs tabular-nums text-muted">{progress.accepted} / {progress.total} accepted · {progress.pct}%</p>
                      <StackedBar {...progress} />
                    </td>
                    <td className="px-4 py-4 tabular-nums">{progress.missing}</td>
                    <td className="px-4 py-4 text-xs text-muted">{matter.lastClientActivity ? <time dateTime={matter.lastClientActivity}>{formatDate(matter.lastClientActivity)}</time> : "—"}</td>
                  </tr>
                );
              })}
              {rows.length === 0 ? <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-muted">
                <p>{state.matters.length === 0 ? "No matters yet. Create a matter to get started." : "No matters match these filters."}</p>
                {filtered ? <Link href="/matters" className="mt-3 inline-block text-brand underline" onClick={() => { setQuery(""); setStatus("all"); }}>Clear filters</Link> : null}
              </td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ href, label, value, hint }: { href: string; label: string; value: number; hint: string }) {
  return (
    <Link href={href} className="min-w-0 basis-44 rounded px-1 hover:bg-surface-subtle">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Link>
  );
}
