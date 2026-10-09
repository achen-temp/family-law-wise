import { DocumentReview } from "@/components/document-review";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string; docId: string }>;
}) {
  const { id, docId } = await params;
  return <DocumentReview matterId={id} documentId={docId} />;
}
