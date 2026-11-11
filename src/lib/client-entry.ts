import type { Matter } from "./types";

export function clientMattersForEmail(matters: Matter[], email: string) {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];
  return matters.filter((matter) => matter.status !== "DRAFT" && matter.parties.some(
    (party) => party.role === "CLIENT" && party.email?.trim().toLowerCase() === normalized,
  ));
}

export function demoCodeError(code: string, expired: boolean) {
  return !/^\d{6}$/.test(code)
    ? "Enter a six-digit demo code."
    : expired
      ? "This demo code has expired. Reset the demo code to continue."
      : code !== "123456"
        ? "That demo code does not match. Use the sample code 123456."
        : "";
}
