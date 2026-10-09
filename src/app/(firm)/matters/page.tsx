import type { Metadata } from "next";
import { MattersList } from "@/components/matters-list";

export const metadata: Metadata = { title: "Matters" };

export default function MattersPage() {
  return <MattersList />;
}
