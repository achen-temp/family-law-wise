import { Suspense, type ReactNode } from "react";
import { FirmShell } from "@/components/firm-shell";

export default function FirmLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <FirmShell>{children}</FirmShell>
    </Suspense>
  );
}
