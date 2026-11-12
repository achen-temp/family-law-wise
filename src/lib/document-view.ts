import { matterTitle, personName } from "./format";
import type { DocumentFile, Matter, Requirement } from "./types";

export function documentSourceLabel(document: DocumentFile) {
  return document.localFile ? "Local upload" : "Demo sample";
}

export function linkedRequirementContext(document: DocumentFile, requirements: Requirement[]) {
  const labels = requirements
    .filter((requirement) => requirement.matterId === document.matterId && document.requirementIds.includes(requirement.id))
    .map((requirement) => `${requirement.groupLabel ? `${requirement.groupLabel} · ` : ""}${requirement.title}`);

  return {
    labels,
    summary: labels.length ? labels.join(", ") : "Removed checklist request",
    removed: labels.length === 0,
  };
}

export function documentSearchText(document: DocumentFile, matter: Matter | undefined, requirements: Requirement[]) {
  const people = matter?.parties.map((party) => personName(party)).join(" ") ?? "";
  const requirement = linkedRequirementContext(document, requirements);
  return [
    document.filename,
    document.documentType,
    document.owner,
    document.uploadedBy,
    document.institution,
    document.periodLabel,
    documentSourceLabel(document),
    matter?.name,
    matter ? matterTitle(matter) : document.matterId,
    people,
    requirement.summary,
  ].filter(Boolean).join(" ").toLowerCase();
}

export type DocumentVersion = { position: number; total: number; current: boolean };

export function documentVersions(documents: DocumentFile[]) {
  const result = new Map<string, DocumentVersion>();

  for (const document of documents) {
    const related = documents
      .filter((candidate) =>
        candidate.matterId === document.matterId &&
        candidate.requirementIds.some((id) => document.requirementIds.includes(id)))
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
    const position = related.findIndex((candidate) => candidate.id === document.id) + 1;
    result.set(document.id, { position, total: related.length, current: position === 1 });
  }

  return result;
}
