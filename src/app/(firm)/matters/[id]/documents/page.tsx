import { MatterDocuments } from "@/components/matter-documents";

export default async function DocumentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <MatterDocuments matterId={id} />;
}
