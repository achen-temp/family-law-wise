"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Briefcase, Plus, Search } from "lucide-react";
import { PageHeader, StackedBar, StatusPill } from "@/components/ui";
import { MATTER_LABEL, formatDate, matterTitle, stats } from "@/lib/format";
import { useStore } from "@/lib/store";

export function MattersList() {
  const { state } = useStore();
  const [query, setQuery] = useState("");
  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return state.matters.filter((matter) => {
      if (!needle) return true;
      return matterTitle(matter).toLowerCase().includes(needle) || matter.county.toLowerCase().includes(needle);
    });
  }, [query, state.matters]);

  const open = state.matters.filter((matter) => matter.status !== "COMPLETE").length;
  const review = state.matters.filter((matter) => matter.status === "ATTORNEY_REVIEW" || matter.status === "CLIENT_SUBMITTED").length;
  const waiting = state.matters.filter((matter) => matter.status === "WAITING_FOR_CLIENT" || matter.status === "INVITED").length;

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
        <Stat label="Open" value={open} hint="Not yet complete" />
        <Stat label="Ready for review" value={review} hint="Client submitted or uploads waiting" />
        <Stat label="Waiting on a client" value={waiting} hint="Invited or sent a request" />
      </div>
      <div className="card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <Search className="size-4 text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search matters"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <div className="hidden grid-cols-[minmax(0,1.5fr)_7rem_minmax(9rem,1fr)_5.5rem_6.5rem] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted md:grid">
          <span>Matter</span>
          <span>Status</span>
          <span>Collection</span>
          <span>Missing</span>
          <span>Last activity</span>
        </div>
        {rows.length === 0 ? (
          <p className="px-4 py-10 text-sm text-muted">No matters match that search.</p>
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

function Stat({ label, value, hint }: { label: string; value: number; hint: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-muted">{hint}</p>
    </div>
  );
}
