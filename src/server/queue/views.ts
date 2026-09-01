import type { Channel, DurationStats, EntryStatus } from "@/domain/queue/types";

// Shapes sent to the browser. Times are ISO strings so they survive JSON unchanged.

export interface BoardEntry {
  id: string;
  ticketNo: number;
  name: string;
  phone: string | null;
  channel: Channel;
  status: EntryStatus;
  scheduledAt: string | null;
  checkedInAt: string | null;
  startedAt: string | null;
  prioritized: boolean;
  position: number | null;
  expectedAt: string | null;
  publicToken: string;
}

export interface SessionBoard {
  session: {
    id: string;
    date: string;
    doctorName: string;
    timezone: string;
    startsAt: string;
    endsAt: string;
    expectedStartAt: string | null;
    doctorArrivedAt: string | null;
    pausedUntil: string | null;
    pauseReason: string | null;
    publicNote: string | null;
    closedAt: string | null;
    freeSlots: string[];
  };
  current: BoardEntry | null;
  waiting: BoardEntry[];
  upcoming: BoardEntry[];
  late: BoardEntry[];
  finished: BoardEntry[];
  stats: DurationStats;
  generatedAt: string;
}

// What a patient sees through their link. Never contains other patients' names or phones.
export interface PatientStatus {
  ticketNo: number;
  name: string;
  status: EntryStatus;
  clinicName: string;
  doctorName: string;
  timezone: string;
  scheduledAt: string | null;
  position: number | null;
  aheadCount: number | null;
  expectedAt: string | null;
  lateForSlot: boolean;
  slotHeldUntil: string | null;
  nowServingTicket: number | null;
  travelMinutes: number | null;
  session: {
    doctorArrived: boolean;
    expectedStartAt: string | null;
    pausedUntil: string | null;
    pauseReason: string | null;
    publicNote: string | null;
    closed: boolean;
  };
  generatedAt: string;
}

export interface SessionSummary {
  id: string;
  doctorName: string;
  startsAt: string;
  endsAt: string;
  closedAt: string | null;
  waitingCount: number;
}
