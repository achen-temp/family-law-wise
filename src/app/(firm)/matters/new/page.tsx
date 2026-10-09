import type { Metadata } from "next";
import { NewMatterForm } from "@/components/new-matter";

export const metadata: Metadata = { title: "New matter" };

export default function NewMatterPage() {
  return <NewMatterForm />;
}
