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

function offsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(at);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return (asUtc - at.getTime()) / 60_000;
}

// "2026-10-26" + "10:45" read as wall-clock time in the clinic's timezone.
export function clinicWallTime(date: string, hhmm: string, timeZone: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [h, mi] = hhmm.split(":").map(Number);
  const guess = new Date(Date.UTC(y, m - 1, d, h, mi));
  return new Date(guess.getTime() - offsetMinutes(guess, timeZone) * 60_000);
}
