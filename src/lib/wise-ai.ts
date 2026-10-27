import { INTAKE_STEPS } from "./content";
import { needsReply, unreadCount } from "./messaging";
import type { ConversationRole, State } from "./types";

export type NextStep = {
  id: string;
  title: string;
  detail: string;
  href: string;
  label: string;
};

export function nextSteps(
  state: State,
  matterId: string,
  role: ConversationRole,
): NextStep[] {
  const matter = state.matters.find((item) => item.id === matterId);
  if (!matter) return [];
  const base =
    role === "CLIENT" ? `/portal/${matterId}` : `/matters/${matterId}`;
  const result: NextStep[] = [];
  const thread = state.threads.find(
    (item) =>
      item.matterId === matterId &&
      (unreadCount(state, role, matterId, item.id) > 0 ||
        needsReply(state, item.id, role)),
  );
  if (thread)
    result.push({
      id: `message-${thread.id}`,
      title: "Reply to a message",
      detail: `Continue “${thread.subject}” with ${role === "CLIENT" ? "your legal team" : "your client"}.`,
      href: `${base}/messages?thread=${encodeURIComponent(thread.id)}`,
      label: "Open conversation",
    });
  if (matter.status === "COMPLETE") {
    result.push({
      id: "complete",
      title: "Collection complete",
      detail:
        "Your matter is marked complete. You can review its checklist or use Messages for any follow-up.",
      href: `${base}/checklist`,
      label: "View checklist",
    });
    return result;
  }
  const intake = state.intakes[matterId];
  const incomplete = INTAKE_STEPS.find(
    (step) => !intake?.completed.includes(step.id),
  );
  if (incomplete)
    result.push({
      id: `intake-${incomplete.id}`,
      title:
        role === "CLIENT"
          ? `Complete ${incomplete.label.toLowerCase()}`
          : "Review the incomplete questionnaire",
      detail:
        "Questionnaire answers help determine which documents are needed.",
      href:
        role === "CLIENT"
          ? `${base}/intake/${incomplete.id}`
          : `${base}/intake`,
      label: "Open questionnaire",
    });
  const requirements = state.requirements.filter(
    (item) => item.matterId === matterId,
  );
  if (role === "ATTORNEY") {
    const document = state.documents.find(
      (item) => item.matterId === matterId && item.status === "NEEDS_REVIEW",
    );
    if (document)
      result.push({
        id: `review-${document.id}`,
        title: "Review an uploaded document",
        detail: document.filename,
        href: `${base}/documents/${document.id}`,
        label: "Review file",
      });
    const unresolved = requirements.filter((item) =>
      ["MISSING", "REQUESTED", "NOT_AVAILABLE"].includes(item.status),
    );
    if (unresolved.length)
      result.push({
        id: "requirements",
        title: `${unresolved.length} checklist items need attention`,
        detail:
          "Review missing documents and client explanations before following up.",
        href: `${base}/checklist`,
        label: "Open checklist",
      });
  } else {
    const requested =
      requirements.find((item) => item.status === "REQUESTED") ??
      requirements.find((item) => item.status === "MISSING");
    if (requested)
      result.push({
        id: `upload-${requested.id}`,
        title: requested.title,
        detail: `${requested.groupLabel ? `${requested.groupLabel}. ` : ""}Upload this document, or explain why you cannot provide it.`,
        href: `${base}/checklist/${requested.id}`,
        label: "Open checklist item",
      });
    if (
      !requested &&
      requirements.some((item) =>
        ["UPLOADED", "NEEDS_REVIEW", "NOT_AVAILABLE"].includes(item.status),
      )
    )
      result.push({
        id: "waiting",
        title: "Waiting for your legal team",
        detail:
          "Your documents or explanations need review. Uploaded does not yet mean accepted.",
        href: `${base}/checklist`,
        label: "View status",
      });
  }
  if (!result.length)
    result.push({
      id: "review-checklist",
      title: "Review your checklist",
      detail:
        role === "CLIENT"
          ? "Check your information and the submission status with your legal team."
          : "Review the collection and its completion requirements.",
      href: `${base}/checklist`,
      label: "Open checklist",
    });
  return result.slice(0, 3);
}

export function generalAnswer(question: string) {
  if (/cannot|can't|unavailable|missing/i.test(question))
    return "Open the relevant checklist item and use the option to explain why you cannot provide the document. Your legal team can review that explanation and tell you what to do next.";
  if (/review|accept|upload|document/i.test(question))
    return "Uploading a document puts it in the review queue. Your attorney checks it against the checklist and can accept it or ask for a replacement. Progress is based on checklist requirements, not the number of files.";
  return "This demo can explain the portal workflow and help you find your next task. It cannot assess your case or provide a legal opinion. You can send your question to your attorney for advice about your situation.";
}
