import { Suspense, type ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";

export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <PortalShell token={token}>{children}</PortalShell>
    </Suspense>
  );
}
