import type { DocumentFile, State } from "./types";

export function latestDocument(documents: DocumentFile[], requirementId: string) {
  return documents.filter((doc) => doc.requirementIds.includes(requirementId))
    .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))[0];
}

export function clientRequests(state: State, matterId: string) {
  return state.requirements.filter((item) => item.matterId === matterId && (
    item.status === "REQUESTED" ||
    (item.status === "MISSING" && latestDocument(state.documents, item.id)?.status === "REJECTED")
  ));
}
