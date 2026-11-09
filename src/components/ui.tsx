"use client";

import { useId, type ButtonHTMLAttributes, type ReactNode } from "react";
import MuiDialog from "@mui/material/Dialog";
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
        "min-h-10 rounded-md border px-3 py-2 text-left text-sm leading-[21px] transition-colors duration-120 motion-reduce:transition-none",
        checked ? "border-brand bg-brand-soft font-medium text-brand" : "border-border-strong bg-surface hover:bg-surface-subtle",
      )}
      aria-pressed={checked}
    >
      {children}
    </button>
  );
}

const REQUIREMENT_TONE: Record<RequirementStatus, string> = {
  MISSING: "bg-neutral-bg text-neutral-text",
  REQUESTED: "bg-review-bg text-review-text",
  UPLOADED: "bg-review-bg text-review-text",
  NEEDS_REVIEW: "bg-review-bg text-review-text",
  ACCEPTED: "bg-success-bg text-success-text",
  NOT_AVAILABLE: "bg-neutral-bg text-neutral-text",
  NOT_APPLICABLE: "bg-neutral-bg text-neutral-text",
  WAIVED: "bg-neutral-bg text-neutral-text",
};

const MATTER_TONE: Record<MatterStatus, string> = {
  DRAFT: "bg-neutral-bg text-neutral-text",
  INVITED: "bg-neutral-bg text-neutral-text",
  CLIENT_IN_PROGRESS: "bg-neutral-bg text-neutral-text",
  CLIENT_SUBMITTED: "bg-review-bg text-review-text",
  ATTORNEY_REVIEW: "bg-review-bg text-review-text",
  WAITING_FOR_CLIENT: "bg-review-bg text-review-text",
  COMPLETE: "bg-success-bg text-success-text",
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
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-xs font-medium leading-[18px]", tone)}>
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
    { n: accepted, className: "bg-success-text" },
    { n: review, className: "bg-review-text" },
    { n: unavailable, className: "bg-border-strong" },
    { n: missing, className: "bg-neutral-text" },
  ];
  return (
    <div
      role="img"
      aria-label={`${accepted} accepted, ${review} awaiting review, ${unavailable} unavailable, ${missing} missing out of ${total}`}
      className="flex h-1.5 overflow-hidden rounded-full bg-line"
    >
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
    <div className="mb-6 flex min-h-20 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="text-xs font-medium leading-[18px] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="break-words text-[28px] font-semibold leading-9 tracking-tight">{title}</h1>
        {description ? <p className="mt-1.5 max-w-2xl text-sm leading-[21px] text-muted">{description}</p> : null}
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

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      aria-labelledby={titleId}
      fullWidth
      maxWidth={false}
      transitionDuration={0}
      slotProps={{
        paper: {
          sx: {
            m: "16px",
            width: "calc(100% - 32px)",
            maxWidth: 512,
            maxHeight: "min(720px, calc(100dvh - 32px))",
          },
        },
        backdrop: { sx: { backgroundColor: "#20292759" } },
      }}
    >
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4">
        <h2 id={titleId} className="min-w-0 break-words text-base font-semibold leading-6">
          {title}
        </h2>
        <button className="btn btn-ghost h-8 shrink-0 px-2" onClick={onClose} type="button" autoFocus>
          Close
        </button>
      </div>
      <div className="min-h-0 overflow-y-auto px-5 py-4">{children}</div>
      {footer ? <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div> : null}
    </MuiDialog>
  );
}
