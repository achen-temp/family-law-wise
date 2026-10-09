import { PortalHome } from "@/components/portal-home";

export default async function PortalHomePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <PortalHome token={token} />;
}
