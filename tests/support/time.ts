// IST wall-clock time on a fixed test date: at('10:30') is 2026-10-26T05:00:00Z.
export function at(hhmm: string, date = "2026-10-26"): Date {
  return new Date(`${date}T${hhmm}:00+05:30`);
}

export function minutesAfter(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}
