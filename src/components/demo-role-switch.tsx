"use client";

import Link from "next/link";
import { BriefcaseBusiness, UserRound } from "lucide-react";
import { cn } from "@/lib/format";

type DemoRole = "ATTORNEY" | "CLIENT";

export function DemoRoleSwitch({
  role,
  matterId,
  preserveMessages = false,
}: {
  role: DemoRole;
  matterId: string;
  preserveMessages?: boolean;
}) {
  if (process.env.NODE_ENV !== "development") return null;

  const attorneyHref = preserveMessages ? `/matters/${matterId}/messages` : `/matters/${matterId}`;
  const clientHref = preserveMessages ? `/portal/${matterId}/messages` : `/portal/${matterId}`;

  return (
    <div className="col-span-2 flex flex-wrap items-center justify-self-end gap-2 rounded-md border border-line bg-surface-subtle p-1 md:ml-auto">
      <p className="px-2 text-xs font-medium text-muted">
        Demo view
      </p>
      <div className="grid grid-cols-2 gap-1" aria-label="Switch demo role">
        <RoleLink href={attorneyHref} active={role === "ATTORNEY"} icon={BriefcaseBusiness}>
          Attorney
        </RoleLink>
        <RoleLink href={clientHref} active={role === "CLIENT"} icon={UserRound}>
          Client
        </RoleLink>
      </div>
    </div>
  );
}

function RoleLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof BriefcaseBusiness;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-center gap-1.5 min-h-8 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
        active ? "border-brand/25 bg-brand-soft text-brand" : "border-transparent text-foreground hover:border-line hover:bg-surface",
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </Link>
  );
}
