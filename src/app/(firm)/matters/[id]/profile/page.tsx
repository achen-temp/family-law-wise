import { FinancialProfile } from "@/components/financial-profile";

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FinancialProfile matterId={id} />;
}
