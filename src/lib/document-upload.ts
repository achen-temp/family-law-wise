export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const DOCUMENT_ACCEPT = "application/pdf,image/png,image/jpeg";

const DOCUMENT_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);
const EXTENSION_TYPES: Record<string, string> = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

export function documentType(file: Pick<File, "name" | "type">) {
  if (DOCUMENT_TYPES.has(file.type)) return file.type;
  if (file.type) return null;
  return EXTENSION_TYPES[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? null;
}

export function validateDocumentFile(file: File): string | null {
  if (file.size === 0) return "Choose a file that is not empty.";
  if (!documentType(file)) return "Choose a PDF, JPG, or PNG file.";
  if (file.size > MAX_DOCUMENT_BYTES) return "Choose a file no larger than 10 MB.";
  return null;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
