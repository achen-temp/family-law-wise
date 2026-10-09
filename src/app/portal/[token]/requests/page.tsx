import { PortalRequests } from "@/components/portal-requests";

export default async function PortalRequestsPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PortalRequests token={token} />;
}
