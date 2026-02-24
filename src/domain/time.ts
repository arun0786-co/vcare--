// ICU puts a narrow no-break space before AM/PM; plain spaces keep copy and tests predictable.
export function formatClinicTime(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" })
    .format(d)
    .replace(/\s/g, " ");
}

// YYYY-MM-DD in the clinic's timezone (en-CA formats dates that way).
export function clinicDateString(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
