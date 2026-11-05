import { MessagesWorkspace } from "@/components/messaging/messages-workspace";

export default async function MatterMessagesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MessagesWorkspace role="ATTORNEY" matterId={id} />;
}
