"use client";

import { createContext, useContext, useMemo, useReducer, type ReactNode } from "react";
import { sectionLabel } from "./format";
import { baselineRequirements, blankIntake, slug, syncRequirements } from "./requirements";
import { initialState } from "./seed";
import { TEMPLATE_ID } from "./content";
import type {
  DocumentFile,
  Firm,
  Intake,
  Matter,
  MatterType,
  Requirement,
  RequirementStatus,
  SectionId,
  State,
} from "./types";

export type NewMatterInput = {
  clientFirst: string;
  clientLast: string;
  clientEmail: string;
  otherFirst: string;
  otherLast: string;
  state: string;
  county: string;
  matterType: MatterType;
  matterName: string;
};

type Action =
  | { type: "DISMISS_SUBMISSION_RECEIPT" }
  | { type: "CREATE_MATTER"; input: NewMatterInput; id: string }
  | { type: "UPDATE_FIRM"; patch: Partial<Firm> }
  | { type: "SEND_INVITE"; matterId: string }
  | { type: "SAVE_INTAKE"; matterId: string; intake: Intake; completedSection?: SectionId }
  | { type: "UPLOAD"; matterId: string; requirementId: string; filename: string; localFile?: File }
  | { type: "MARK_UNAVAILABLE"; requirementId: string; reason: string; note: string }
  | { type: "LINK_DOCUMENT"; requirementId: string; documentId: string }
  | { type: "REQUEST"; matterId: string; requirementIds: string[]; message: string }
  | { type: "ADD_REQUEST"; matterId: string; title: string; description: string }
  | { type: "SET_STATUS"; requirementId: string; status: RequirementStatus }
  | { type: "ACCEPT_DOCUMENT"; documentId: string }
  | { type: "REJECT_DOCUMENT"; documentId: string; note: string }
  | { type: "SUBMIT"; matterId: string }
  | { type: "MARK_COMPLETE"; matterId: string }
  | { type: "RETURN_TO_CLIENT"; matterId: string }
  | { type: "RESOLVE_DISCOVERY"; discoveryId: string; action: "ask" | "dismiss" };

function clientName(state: State, matterId: string) {
  const matter = state.matters.find((item) => item.id === matterId);
  const client = matter?.parties.find((party) => party.role === "CLIENT");
  return client ? `${client.firstName} ${client.lastName}` : "Client";
}

function activity(state: State, matterId: string, text: string, actor?: string) {
  return {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    matterId,
    at: new Date().toISOString(),
    actor: actor ?? state.firm.attorneyName,
    text,
  };
}

function liveDocs(documents: DocumentFile[], requirementId: string) {
  return documents.filter(
    (doc) =>
      doc.requirementIds.includes(requirementId) &&
      doc.status !== "REJECTED" &&
      doc.status !== "REPLACED",
  );
}

function syncRequirementFromDocs(requirements: Requirement[], documents: DocumentFile[], ids: string[]) {
  return requirements.map((requirement) => {
    if (!ids.includes(requirement.id)) return requirement;
    if (requirement.status === "WAIVED" || requirement.status === "NOT_APPLICABLE") return requirement;
    const live = liveDocs(documents, requirement.id);
    if (live.some((doc) => doc.status === "ACCEPTED")) {
      return { ...requirement, status: "ACCEPTED" as const, unavailableNote: undefined, unavailableReason: undefined };
    }
    if (live.length > 0) {
      return {
        ...requirement,
        status: "NEEDS_REVIEW" as const,
        unavailableNote: undefined,
        unavailableReason: undefined,
      };
    }
    if (requirement.status === "NOT_AVAILABLE") return requirement;
    return { ...requirement, status: "MISSING" as const };
  });
}

function documentFromRequirement(
  state: State,
  requirement: Requirement,
  filename: string,
): DocumentFile {
  const last4 = requirement.groupLabel?.match(/\*\*\*\*(\d{4})/)?.[1];
  return {
    id: `doc-${requirement.id}-${Date.now()}`,
    matterId: requirement.matterId,
    requirementIds: [requirement.id],
    filename,
    documentType: requirement.section === "bank" ? "Bank statement" : requirement.title,
    owner: clientName(state, requirement.matterId),
    institution: requirement.groupLabel,
    accountLastFour: last4,
    periodLabel: requirement.periodLabel,
    uploadedAt: new Date().toISOString(),
    uploadedBy: clientName(state, requirement.matterId),
    status: "NEEDS_REVIEW",
    pages: 2,
  };
}

function touchMatter(matters: Matter[], matterId: string, patch: Partial<Matter>, clientActivity = false) {
  return matters.map((matter) =>
    matter.id === matterId
      ? {
          ...matter,
          ...patch,
          lastClientActivity: clientActivity ? new Date().toISOString() : matter.lastClientActivity,
        }
      : matter,
  );
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "DISMISS_SUBMISSION_RECEIPT":
      return { ...state, submissionReceipt: undefined };
    case "UPDATE_FIRM":
      return { ...state, firm: { ...state.firm, ...action.patch } };
    case "CREATE_MATTER": {
      const id = action.id;
      const input = action.input;
      const name =
        input.matterName.trim() ||
        `${input.clientFirst.trim()} ${input.clientLast.trim()} v. ${input.otherFirst.trim()} ${input.otherLast.trim()}`;
      const matter: Matter = {
        id,
        name,
        matterType: input.matterType,
        state: input.state,
        county: input.county.trim(),
        templateId: TEMPLATE_ID,
        status: "DRAFT",
        createdAt: new Date().toISOString(),
        lastClientActivity: null,
        parties: [
          {
            id: `party-${id}-client`,
            role: "CLIENT",
            firstName: input.clientFirst.trim(),
            lastName: input.clientLast.trim(),
            email: input.clientEmail.trim(),
          },
          {
            id: `party-${id}-other`,
            role: "OTHER_PARTY",
            firstName: input.otherFirst.trim(),
            lastName: input.otherLast.trim(),
          },
        ],
      };
      return {
        ...state,
        matters: [matter, ...state.matters],
        intakes: { ...state.intakes, [id]: blankIntake(id) },
        requirements: [...baselineRequirements(id), ...state.requirements],
        activity: [activity(state, id, "Created the matter."), ...state.activity],
      };
    }
    case "SEND_INVITE":
      return {
        ...state,
        matters: touchMatter(state.matters, action.matterId, {
          status:
            state.matters.find((matter) => matter.id === action.matterId)?.status === "DRAFT"
              ? "INVITED"
              : state.matters.find((matter) => matter.id === action.matterId)?.status,
        }),
        activity: [activity(state, action.matterId, "Sent the client invitation."), ...state.activity],
      };
    case "SAVE_INTAKE": {
      const already = action.intake.completed.includes(action.completedSection ?? "personal");
      const completed =
        action.completedSection && !action.intake.completed.includes(action.completedSection)
          ? [...action.intake.completed, action.completedSection]
          : action.intake.completed;
      const intake = { ...action.intake, matterId: action.matterId, completed };
      const matter = state.matters.find((item) => item.id === action.matterId);
      const status =
        matter && (matter.status === "DRAFT" || matter.status === "INVITED")
          ? "CLIENT_IN_PROGRESS"
          : matter?.status;
      return {
        ...state,
        intakes: { ...state.intakes, [action.matterId]: intake },
        requirements: syncRequirements(state.requirements, intake, action.matterId),
        matters: touchMatter(state.matters, action.matterId, { status }, true),
        activity:
          action.completedSection && !already
            ? [
                activity(
                  state,
                  action.matterId,
                  `Completed the ${sectionLabel(action.completedSection).toLowerCase()} section.`,
                  clientName(state, action.matterId),
                ),
                ...state.activity,
              ]
            : state.activity,
      };
    }
    case "UPLOAD": {
      const requirement = state.requirements.find((item) => item.id === action.requirementId);
      if (!requirement || requirement.matterId !== action.matterId || !action.filename.trim()) return state;
      const documents = state.documents.map((doc) =>
        doc.requirementIds.includes(requirement.id) && doc.status === "NEEDS_REVIEW"
          ? { ...doc, status: "REPLACED" as const }
          : doc,
      );
      const nextDoc = documentFromRequirement(state, requirement, action.filename);
      nextDoc.localFile = action.localFile;
      if (action.localFile) nextDoc.pages = 0; // Unknown: no PDF extraction in this frontend demo.
      const nextDocs = [nextDoc, ...documents];
      const matter = state.matters.find((item) => item.id === action.matterId);
      return {
        ...state,
        documents: nextDocs,
        submissionReceipt: { matterId: requirement.matterId, requirementId: requirement.id, documentId: nextDoc.id, kind: "UPLOAD" },
        requirements: syncRequirementFromDocs(state.requirements, nextDocs, [requirement.id]),
        matters: touchMatter(
          state.matters,
          action.matterId,
          { status: matter?.status === "COMPLETE" ? "ATTORNEY_REVIEW" : "ATTORNEY_REVIEW" },
          true,
        ),
        activity: [
          activity(
            state,
            action.matterId,
            `Uploaded ${action.filename}.`,
            clientName(state, action.matterId),
          ),
          ...state.activity,
        ],
      };
    }
    case "MARK_UNAVAILABLE": {
      const requirement = state.requirements.find((item) => item.id === action.requirementId);
      if (!requirement || !action.reason.trim() || !action.note.trim()) return state;
      return {
        ...state,
        requirements: state.requirements.map((item) =>
          item.id === action.requirementId
            ? {
                ...item,
                status: "NOT_AVAILABLE",
              unavailableReason: action.reason.trim(),
              unavailableNote: action.note.trim(),
              }
            : item,
        ),
        matters: touchMatter(state.matters, requirement.matterId, {}, true),
        activity: [
          activity(
            state,
            requirement.matterId,
            `Marked “${requirement.title}” as unavailable. Reason: ${action.reason.trim()}. Explanation: ${action.note.trim()}`,
            clientName(state, requirement.matterId),
          ),
          ...state.activity,
        ],
      };
    }
    case "LINK_DOCUMENT": {
      const requirement = state.requirements.find((item) => item.id === action.requirementId);
      const document = state.documents.find((item) => item.id === action.documentId);
      if (!requirement || !document || requirement.matterId !== document.matterId || document.status === "REJECTED" || document.status === "REPLACED") return state;
      const documents = state.documents.map((item) =>
        item.id === document.id && !item.requirementIds.includes(requirement.id)
          ? { ...item, requirementIds: [...item.requirementIds, requirement.id] }
          : item,
      );
      return {
        ...state,
        documents,
        submissionReceipt: { matterId: requirement.matterId, requirementId: requirement.id, documentId: document.id, kind: "LINK" },
        requirements: syncRequirementFromDocs(state.requirements, documents, [requirement.id]),
        matters: touchMatter(state.matters, requirement.matterId, { status: "ATTORNEY_REVIEW" }, true),
        activity: [
          activity(
            state,
            requirement.matterId,
            `Linked ${document.filename} to “${requirement.title}”.`,
            clientName(state, requirement.matterId),
          ),
          ...state.activity,
        ],
      };
    }
    case "REQUEST": {
      if (!state.matters.some((matter) => matter.id === action.matterId) || !action.message.trim() || !action.requirementIds.length || action.requirementIds.some((id) => !state.requirements.some((item) => item.id === id && item.matterId === action.matterId))) return state;
      const count = action.requirementIds.length;
      return {
        ...state,
        requirements: state.requirements.map((item) =>
          action.requirementIds.includes(item.id) ? { ...item, status: "REQUESTED" } : item,
        ),
        matters: touchMatter(state.matters, action.matterId, {
          status: "WAITING_FOR_CLIENT",
          lastRequest: {
            at: new Date().toISOString(),
            message: action.message,
            requirementIds: action.requirementIds,
          },
        }),
        activity: [
          activity(
            state,
            action.matterId,
            `Requested ${count} document${count === 1 ? "" : "s"} in one message.`,
          ),
          ...state.activity,
        ],
      };
    }
    case "ADD_REQUEST": {
      const requirement: Requirement = {
        id: `req-custom-${action.matterId}-${slug(action.title)}-${Date.now()}`,
        matterId: action.matterId,
        section: "other",
        title: action.title.trim(),
        description: action.description.trim(),
        reason: "Added by the attorney.",
        source: "ATTORNEY",
        status: "REQUESTED",
        required: true,
      };
      return {
        ...state,
        requirements: [...state.requirements, requirement],
        matters: touchMatter(state.matters, action.matterId, { status: "WAITING_FOR_CLIENT" }),
        activity: [activity(state, action.matterId, `Requested “${requirement.title}”.`), ...state.activity],
      };
    }
    case "SET_STATUS": {
      const requirement = state.requirements.find((item) => item.id === action.requirementId);
      if (!requirement) return state;
      const label =
        action.status === "WAIVED" ? "Waived" : action.status === "NOT_APPLICABLE" ? "Marked not applicable" : "Updated";
      return {
        ...state,
        requirements: state.requirements.map((item) =>
          item.id === action.requirementId ? { ...item, status: action.status } : item,
        ),
        activity: [
          activity(state, requirement.matterId, `${label} “${requirement.title}”.`),
          ...state.activity,
        ],
      };
    }
    case "ACCEPT_DOCUMENT": {
      const document = state.documents.find((item) => item.id === action.documentId);
      if (!document || document.status !== "NEEDS_REVIEW") return state;
      const documents = state.documents.map((item) =>
        item.id === document.id
          ? {
              ...item,
              status: "ACCEPTED" as const,
              reviewedAt: new Date().toISOString(),
              reviewedBy: state.firm.attorneyName,
            }
          : item,
      );
      return {
        ...state,
        documents,
        requirements: syncRequirementFromDocs(state.requirements, documents, document.requirementIds),
        activity: [
          activity(state, document.matterId, `Accepted ${document.filename}.`),
          ...state.activity,
        ],
      };
    }
    case "REJECT_DOCUMENT": {
      const document = state.documents.find((item) => item.id === action.documentId);
      if (!document || document.status !== "NEEDS_REVIEW" || !action.note.trim()) return state;
      const documents = state.documents.map((item) =>
        item.id === document.id
          ? { ...item, status: "REJECTED" as const, rejectNote: action.note.trim(), reviewedAt: new Date().toISOString(), reviewedBy: state.firm.attorneyName }
          : item,
      );
      return {
        ...state,
        documents,
        requirements: syncRequirementFromDocs(state.requirements, documents, document.requirementIds),
        matters: touchMatter(state.matters, document.matterId, { status: "WAITING_FOR_CLIENT" }),
        activity: [
          activity(state, document.matterId, `Rejected ${document.filename}. Reason: ${action.note.trim()}`),
          ...state.activity,
        ],
      };
    }
    case "SUBMIT":
      return {
        ...state,
        matters: touchMatter(state.matters, action.matterId, { status: "CLIENT_SUBMITTED" }, true),
        activity: [
          activity(state, action.matterId, "Submitted the financial disclosure.", clientName(state, action.matterId)),
          ...state.activity,
        ],
      };
    case "MARK_COMPLETE":
      return {
        ...state,
        matters: touchMatter(state.matters, action.matterId, { status: "COMPLETE" }),
        activity: [activity(state, action.matterId, "Marked the collection complete."), ...state.activity],
      };
    case "RETURN_TO_CLIENT":
      return {
        ...state,
        matters: touchMatter(state.matters, action.matterId, { status: "WAITING_FOR_CLIENT" }),
        activity: [activity(state, action.matterId, "Returned the file to the client."), ...state.activity],
      };
    case "RESOLVE_DISCOVERY": {
      const discovery = state.discoveries.find((item) => item.id === action.discoveryId);
      if (!discovery) return state;
      if (action.action === "dismiss") {
        return {
          ...state,
          discoveries: state.discoveries.map((item) =>
            item.id === discovery.id ? { ...item, state: "dismissed" } : item,
          ),
          activity: [activity(state, discovery.matterId, `Dismissed “${discovery.title}”.`), ...state.activity],
        };
      }
      const requirement: Requirement = {
        id: `req-discovery-${discovery.id}`,
        matterId: discovery.matterId,
        section: "investments",
        title: "Confirm Fidelity investment account",
        description: discovery.detail,
        reason: "A filed tax return shows Fidelity investment income, and no matching brokerage account was reported.",
        source: "AI_DISCOVERY",
        status: "REQUESTED",
        required: true,
        groupLabel: "Fidelity",
      };
      return {
        ...state,
        discoveries: state.discoveries.map((item) =>
          item.id === discovery.id ? { ...item, state: "asked" } : item,
        ),
        requirements: [...state.requirements, requirement],
        matters: touchMatter(state.matters, discovery.matterId, { status: "WAITING_FOR_CLIENT" }),
        activity: [
          activity(state, discovery.matterId, "Asked the client to confirm a possible Fidelity account."),
          ...state.activity,
        ],
      };
    }
    default:
      return state;
  }
}

type Store = {
  dismissSubmissionReceipt: () => void;
  state: State;
  createMatter: (input: NewMatterInput) => string;
  updateFirm: (patch: Partial<Firm>) => void;
  sendInvitation: (matterId: string) => void;
  saveIntake: (matterId: string, intake: Intake, completedSection?: SectionId) => void;
  uploadToRequirement: (matterId: string, requirementId: string, filename: string, localFile?: File) => void;
  markUnavailable: (requirementId: string, reason: string, note: string) => void;
  linkExistingDocument: (requirementId: string, documentId: string) => void;
  requestDocuments: (matterId: string, requirementIds: string[], message: string) => void;
  addCustomRequest: (matterId: string, title: string, description: string) => void;
  setRequirementStatus: (requirementId: string, status: RequirementStatus) => void;
  acceptDocument: (documentId: string) => void;
  rejectDocument: (documentId: string, note: string) => void;
  submitDisclosure: (matterId: string) => void;
  markComplete: (matterId: string) => void;
  returnToClient: (matterId: string) => void;
  resolveDiscovery: (discoveryId: string, action: "ask" | "dismiss") => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const api = useMemo<Store>(
    () => ({
      state,
      dismissSubmissionReceipt: () => dispatch({ type: "DISMISS_SUBMISSION_RECEIPT" }),
      createMatter: (input) => {
        const id = `matter-${Date.now().toString(36)}`;
        dispatch({ type: "CREATE_MATTER", input, id });
        return id;
      },
      updateFirm: (patch) => dispatch({ type: "UPDATE_FIRM", patch }),
      sendInvitation: (matterId) => dispatch({ type: "SEND_INVITE", matterId }),
      saveIntake: (matterId, intake, completedSection) =>
        dispatch({ type: "SAVE_INTAKE", matterId, intake, completedSection }),
      uploadToRequirement: (matterId, requirementId, filename, localFile) =>
        dispatch({ type: "UPLOAD", matterId, requirementId, filename, localFile }),
      markUnavailable: (requirementId, reason, note) =>
        dispatch({ type: "MARK_UNAVAILABLE", requirementId, reason, note }),
      linkExistingDocument: (requirementId, documentId) =>
        dispatch({ type: "LINK_DOCUMENT", requirementId, documentId }),
      requestDocuments: (matterId, requirementIds, message) =>
        dispatch({ type: "REQUEST", matterId, requirementIds, message }),
      addCustomRequest: (matterId, title, description) =>
        dispatch({ type: "ADD_REQUEST", matterId, title, description }),
      setRequirementStatus: (requirementId, status) =>
        dispatch({ type: "SET_STATUS", requirementId, status }),
      acceptDocument: (documentId) => dispatch({ type: "ACCEPT_DOCUMENT", documentId }),
      rejectDocument: (documentId, note) => dispatch({ type: "REJECT_DOCUMENT", documentId, note }),
      submitDisclosure: (matterId) => dispatch({ type: "SUBMIT", matterId }),
      markComplete: (matterId) => dispatch({ type: "MARK_COMPLETE", matterId }),
      returnToClient: (matterId) => dispatch({ type: "RETURN_TO_CLIENT", matterId }),
      resolveDiscovery: (discoveryId, action) =>
        dispatch({ type: "RESOLVE_DISCOVERY", discoveryId, action }),
    }),
    [state],
  );
  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("useStore must be used within StoreProvider");
  return store;
}
