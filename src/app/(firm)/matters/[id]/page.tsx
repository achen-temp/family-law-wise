import { MatterOverview } from "@/components/matter-overview";

export default async function MatterPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatterOverview matterId={id} />;
}
