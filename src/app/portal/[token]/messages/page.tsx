import { MessagesWorkspace } from "@/components/messaging/messages-workspace";

export default async function ClientMessagesPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <MessagesWorkspace role="CLIENT" matterId={token} />;
}
