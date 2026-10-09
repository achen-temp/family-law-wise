import { MatterChecklist } from "@/components/matter-checklist";

export default async function ChecklistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatterChecklist matterId={id} />;
}
