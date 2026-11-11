"use client";

import { PageHeader } from "@/components/ui";
import { formatDate, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";

const eventTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "America/New_York",
});

export function ActivityFeed({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const matter = state.matters.find((item) => item.id === matterId);
  const events = state.activity
    .filter((item) => item.matterId === matterId)
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  if (!matter) return <p className="text-sm text-muted">Matter not found.</p>;

  const groups = new Map<string, typeof events>();
  for (const event of events) {
    const date = formatDate(event.at);
    const group = groups.get(date);
    if (group) group.push(event);
    else groups.set(date, [event]);
  }

  return (
    <div className="max-w-[1000px]">
      <PageHeader
        eyebrow={matterTitle(matter)}
        title="Activity"
        description="A running history of invitations, uploads, requests, and review decisions."
      />
      {events.length === 0 ? (
        <div className="flex min-h-60 flex-col items-center justify-center rounded-lg border border-line bg-surface px-6 text-center">
          <p className="text-base font-medium">No activity yet.</p>
          <p className="mt-2 max-w-sm text-sm leading-[21px] text-muted">
            Invitations, uploads, requests, and review decisions will appear here.
          </p>
        </div>
      ) : (
        <section aria-label="Activity history" className="overflow-hidden rounded-lg border border-line bg-surface">
          <div aria-hidden="true" className="hidden grid-cols-[24px_5.5rem_9rem_minmax(0,1fr)] gap-4 border-b border-line px-6 py-3 text-xs font-medium text-muted sm:grid">
            <span />
            <span>Time (ET)</span>
            <span>Actor</span>
            <span>Event</span>
          </div>
          <div className="relative py-2 before:absolute before:inset-y-7 before:left-[35px] before:w-px before:bg-line">
            {Array.from(groups, ([date, dateEvents], index) => (
              <section key={date} aria-labelledby={`activity-date-${index}`}>
                <h2 id={`activity-date-${index}`} className="relative flex min-h-10 items-center gap-4 px-6 text-sm font-semibold">
                  <span aria-hidden="true" className="flex w-6 shrink-0 justify-center">
                    <span className="size-2.5 rounded-full border border-border-strong bg-surface" />
                  </span>
                  {date}
                </h2>
                <ol>
                  {dateEvents.map((event) => (
                    <li key={event.id} className="relative grid min-h-14 grid-cols-[24px_minmax(0,1fr)] items-start gap-x-4 px-6 py-4 text-sm leading-6 sm:grid-cols-[24px_5.5rem_9rem_minmax(0,1fr)]">
                      <span aria-hidden="true" className="row-span-3 flex h-6 items-center justify-center sm:row-span-1">
                        <span className="size-1.5 rounded-full bg-border-strong ring-4 ring-surface" />
                      </span>
                      <time dateTime={event.at} className="whitespace-nowrap text-xs leading-6 text-muted">
                        {eventTime.format(new Date(event.at))}<span className="sm:sr-only"> ET</span>
                      </time>
                      <span className="min-w-0 break-words text-muted">{event.actor}</span>
                      <p className="min-w-0 break-words border-b border-line pb-4 sm:pb-0 sm:after:absolute sm:after:inset-x-6 sm:after:bottom-0 sm:after:left-16 sm:after:border-b sm:after:border-line sm:border-0">
                        {event.text}
                      </p>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
