import { ClientInvitation } from "@/components/client-invitation";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ClientInvitation key={token} token={token} />;
}
