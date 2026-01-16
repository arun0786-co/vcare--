export const ENTRY_STATUSES = [
  "BOOKED",
  "CHECKED_IN",
  "IN_CONSULTATION",
  "COMPLETED",
  "NO_SHOW",
  "CANCELLED",
] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

export const CHANNELS = ["ONLINE", "PHONE", "WALK_IN"] as const;
export type Channel = (typeof CHANNELS)[number];

export interface QueueEntryView {
  id: string;
  ticketNo: number;
  channel: Channel;
  status: EntryStatus;
  scheduledAt: Date | null;
  checkedInAt: Date | null;
  startedAt: Date | null;
  passedAt: Date | null;
  priorityAt: Date | null;
  travelMinutes: number | null;
  hasPhone: boolean;
}

export interface SessionTiming {
  startsAt: Date;
  endsAt: Date;
  expectedStartAt: Date | null;
  doctorArrivedAt: Date | null;
  pausedUntil: Date | null;
  closedAt: Date | null;
}

// Consultation length in minutes.
export interface DurationStats {
  median: number;
  p25: number;
  samples: number;
}

export interface Eta {
  entryId: string;
  position: number;
  expectedAt: Date;
  earlyAt: Date;
}

export const DEFAULTS = {
  graceMinutes: 10,
  alertBufferMinutes: 10,
  slotMinutes: 15,
  defaultConsultMinutes: 8,
  travelOptions: [10, 20, 30, 45, 60],
  delayThresholdMinutes: 20,
  maxDelayAlerts: 2,
  durationSampleLimit: 50,
  durationWindowDays: 30,
  durationMinSamples: 5,
  durationClampMin: 1,
  durationClampMax: 60,
} as const;
