import { PortalChecklist } from "@/components/portal-checklist";

export default async function PortalChecklistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PortalChecklist token={token} />;
}
