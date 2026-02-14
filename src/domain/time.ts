// ICU puts a narrow no-break space before AM/PM; plain spaces keep copy and tests predictable.
export function formatClinicTime(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" })
    .format(d)
    .replace(/\s/g, " ");
}
