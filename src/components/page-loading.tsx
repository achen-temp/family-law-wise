import { Skeleton } from "@mui/material";

export function PageLoading() {
  return (
    <div role="status" aria-label="Loading page" className="w-full animate-pulse motion-reduce:animate-none" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="mb-6 space-y-2">
        <Skeleton variant="text" width={112} height={18} animation={false} />
        <Skeleton variant="text" width="min(320px, 72%)" height={42} animation={false} />
        <Skeleton variant="text" width="min(520px, 92%)" height={24} animation={false} />
      </div>
      <div className="overflow-hidden rounded-lg border border-line bg-white">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <Skeleton variant="text" width={120} height={26} animation={false} />
          <Skeleton variant="rounded" width={112} height={36} animation={false} />
        </div>
        <div className="divide-y divide-line">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex items-center gap-4 px-5 py-4">
              <Skeleton variant="circular" width={36} height={36} animation={false} className="shrink-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton variant="text" width={row % 2 ? "38%" : "46%"} height={22} animation={false} />
                <Skeleton variant="text" width={row % 2 ? "68%" : "58%"} height={18} animation={false} />
              </div>
              <Skeleton variant="rounded" width={76} height={24} animation={false} className="shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
