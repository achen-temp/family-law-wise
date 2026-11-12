import { Skeleton } from "@mui/material";

export default function Loading() {
  return (
    <main
      role="status"
      aria-label="Loading page"
      aria-live="polite"
      className="grid min-h-screen place-items-center bg-background px-6 py-10"
    >
      <span className="sr-only">Loading…</span>
      <div className="w-full max-w-[440px] rounded-xl border border-line bg-white p-8">
        <div className="mb-7 flex items-center gap-3">
          <Skeleton variant="rounded" width={44} height={44} animation={false} />
          <div className="flex-1 space-y-1">
            <Skeleton variant="text" width={150} height={24} animation={false} />
            <Skeleton variant="text" width={112} height={18} animation={false} />
          </div>
        </div>
        <div className="animate-pulse space-y-4 motion-reduce:animate-none">
          <div className="space-y-1.5">
            <Skeleton variant="text" width="72%" height={34} animation={false} />
            <Skeleton variant="text" width="92%" height={20} animation={false} />
          </div>
          <Skeleton variant="rounded" width="100%" height={40} animation={false} />
          <Skeleton variant="rounded" width="100%" height={40} animation={false} />
          <Skeleton variant="rounded" width="100%" height={36} animation={false} />
        </div>
      </div>
    </main>
  );
}
