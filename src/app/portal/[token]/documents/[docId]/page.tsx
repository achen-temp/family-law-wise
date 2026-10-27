import { PortalDocumentDetail } from "@/components/document-browser";

export default async function Page({ params }: { params: Promise<{ token: string; docId: string }> }) {
  const { token, docId } = await params;
  return <PortalDocumentDetail key={docId} token={token} documentId={docId} />;
}
