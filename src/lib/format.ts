import type { Matter, MatterStatus, Requirement, RequirementStatus, SectionId } from "./types";

const SECTION_LABEL: Record<SectionId, string> = {
  personal: "Personal information",
  employment: "Employment",
  income: "Income",
  tax: "Tax returns",
  bank: "Bank accounts",
  investments: "Investments",
  retirement: "Retirement",
  real_estate: "Real estate",
  debts: "Debts",
  credit: "Credit cards",
  loans: "Loans",
  insurance: "Insurance",
  business: "Business interests",
  other: "Other requests",
};

export function sectionLabel(id: SectionId) {
  return SECTION_LABEL[id];
}

export const REQUIREMENT_LABEL: Record<RequirementStatus, string> = {
  MISSING: "Missing",
  REQUESTED: "Requested",
  UPLOADED: "Uploaded",
  NEEDS_REVIEW: "Needs review",
  ACCEPTED: "Accepted",
  NOT_AVAILABLE: "Unavailable",
  NOT_APPLICABLE: "Not applicable",
  WAIVED: "Waived",
};

export const MATTER_LABEL: Record<MatterStatus, string> = {
  DRAFT: "Draft",
  INVITED: "Invited",
  CLIENT_IN_PROGRESS: "In progress",
  CLIENT_SUBMITTED: "Submitted",
  ATTORNEY_REVIEW: "Needs review",
  WAITING_FOR_CLIENT: "Waiting on client",
  COMPLETE: "Complete",
};

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(iso));
}

export function formatMoney(raw: string) {
  const n = Number(String(raw).replace(/[^0-9.]/g, ""));
  if (!raw || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function clientParty(matter: Matter) {
  return matter.parties.find((party) => party.role === "CLIENT");
}

export function otherParty(matter: Matter) {
  return matter.parties.find((party) => party.role === "OTHER_PARTY");
}

export function personName(party?: { firstName: string; lastName: string }) {
  if (!party) return "—";
  return `${party.firstName} ${party.lastName}`.trim();
}

export function matterTitle(matter: Matter) {
  return `${personName(clientParty(matter))} v. ${personName(otherParty(matter))}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export type ProgressStats = {
  accepted: number;
  review: number;
  unavailable: number;
  missing: number;
  total: number;
  pct: number;
};

export function stats(requirements: Requirement[]): ProgressStats {
  const applicable = requirements.filter(
    (item) => item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED",
  );
  const accepted = applicable.filter((item) => item.status === "ACCEPTED").length;
  const review = applicable.filter(
    (item) => item.status === "NEEDS_REVIEW" || item.status === "UPLOADED",
  ).length;
  const unavailable = applicable.filter((item) => item.status === "NOT_AVAILABLE").length;
  const missing = applicable.filter(
    (item) => item.status === "MISSING" || item.status === "REQUESTED",
  ).length;
  const total = applicable.length;
  const pct = total === 0 ? 0 : Math.round((accepted / total) * 100);
  return { accepted, review, unavailable, missing, total, pct };
}

export function currentDocuments<T extends { requirementIds: string[]; status: string; uploadedAt: string }>(
  documents: T[],
  requirementId: string,
) {
  return documents
    .filter(
      (doc) =>
        doc.requirementIds.includes(requirementId) &&
        doc.status !== "REJECTED" &&
        doc.status !== "REPLACED",
    )
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
}
