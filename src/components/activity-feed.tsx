"use client";

import { PageHeader } from "@/components/ui";
import { formatDate, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";

export function ActivityFeed({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const events = state.activity.filter((item) => item.matterId === matterId);
  if (!matter) return <p className="text-sm text-muted">Matter not found.</p>;

  return (
    <div>
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Activity"
        description="A running history of invitations, uploads, requests, and review decisions."
      />
      <ol className="card divide-y divide-line">
        {events.map((event) => (
          <li key={event.id} className="grid gap-1 px-4 py-3 sm:grid-cols-[8.5rem_9rem_minmax(0,1fr)] sm:gap-4">
            <time className="text-sm text-muted">{formatDate(event.at)}</time>
            <span className="text-sm font-medium">{event.actor}</span>
            <span className="text-sm">{event.text}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
