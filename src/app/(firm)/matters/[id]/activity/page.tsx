import { ActivityFeed } from "@/components/activity-feed";

export default async function ActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ActivityFeed matterId={id} />;
}
