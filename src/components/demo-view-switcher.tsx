"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button, Dialog } from "@/components/ui";
import { clientParty, matterTitle, personName } from "@/lib/format";
import { useStore } from "@/lib/store";
import type { Matter } from "@/lib/types";

export function DemoViewSwitcher({ role, matter }: { role: "Attorney" | "Client"; matter?: Matter | null }) {
  const { state } = useStore();
  const [choosing, setChoosing] = useState(false);
  const label = role === "Attorney" ? "View as client" : "View as attorney";

  return (
    <div className="col-span-2 flex shrink-0 items-center justify-self-end gap-2 text-xs md:ml-auto">
      <span className="text-muted">Demo view</span>
      <span className="rounded border border-line bg-surface-subtle px-2 py-1 font-medium">{role}</span>
      {matter ? (
        <Link
          href={role === "Attorney" ? `/portal/${encodeURIComponent(matter.id)}` : `/matters/${encodeURIComponent(matter.id)}`}
          className="btn btn-secondary h-8 px-3 text-xs"
        >
          {label}
        </Link>
      ) : (
        <Button className="h-8 px-3 text-xs" onClick={() => setChoosing(true)} aria-haspopup="dialog">
          {label}
        </Button>
      )}
      <Dialog open={choosing} title="Choose a client view" onClose={() => setChoosing(false)} footer={<Button onClick={() => setChoosing(false)}>Cancel</Button>}>
        <p className="mb-4 text-sm leading-[21px] text-muted">
          Select a matter to open its client demo in this tab. Changes stay in this session and reset on refresh.
        </p>
        {state.matters.length === 0 ? (
          <div className="space-y-3 py-4 text-sm">
            <p>No matters yet. Create a matter before opening a client view.</p>
            <Link href="/matters/new" className="btn btn-primary" onNavigate={() => setChoosing(false)}>Create matter</Link>
          </div>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line">
            {state.matters.map((item) => (
              <li key={item.id}>
                <Link href={`/portal/${encodeURIComponent(item.id)}`} onNavigate={() => setChoosing(false)} className="flex items-center gap-4 px-4 py-3 hover:bg-surface-subtle">
                  <span className="min-w-0 flex-1 break-words">
                    <span className="block text-sm font-medium">{matterTitle(item)}</span>
                    <span className="mt-1 block text-xs text-muted">Client: {personName(clientParty(item))}</span>
                  </span>
                  <ArrowRight aria-hidden="true" className="size-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Dialog>
    </div>
  );
}
