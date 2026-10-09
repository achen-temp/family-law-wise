import { PortalIntake } from "@/components/portal-intake";
import type { SectionId } from "@/lib/types";

export default async function PortalIntakePage({
  params,
}: {
  params: Promise<{ token: string; section: string }>;
}) {
  const { token, section } = await params;
  return <PortalIntake token={token} section={section as SectionId} />;
}
