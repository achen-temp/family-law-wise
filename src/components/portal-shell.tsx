"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  Circle,
  ChevronDown,
  ClipboardList,
  Home,
  Inbox,
  ListChecks,
  Menu,
  MessageSquare,
} from "lucide-react";
import { CHECKLIST_SECTIONS, INTAKE_STEPS } from "@/lib/content";
import { cn, initials, personName, clientParty, matterTitle } from "@/lib/format";
import { useStore } from "@/lib/store";
import { unreadCount } from "@/lib/messaging";
import { WiseAi } from "@/components/wise-ai/wise-ai";
import { clientRequests } from "@/lib/document-selectors";
import { DemoViewSwitcher } from "@/components/demo-view-switcher";
import { PageLoading } from "@/components/page-loading";

export function PortalShell({ token, children }: { token: string; children: ReactNode }) {
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
  const matter = state.matters.find((item) => item.id === token);
  const intake = state.intakes[token];

  if (!matter || !intake) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6">
        <div className="card max-w-md p-8 text-center">
          <p className="text-2xl font-semibold">This link is not valid</p>
          <p className="mt-2 text-sm text-muted">Ask your attorney to send a new invitation.</p>
        </div>
      </div>
    );
  }

  const client = personName(clientParty(matter));
  const requested = clientRequests(state, matter.id).length;
  const missing = state.requirements.filter(
    (item) =>
      item.matterId === matter.id &&
      CHECKLIST_SECTIONS.includes(item.section) &&
      (item.status === "MISSING" || item.status === "REQUESTED"),
  ).length;
  const questionnaireOpen = INTAKE_STEPS.filter((step) => !intake.completed.includes(step.id)).length;
  const activePath = pendingPath && pendingPath !== pathname ? pendingPath : pathname;
  const navigating = activePath !== pathname;

  const chapter = INTAKE_STEPS.find((step) => pathname === `/portal/${token}/intake/${step.id}`);
  const pageLabel = chapter?.label ?? (pathname.includes("/intake") ? "Questionnaire" : pathname.includes("/checklist") ? "Checklist" : pathname.includes("/requests") ? "Requests" : pathname.includes("/messages") ? "Messages" : pathname.includes("/documents") ? "Submitted files" : "Home");

  const nav = (
    <div className="flex h-full flex-col bg-sidebar text-rail-text">
      <Link href={`/portal/${token}`} className="flex h-[72px] shrink-0 items-center gap-2.5 px-4 text-rail-text">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-rail-selected text-sm font-semibold">W</span>
        <span className="min-w-0">
          <span className="block text-[13px] font-semibold leading-5 tracking-tight">Family Law Wise</span>
          <span className="block truncate text-[11px] text-rail-muted" title={state.firm.name}>{state.firm.name}</span>
        </span>
      </Link>
      <div className="shrink-0 border-y border-rail-hover px-5 py-3">
        <p className="text-[11px] text-rail-muted">Your matter</p>
        <p className="mt-1 line-clamp-3 break-words text-[13px] font-semibold leading-5" title={matterTitle(matter)}>{matterTitle(matter)}</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4 pt-3">
      <nav aria-label="Client navigation" className="space-y-0.5">
        <NavLink href={`/portal/${token}`} active={activePath === `/portal/${token}`} icon={Home} onNavigate={setPendingPath}>
          Home
        </NavLink>
        <NavLink
          href={`/portal/${token}/intake/${INTAKE_STEPS.find((step) => !intake.completed.includes(step.id))?.id ?? INTAKE_STEPS[0].id}`}
          active={activePath.includes("/intake")}
          icon={ClipboardList}
          badge={questionnaireOpen}
          onNavigate={setPendingPath}
        >
          Questionnaire
        </NavLink>
        <NavLink
          href={`/portal/${token}/checklist`}
          active={activePath.startsWith(`/portal/${token}/checklist`)}
          icon={ListChecks}
          badge={missing}
          onNavigate={setPendingPath}
        >
          Checklist
        </NavLink>
        <NavLink
          href={`/portal/${token}/requests`}
          active={activePath.startsWith(`/portal/${token}/requests`)}
          icon={Inbox}
          badge={requested}
          onNavigate={setPendingPath}
        >
          Requests
        </NavLink>
        <NavLink href={`/portal/${token}/messages`} active={activePath.startsWith(`/portal/${token}/messages`)} icon={MessageSquare} badge={unreadCount(state, "CLIENT", token)} onNavigate={setPendingPath}>Messages</NavLink>
        <NavLink href={`/portal/${token}/documents`} active={activePath.startsWith(`/portal/${token}/documents`)} icon={ClipboardList} onNavigate={setPendingPath}>Submitted files</NavLink>
      </nav>
      <details open={pathname.includes("/intake/")} className="group mt-4 border-t border-rail-hover pt-2">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between gap-2 rounded-md px-3 text-xs font-medium text-rail-muted hover:bg-rail-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rail-indicator [&::-webkit-details-marker]:hidden">
          Questionnaire sections
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 group-open:rotate-180" />
        </summary>
        <nav aria-label="Questionnaire sections" className="mt-1 space-y-0.5">
          {INTAKE_STEPS.map((step) => {
            const href = `/portal/${token}/intake/${step.id}`;
            const done = intake.completed.includes(step.id);
            const dirty = state.intakeDirtySections?.[token]?.includes(step.id);
            return (
              <Link key={step.id} href={href} onNavigate={() => setPendingPath(href)} aria-current={activePath === href ? "page" : undefined} className={cn("flex min-h-8 items-center gap-2 rounded-md border-l-[3px] px-3 py-1.5 text-xs leading-5", activePath === href ? "border-rail-indicator bg-rail-selected font-semibold" : "border-transparent text-rail-muted hover:bg-rail-hover")}>
                {done && !dirty ? <Check aria-hidden="true" className="size-3.5 shrink-0" /> : <Circle aria-hidden="true" className="size-3.5 shrink-0" />}
                <span className="min-w-0 flex-1 break-words">{step.label}</span>
                {dirty ? <span className="text-[10px]">Draft</span> : <span className="sr-only">{done ? "Confirmed" : "Not started"}</span>}
              </Link>
            );
          })}
        </nav>
      </details>
      </div>
      <div className="shrink-0 space-y-2 border-t border-rail-hover p-3">
        <WiseAi role="CLIENT" matterId={token} />
        <div className="flex min-h-12 items-center gap-2.5 px-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-rail-selected text-xs font-semibold">{initials(client)}</span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium" title={client}>{client}</span>
            <span className="block text-[11px] text-rail-muted">Client</span>
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas">
      <aside aria-label="Client sidebar" className="fixed inset-y-0 left-0 z-20 hidden w-56 md:block">{nav}</aside>
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
              <li className="min-w-0 truncate" title={matterTitle(matter)}><Link href={`/portal/${token}`} className="hover:text-foreground">{matterTitle(matter)}</Link></li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="shrink-0 font-medium text-foreground" title={pageLabel}>{pageLabel}</li>
            </ol>
          </nav>
          <DemoViewSwitcher role="Client" matter={matter} />
        </header>
        <main className={cn("mx-auto w-full max-w-[1696px] px-4 py-6 md:px-6 min-[90rem]:px-8 min-[120rem]:px-12", pathname === `/portal/${token}` && "[&>div.-mx-4]:m-0 [&>div.-mx-4]:min-h-0 [&>div.-mx-4]:p-0")}>{navigating ? <PageLoading /> : children}</main>
      </div>
    </div>
  );
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
  icon: typeof Home;
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
