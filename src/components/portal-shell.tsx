"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import {
  Check,
  Circle,
  ClipboardList,
  Home,
  Inbox,
  ListChecks,
  Menu,
} from "lucide-react";
import { CHECKLIST_SECTIONS, INTAKE_STEPS } from "@/lib/content";
import { cn, initials, personName, clientParty } from "@/lib/format";
import { useStore } from "@/lib/store";

export function PortalShell({ token, children }: { token: string; children: ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
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
  const requested = state.requirements.filter(
    (item) => item.matterId === matter.id && item.status === "REQUESTED",
  ).length;
  const missing = state.requirements.filter(
    (item) =>
      item.matterId === matter.id &&
      CHECKLIST_SECTIONS.includes(item.section) &&
      (item.status === "MISSING" || item.status === "REQUESTED"),
  ).length;
  const questionnaireOpen = INTAKE_STEPS.filter((step) => !intake.completed.includes(step.id)).length;

  const nav = (
    <div className="flex h-full flex-col bg-sidebar">
      <Link href={`/portal/${token}`} className="flex items-center gap-2.5 bg-white px-4 py-4 text-foreground">
        <span className="grid size-9 place-items-center rounded-xl bg-brand text-sm font-semibold text-white">W</span>
        <span>
          <span className="block text-[15px] font-semibold leading-none">Family Law Wise</span>
          <span className="mt-1 block text-[11px] text-muted">{state.firm.name}</span>
        </span>
      </Link>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-4 pt-3">
        <NavLink href={`/portal/${token}`} active={pathname === `/portal/${token}`} icon={Home}>
          Home
        </NavLink>
        <NavLink
          href={`/portal/${token}/intake/${INTAKE_STEPS.find((step) => !intake.completed.includes(step.id))?.id ?? INTAKE_STEPS[0].id}`}
          active={pathname.includes("/intake")}
          icon={ClipboardList}
          badge={questionnaireOpen}
        >
          Questionnaire
        </NavLink>
        <NavLink
          href={`/portal/${token}/checklist`}
          active={pathname.startsWith(`/portal/${token}/checklist`)}
          icon={ListChecks}
          badge={missing}
        >
          Checklist
        </NavLink>
        <NavLink
          href={`/portal/${token}/requests`}
          active={pathname.startsWith(`/portal/${token}/requests`)}
          icon={Inbox}
          badge={requested}
        >
          Requests
        </NavLink>
        <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">Sections</p>
        {INTAKE_STEPS.map((step) => {
          const href = `/portal/${token}/intake/${step.id}`;
          const done = intake.completed.includes(step.id);
          return (
            <Link
              key={step.id}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-sm text-white",
                pathname === href ? "bg-white/20 font-semibold" : "hover:bg-white/10",
              )}
            >
              {done ? <Check className="size-3.5 text-emerald-300" /> : <Circle className="size-3.5 text-white/50" />}
              <span className="truncate">{step.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-3">
        <div className="rounded-xl bg-white p-3 text-foreground shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-full bg-brand-soft text-xs font-semibold text-brand">
              {initials(client)}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold">{client}</span>
              <span className="block truncate text-xs text-muted">Client</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <aside className="fixed inset-y-0 left-0 hidden w-[240px] md:block">{nav}</aside>
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
          <span className="truncate text-sm font-medium">{client}</span>
        </div>
        <main className="w-full max-w-6xl px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
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
  icon: typeof Home;
  badge?: number;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
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
