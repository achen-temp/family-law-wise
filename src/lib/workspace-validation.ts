export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function firmDetailsError(name: string, attorneyName: string, email: string) {
  if (!name.trim() || !attorneyName.trim()) return "Enter the firm name and attorney name.";
  if (!validEmail(email)) return "Enter a valid attorney email address.";
  return "";
}

export function reminderScheduleError(first: string, second: string, alert: string) {
  const days = [first, second, alert].map(Number);
  if ([first, second, alert].some((day) => !day.trim()) || days.some((day) => !Number.isSafeInteger(day) || day < 1)) {
    return "Use positive whole numbers of days for every reminder and alert.";
  }
  if (days[0] >= days[1] || days[1] >= days[2]) return "The second reminder must follow the first, and the attorney alert must follow the second.";
  return "";
}
