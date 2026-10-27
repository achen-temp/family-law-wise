"use client";

import Link from "next/link";
import { useState } from "react";
import { Briefcase, Plus, Search } from "lucide-react";
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
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat href="/matters?queue=open" label="Open" value={counts.open} hint="Not yet complete" />
        <Stat href="/matters?queue=review" label="Ready for review" value={counts.review} hint="Submissions, files, or explanations to review" />
        <Stat href="/matters?queue=waiting" label="Waiting on a client" value={counts.waiting} hint="Invited or collecting answers and materials" />
      </div>
      <nav aria-label="Matter work queues" className="mb-3 flex flex-wrap gap-2">
        {[{ id: "all" as const, label: "All matters" }, ...WORK_QUEUES].map((item) => (
          <Link key={item.id} href={item.id === "all" ? "/matters" : `/matters?queue=${item.id}`} aria-current={queue === item.id ? "page" : undefined}
            className={`btn ${queue === item.id ? "btn-primary" : "btn-secondary"}`}>
            {item.label} ({counts[item.id]})
          </Link>
        ))}
      </nav>
      <p className="mb-4 text-xs text-muted">Ready for review takes priority when a matter also needs client information. Complete matters are excluded from active queues.</p>
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-4 py-3">
          <label className="flex min-w-[12rem] flex-1 items-center gap-2">
            <Search className="size-4 shrink-0 text-muted" aria-hidden="true" />
            <span className="sr-only">Search matter name, party, or county</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, party, or county"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
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
        <div className="hidden grid-cols-[minmax(0,1.5fr)_7rem_minmax(9rem,1fr)_5.5rem_6.5rem] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid">
          <span>Matter</span>
          <span>Status</span>
          <span>Collection</span>
          <span>Missing</span>
          <span>Last activity</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">{state.matters.length === 0 ? "No matters yet. Create a matter to get started." : "No matters match these filters. Clear filters to see all matters."}</p>
        ) : (
          <ul>
            {rows.map((matter) => {
              const progress = stats(state.requirements.filter((item) => item.matterId === matter.id));
              return (
                <li key={matter.id} className="border-t border-line first:border-t-0">
                  <Link
                    href={`/matters/${matter.id}`}
                    className="grid gap-3 px-4 py-4 hover:bg-[#f4f7fd] md:grid-cols-[minmax(0,1.5fr)_7rem_minmax(9rem,1fr)_5.5rem_6.5rem] md:items-center"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                        <Briefcase className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{matterTitle(matter)}</span>
                        <span className="mt-0.5 block truncate text-xs text-muted">{matter.parties.map((party) => `${party.firstName} ${party.lastName}`).join(" · ")}</span>
                        <span className="mt-0.5 block text-xs text-muted">
                          {matter.matterType} · {matter.county} County, {matter.state}
                        </span>
                      </span>
                    </span>
                    <StatusPill kind="matter" status={matter.status} label={MATTER_LABEL[matter.status]} />
                    <span>
                      <span className="mb-1.5 block text-xs text-muted">{progress.pct}% accepted</span>
                      <StackedBar {...progress} />
                    </span>
                    <span className="text-sm tabular-nums">{progress.missing}</span>
                    <span className="text-sm text-muted">
                      {matter.lastClientActivity ? formatDate(matter.lastClientActivity) : "—"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ href, label, value, hint }: { href: string; label: string; value: number; hint: string }) {
  return (
    <Link href={href} className="card block px-4 py-3 hover:bg-[#f4f7fd]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </Link>
  );
}
