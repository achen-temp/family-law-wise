"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
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
  MessageSquare,
  Settings,
} from "lucide-react";
import { CHECKLIST_SECTIONS } from "@/lib/content";
import { cn, initials, matterTitle, stats } from "@/lib/format";
import { useStore } from "@/lib/store";
import { unreadCount } from "@/lib/messaging";
import { WiseAi } from "@/components/wise-ai/wise-ai";
import { DemoViewSwitcher } from "@/components/demo-view-switcher";
import { PageLoading } from "@/components/page-loading";

const MATTER_NAV = [
  { slug: "", label: "Overview", icon: LayoutDashboard },
  { slug: "/intake", label: "Intake", icon: ClipboardList },
  { slug: "/checklist", label: "Checklist", icon: ListChecks },
  { slug: "/documents", label: "Documents", icon: Files },
  { slug: "/profile", label: "Financial profile", icon: Landmark },
  { slug: "/activity", label: "Activity", icon: History },
  { slug: "/messages", label: "Messages", icon: MessageSquare },
];

export function FirmShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [pendingPath, setPendingPath] = useState<string | null>(null);
  useEffect(() => setPendingPath(null), [pathname]);
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
  const activePath = pendingPath && pendingPath !== pathname ? pendingPath : pathname;
  const navigating = activePath !== pathname;

  const pageLabel = matter
    ? MATTER_NAV.find((item) => item.slug && pathname.startsWith(`/matters/${matter.id}${item.slug}`))?.label ?? "Overview"
    : ({ "/overview": "Overview", "/matters": "Matters", "/matters/new": "New matter", "/messages": "Messages", "/templates": "Templates", "/documents": "Review queue", "/settings": "Settings" }[pathname] ?? "Matters");

  const nav = (
    <div className="flex h-full flex-col bg-sidebar text-rail-text">
      <Link href="/overview" className="flex h-[72px] shrink-0 items-center gap-2.5 px-4 text-rail-text">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-rail-selected text-sm font-semibold">W</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-5 tracking-tight">Family Law Wise</span>
          <span className="block truncate text-[11px] text-rail-muted" title={state.firm.name}>{state.firm.name}</span>
        </span>
      </Link>
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
      <nav aria-label="Workspace navigation" className="space-y-0.5 px-2 pt-3">
        <p className="px-3 pb-2 text-[11px] font-medium text-rail-muted">Workspace</p>
        <NavLink href="/overview" active={activePath === "/overview"} icon={LayoutDashboard} onNavigate={setPendingPath}>
          Overview
        </NavLink>
        <NavLink
          href="/matters"
          active={activePath === "/matters" || activePath === "/matters/new"}
          icon={Briefcase}
          badge={openMatters}
          onNavigate={setPendingPath}
        >
          Matters
        </NavLink>
        <NavLink href="/messages" active={activePath === "/messages"} icon={MessageSquare} badge={unreadCount(state, "ATTORNEY")} onNavigate={setPendingPath}>
          All messages
        </NavLink>
        <NavLink href="/templates" active={activePath.startsWith("/templates")} icon={LayoutTemplate} onNavigate={setPendingPath}>
          Templates
        </NavLink>
        <NavLink href="/documents" active={activePath === "/documents"} icon={Files} badge={state.documents.filter((doc) => doc.status === "NEEDS_REVIEW").length} onNavigate={setPendingPath}>Review queue</NavLink>
        <NavLink href="/settings" active={activePath.startsWith("/settings")} icon={Settings} onNavigate={setPendingPath}>
          Settings
        </NavLink>
      </nav>
      {matter ? (
        <div className="mt-4 border-t border-rail-hover px-2 pt-3">
          <p className="px-3 text-[11px] font-medium text-rail-muted">This matter</p>
          <p className="mt-1 line-clamp-3 break-words px-3 text-[13px] font-semibold leading-5" title={matterTitle(matter)}>{matterTitle(matter)}</p>
          <MatterMini matterId={matter.id} />
          <nav aria-label="Matter navigation" className="mt-3 space-y-0.5">
            {MATTER_NAV.map((item) => {
              const href = `/matters/${matter.id}${item.slug}`;
              const active = item.slug === "" ? activePath === href : activePath.startsWith(href);
              const badge = item.slug === "/checklist" ? attention : item.slug === "/documents" ? reviewDocs : item.slug === "/messages" ? unreadCount(state, "ATTORNEY", matter.id) : 0;
              return (
                <NavLink key={item.label} href={href} active={active} icon={item.icon} badge={badge} onNavigate={setPendingPath}>
                  {item.label}
                </NavLink>
              );
            })}
          </nav>
          <Link
            href={`/portal/${matter.id}`}
            className="mt-2 flex min-h-9 items-center gap-2.5 rounded-md px-3 py-2 text-xs text-rail-muted hover:bg-rail-hover hover:text-rail-text"
          >
            <ExternalLink className="size-4 shrink-0" />
            Demo: Client portal
          </Link>
        </div>
      ) : null}
      </div>
      <div className="shrink-0 space-y-2 border-t border-rail-hover p-3">
        <WiseAi role="ATTORNEY" matterId={matter?.id} />
        <Link href="/settings" className="flex min-h-12 items-center gap-2.5 rounded-md px-2 hover:bg-rail-hover" aria-label={`Account settings for ${state.firm.attorneyName}`} title="Account settings">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rail-selected text-xs font-semibold">{initials(state.firm.attorneyName)}</span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-medium" title={state.firm.attorneyName}>{state.firm.attorneyName}</span>
            <span className="block text-[11px] text-rail-muted">Attorney</span>
          </span>
          <Settings aria-hidden="true" className="size-3.5 shrink-0 text-rail-muted" />
        </Link>
        <Link href="/sign-in" className="block px-2 py-1 text-[11px] text-rail-muted underline underline-offset-4">Demo sign-in</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside aria-label="Attorney sidebar" className="fixed inset-y-0 left-0 z-20 hidden w-56 md:block">{nav}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button className="absolute inset-0 bg-[#20292759]" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-56">{nav}</aside>
        </div>
      ) : null}
      <div className="md:pl-56">
        <header className="sticky top-0 z-10 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-b border-line bg-surface px-4 py-2 md:flex md:h-14 md:gap-4 md:px-6 md:py-0 min-[90rem]:px-8 min-[120rem]:px-12">
          <button type="button" className="btn btn-secondary h-8 px-2 md:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu className="size-4" /></button>
          <nav aria-label="Breadcrumb" className="min-w-0 flex-1 text-xs text-muted">
            <ol className="flex min-w-0 items-center gap-2">
              {matter ? <>
                <li className="shrink-0"><Link href="/matters" className="hover:text-foreground">Matters</Link></li>
                <li aria-hidden="true">/</li>
                <li className="min-w-0 truncate" title={matterTitle(matter)}><Link href={`/matters/${matter.id}`} className="hover:text-foreground">{matterTitle(matter)}</Link></li>
                <li aria-hidden="true">/</li>
              </> : null}
              <li aria-current="page" className="shrink-0 font-medium text-foreground">{pageLabel}</li>
            </ol>
          </nav>
          <DemoViewSwitcher role="Attorney" matter={matter} />
        </header>
        <main className={cn("mx-auto w-full max-w-[1696px] px-4 py-6 md:px-6 min-[90rem]:px-8 min-[120rem]:px-12", pathname === "/overview" && "[&>div.-mx-4]:m-0 [&>div.-mx-4]:min-h-0 [&>div.-mx-4]:p-0")}>{navigating ? <PageLoading /> : children}</main>
      </div>
    </div>
  );
}

function MatterMini({ matterId }: { matterId: string }) {
  const { state } = useStore();
  const progress = stats(state.requirements.filter((item) => item.matterId === matterId));
  return <p className="mt-1 px-3 text-[11px] text-rail-muted">{progress.pct}% accepted</p>;
}

function NavLink({
  href,
  active,
  icon: Icon,
  badge,
  onNavigate,
  children,
}: {
  href: string;
  active: boolean;
  icon: typeof Briefcase;
  badge?: number;
  onNavigate?: (href: string) => void;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      onNavigate={() => onNavigate?.(href)}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-9 items-center gap-2.5 rounded-md border-l-[3px] px-3 py-2 text-[13px] leading-5 text-rail-text",
        active ? "border-rail-indicator bg-rail-selected font-semibold" : "border-transparent font-medium hover:bg-rail-hover",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {badge ? (
        <span className="grid min-h-[18px] min-w-[18px] shrink-0 place-items-center rounded bg-rail-hover px-1 text-[11px] font-semibold leading-none text-rail-text">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
