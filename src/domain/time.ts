// ICU puts a narrow no-break space before AM/PM; plain spaces keep copy and tests predictable.
export function formatClinicTime(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" })
    .format(d)
    .replace(/\s/g, " ");
}

export function stalenessLabel(generatedAt: Date, now: Date): { text: string; stale: boolean } {
  const seconds = Math.max(0, (now.getTime() - generatedAt.getTime()) / 1000);
  const text = seconds < 60 ? "Updated just now" : `Updated ${Math.floor(seconds / 60)} min ago`;
  return { text, stale: seconds >= 120 };
}

// YYYY-MM-DD in the clinic's timezone (en-CA formats dates that way).
export function clinicDateString(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
