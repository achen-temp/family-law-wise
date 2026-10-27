"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Briefcase,
  ClipboardList,
  ExternalLink,
  Files,
  History,
  Landmark,
  LayoutDashboard,
  LayoutTemplate,
  ListChecks,
  Menu,
  Settings,
} from "lucide-react";
import { CHECKLIST_SECTIONS } from "@/lib/content";
import { cn, initials, matterTitle, stats } from "@/lib/format";
import { useStore } from "@/lib/store";

const MATTER_NAV = [
  { slug: "", label: "Overview", icon: LayoutDashboard },
  { slug: "/intake", label: "Intake", icon: ClipboardList },
  { slug: "/checklist", label: "Checklist", icon: ListChecks },
  { slug: "/documents", label: "Documents", icon: Files },
  { slug: "/profile", label: "Financial profile", icon: Landmark },
  { slug: "/activity", label: "Activity", icon: History },
];

export function FirmShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }
  const matterMatch = pathname.match(/^\/matters\/([^/]+)/);
  const matterId = matterMatch && matterMatch[1] !== "new" ? matterMatch[1] : null;
  const matter = state.matters.find((item) => item.id === matterId) ?? null;
  const openMatters = state.matters.filter((item) => item.status !== "COMPLETE").length;
  const attention = matter
    ? state.requirements.filter(
        (item) =>
          item.matterId === matter.id &&
          CHECKLIST_SECTIONS.includes(item.section) &&
          (item.status === "MISSING" || item.status === "REQUESTED" || item.status === "NEEDS_REVIEW"),
      ).length
    : 0;
  const reviewDocs = matter
    ? state.documents.filter((item) => item.matterId === matter.id && item.status === "NEEDS_REVIEW").length
    : 0;

  const nav = (
    <div className="flex h-full flex-col bg-sidebar">
      <Link href="/overview" className="flex items-center gap-2.5 bg-white px-4 py-4 text-foreground">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-sm font-semibold text-white">W</span>
        <span>
          <span className="block text-[15px] font-semibold leading-none tracking-tight">Family Law Wise</span>
          <span className="mt-1 block text-[11px] text-muted">{state.firm.name}</span>
        </span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
      <nav className="space-y-0.5 px-2.5 pt-3">
        <NavLink href="/overview" active={pathname === "/overview"} icon={LayoutDashboard}>
          Overview
        </NavLink>
        <NavLink
          href="/matters"
          active={pathname === "/matters" || pathname === "/matters/new"}
          icon={Briefcase}
          badge={openMatters}
        >
          Matters
        </NavLink>
        <NavLink href="/templates" active={pathname.startsWith("/templates")} icon={LayoutTemplate}>
          Templates
        </NavLink>
        <NavLink href="/documents" active={pathname === "/documents"} icon={Files} badge={state.documents.filter((doc) => doc.status === "NEEDS_REVIEW").length}>Review queue</NavLink>
        <NavLink href="/settings" active={pathname.startsWith("/settings")} icon={Settings}>
          Settings
        </NavLink>
      </nav>
      {matter ? (
        <div className="mt-3 border-t border-white/15 px-2.5 pt-3">
          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">This matter</p>
          <p className="mt-2 px-3 text-sm font-semibold leading-snug text-white">{matterTitle(matter)}</p>
          <MatterMini matterId={matter.id} />
          <nav className="mt-2 space-y-0.5">
            {MATTER_NAV.map((item) => {
              const href = `/matters/${matter.id}${item.slug}`;
              const active = item.slug === "" ? pathname === href : pathname.startsWith(href);
              const badge = item.slug === "/checklist" ? attention : item.slug === "/documents" ? reviewDocs : 0;
              return (
                <NavLink key={item.label} href={href} active={active} icon={item.icon} badge={badge}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <Link
            href={`/portal/${matter.id}`}
            className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white hover:bg-white/10"
          >
            <ExternalLink className="size-4 shrink-0" />
            Client portal
          </Link>
        </div>
      ) : null}
      </div>
      <div className="mt-auto p-3">
        <Link href="/settings" className="block rounded-xl bg-white p-3 text-foreground shadow-sm">
          <span className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
              {initials(state.firm.attorneyName)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{state.firm.attorneyName}</span>
              <span className="block truncate text-xs text-muted">Attorney</span>
            </span>
          </span>
          <span className="mt-2.5 flex items-center gap-2 border-t border-line pt-2.5 text-xs font-medium text-muted">
            <Settings className="size-3.5" />
            Account settings
          </span>
        </Link>
        <Link href="/sign-in" className="mt-2 block px-3 py-2 text-xs text-white underline">Demo sign-in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-[240px] md:block">{nav}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-[#0f172a]/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-[240px]">{nav}</aside>
        </div>
      ) : null}
      <div className="md:pl-[240px]">
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-line bg-white px-4 py-3 md:hidden">
          <button type="button" className="btn btn-secondary h-9 px-2.5" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-4" />
          </button>
          <span className="truncate text-sm font-medium">{matter ? matterTitle(matter) : "Family Law Wise"}</span>
        </div>
        <main className="w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}

function MatterMini({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const progress = stats(state.requirements.filter((item) => item.matterId === matterId));
  return <p className="mt-1 px-3 text-xs text-white/70">{progress.pct}% accepted</p>;
}

function NavLink({
  href,
  active,
  icon: Icon,
  badge,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof Briefcase;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white",
        active ? "bg-white/20 font-semibold" : "hover:bg-white/10",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge ? (
        <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-emerald-400 px-1.5 text-[11px] font-semibold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
