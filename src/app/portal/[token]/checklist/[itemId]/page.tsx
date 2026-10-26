import { PortalUpload } from "@/components/portal-upload";

export default async function PortalItemPage({
  params,
}: {
  params: Promise<{ token: string; itemId: string }>;
}) {
  const { token, itemId } = await params;
  return <PortalUpload key={`${token}:${itemId}`} token={token} itemId={itemId} />;
}
