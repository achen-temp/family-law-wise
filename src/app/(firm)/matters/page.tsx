import type { Metadata } from "next";
import { MattersList } from "@/components/matters-list";

export const metadata: Metadata = { title: "Matters" };

export default async function MattersPage({ searchParams }: { searchParams: Promise<{ queue?: string | string[] }> }) {
  const { queue } = await searchParams;
  return <MattersList initialQueue={typeof queue === "string" ? queue : undefined} />;
}
