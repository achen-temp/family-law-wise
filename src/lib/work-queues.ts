import type { Matter, State } from "./types";

export const WORK_QUEUES = [
  { id: "review", label: "Ready for review", hint: "Submissions, files, or unavailable explanations to review" },
  { id: "waiting", label: "Waiting on a client", hint: "Invited, collecting answers, or asked for more information" },
  { id: "draft", label: "Drafts", hint: "Prepare the matter and client invitation" },
  { id: "complete", label: "Complete", hint: "Matters marked complete by the attorney" },
] as const;

export type WorkQueue = (typeof WORK_QUEUES)[number]["id"];
export type QueueFilter = WorkQueue | "all" | "open";

export function parseQueue(value?: string): QueueFilter {
  return value === "open" ? "open" : WORK_QUEUES.find((queue) => queue.id === value)?.id ?? "all";
}

export function matterReviewSummary(state: State, matter: Matter) {
  const requirements = state.requirements.filter(
    (item) => item.matterId === matter.id && item.status !== "NOT_APPLICABLE" && item.status !== "WAIVED",
  );
  const pendingFiles = state.documents.filter(
    (doc) => doc.matterId === matter.id && doc.status === "NEEDS_REVIEW" &&
      (doc.requirementIds.length === 0 || requirements.some((item) => doc.requirementIds.includes(item.id))),
  ).length;
  const explanations = requirements.filter((item) => item.status === "NOT_AVAILABLE").length;
  const pendingRequirements = requirements.filter((item) => item.status === "NEEDS_REVIEW" || item.status === "UPLOADED").length;
  return { pendingFiles, explanations, pendingRequirements };
}

export function matterQueue(state: State, matter: Matter): WorkQueue {
  if (matter.status === "COMPLETE") return "complete";
  const { pendingFiles, explanations, pendingRequirements } = matterReviewSummary(state, matter);
  if (
    matter.status === "CLIENT_SUBMITTED" || matter.status === "ATTORNEY_REVIEW" || pendingFiles > 0 || explanations > 0 || pendingRequirements > 0
  ) return "review";
  return matter.status === "DRAFT" ? "draft" : "waiting";
}

export function workspaceCounts(state: State) {
  const counts = { all: state.matters.length, open: 0, review: 0, waiting: 0, draft: 0, complete: 0 };
  for (const matter of state.matters) {
    const queue = matterQueue(state, matter);
    counts[queue] += 1;
    if (queue !== "complete") counts.open += 1;
  }
  return counts;
}

export function matterMatchesQuery(matter: Matter, query: string) {
  const needle = query.trim().toLowerCase();
  const text = [matter.name, matter.county, matter.state, ...matter.parties.map((party) => `${party.firstName} ${party.lastName}`)].join(" ").toLowerCase();
  return text.includes(needle);
}
