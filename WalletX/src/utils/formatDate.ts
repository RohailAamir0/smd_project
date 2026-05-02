import type { DateLike } from "../types";

/**
 * Converts a Firestore Timestamp or plain JS Date to a JS Date.
 */
function toDate(date: DateLike): Date {
  if (date && typeof (date as { toDate?: () => Date }).toDate === "function") {
    return (date as { toDate: () => Date }).toDate();
  }
  return date as Date;
}

/** "Apr 27, 2026" */
export function formatDate(date: DateLike): string {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** "Apr 27" */
export function formatShortDate(date: DateLike): string {
  return toDate(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** "Today", "Yesterday", or "Apr 27, 2026" */
export function formatRelativeDate(date: DateLike): string {
  const d = toDate(date);
  const now = new Date();
  const diffMs =
    new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime() -
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = diffMs / 86_400_000;
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return formatDate(d);
}

/** "Today - 10:33 PM" */
export function formatRelativeDateTime(date: DateLike): string {
  return `${formatRelativeDate(date)} - ${formatTime(date)}`;
}

/** "08:30 AM" */
export function formatTime(date: DateLike): string {
  return toDate(date).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** "April 2026" — used in statistics monthly filter */
export function formatMonthYear(date: DateLike): string {
  return toDate(date).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}
