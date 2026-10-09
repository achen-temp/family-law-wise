import { MatterIntake } from "@/components/matter-intake";

export default async function IntakePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatterIntake matterId={id} />;
}
