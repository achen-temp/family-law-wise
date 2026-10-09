"use client";

import { useEffect, useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/format";
import type { MatterStatus, RequirementStatus } from "@/lib/types";

export function Button({
  variant = "secondary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  return <button className={cn("btn", `btn-${variant}`, className)} {...props} />;
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs leading-relaxed text-muted">{hint}</span> : null}
    </label>
  );
}

export function Choice({
  checked,
  onClick,
  children,
}: {
  checked: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
        checked ? "border-brand bg-brand-soft font-medium text-brand" : "border-line bg-white hover:bg-[#f4f7fd]",
      )}
      aria-pressed={checked}
    >
      {children}
    </button>
  );
}

const REQUIREMENT_TONE: Record<RequirementStatus, string> = {
  MISSING: "bg-rose-50 text-rose-800",
  REQUESTED: "bg-amber-50 text-amber-900",
  UPLOADED: "bg-sky-50 text-sky-900",
  NEEDS_REVIEW: "bg-sky-50 text-sky-900",
  ACCEPTED: "bg-emerald-50 text-emerald-900",
  NOT_AVAILABLE: "bg-stone-100 text-stone-700",
  NOT_APPLICABLE: "bg-stone-100 text-stone-500",
  WAIVED: "bg-stone-100 text-stone-500",
};

const MATTER_TONE: Record<MatterStatus, string> = {
  DRAFT: "bg-stone-100 text-stone-700",
  INVITED: "bg-amber-50 text-amber-900",
  CLIENT_IN_PROGRESS: "bg-sky-50 text-sky-900",
  CLIENT_SUBMITTED: "bg-violet-50 text-violet-900",
  ATTORNEY_REVIEW: "bg-sky-50 text-sky-900",
  WAITING_FOR_CLIENT: "bg-amber-50 text-amber-900",
  COMPLETE: "bg-emerald-50 text-emerald-900",
};

export function StatusPill({
  status,
  label,
  kind = "requirement",
}: {
  status: RequirementStatus | MatterStatus;
  label: string;
  kind?: "requirement" | "matter";
}) {
  const tone = kind === "matter" ? MATTER_TONE[status as MatterStatus] : REQUIREMENT_TONE[status as RequirementStatus];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium", tone)}>
      {label}
    </span>
  );
}

export function StackedBar({
  accepted,
  review,
  unavailable,
  missing,
  total,
}: {
  accepted: number;
  review: number;
  unavailable: number;
  missing: number;
  total: number;
}) {
  if (total === 0) return <div className="h-1.5 rounded-full bg-line" />;
  const parts = [
    { n: accepted, className: "bg-brand" },
    { n: review, className: "bg-sky-700" },
    { n: unavailable, className: "bg-stone-400" },
    { n: missing, className: "bg-rose-700/85" },
  ];
  return (
    <div className="flex h-1.5 overflow-hidden rounded-full bg-line">
      {parts.map((part) =>
        part.n > 0 ? (
          <div key={part.className} className={part.className} style={{ width: `${(part.n / total) * 100}%` }} />
        ) : null,
      )}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand">{eyebrow}</p>
        ) : null}
        <h1 className="text-[1.65rem] font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button className="absolute inset-0 bg-[#1c2420]/35" aria-label="Close dialog" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(720px,calc(100vh-2rem))] w-full max-w-lg flex-col rounded-2xl border border-line bg-card shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold">
            {title}
          </h2>
          <button className="btn btn-ghost h-8 px-2" onClick={onClose} type="button">
            Close
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
