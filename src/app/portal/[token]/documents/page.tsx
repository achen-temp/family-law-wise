import { DocumentBrowser } from "@/components/document-browser";

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <DocumentBrowser token={token} />;
}
