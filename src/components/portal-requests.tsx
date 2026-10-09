"use client";

import Link from "next/link";
import { PageHeader, StatusPill } from "@/components/ui";
import { REQUIREMENT_LABEL, formatDate } from "@/lib/format";
import { useStore } from "@/lib/store";

export function PortalRequests({ token }: { token: string }) {
  const { state, submitDisclosure } = useStore();
  const matter = state.matters.find((item) => item.id === token);
  const items = state.requirements.filter((item) => item.matterId === token && item.status === "REQUESTED");
  if (!matter) return null;
  const done = items.length === 0;

  return (
    <div>
      <PageHeader
        eyebrow="From your attorney"
        title={done ? "No open request" : `${items.length} document${items.length === 1 ? "" : "s"} needed`}
        description={
          matter.lastRequest?.message ??
          "When your attorney sends a request, every missing item arrives here together."
        }
      />
      {matter.lastRequest ? (
        <p className="mb-4 text-xs text-muted">Sent {formatDate(matter.lastRequest.at)}</p>
      ) : null}
      {done ? (
        <div className="card p-5 text-sm text-muted">
          Nothing is waiting on a formal request. Keep going from the checklist if items are still missing.
          <div className="mt-4">
            <Link href={`/portal/${token}/checklist`} className="btn btn-secondary">
              Open checklist
            </Link>
          </div>
        </div>
      ) : (
        <div className="card divide-y divide-line">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div>
                <p className="text-sm font-medium">{item.groupLabel ? `${item.groupLabel} · ${item.title}` : item.title}</p>
                <p className="text-xs text-muted">{item.description}</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusPill status={item.status} label={REQUIREMENT_LABEL[item.status]} />
                <Link href={`/portal/${token}/checklist/${item.id}`} className="btn btn-primary h-8 px-3 text-xs">
                  Upload
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      {!done ? (
        <button type="button" className="btn btn-secondary mt-4" onClick={() => submitDisclosure(token)}>
          I’ve provided everything requested
        </button>
      ) : null}
    </div>
  );
}
