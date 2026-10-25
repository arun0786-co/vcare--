export interface SimOptions {
  seed: number;
  walkInsPerHour: number;
  bookedSlots: number;
  doctorLateMinutes: number;
  lateAnnounced: boolean;
  medianConsult: number;
  graceMinutes: number;
  bufferMinutes: number;
}

export const DEFAULT_SIM: SimOptions = {
  seed: 1,
  walkInsPerHour: 6,
  bookedSlots: 6,
  doctorLateMinutes: 0,
  lateAnnounced: false,
  medianConsult: 8,
  graceMinutes: 10,
  bufferMinutes: 10,
};

// One synthetic morning: a 10:00-13:00 IST session with 15-minute slots.
export const SIM_SESSION = {
  startsAt: new Date("2026-10-26T10:00:00+05:30"),
  endsAt: new Date("2026-10-26T13:00:00+05:30"),
  slotMinutes: 15,
};

export interface SimWalkIn {
  id: string;
  arrival: Date;
  duration: number;
}

export interface SimBooking {
  id: string;
  slot: Date;
  travel: number;
  actualTravel: number;
  duration: number;
}

export interface SimPatients {
  walkIns: SimWalkIn[];
  booked: SimBooking[];
}

export interface SimBookedResult {
  id: string;
  slot: Date;
  arrival: Date | null;
  start: Date | null;
  waitMinutes: number | null;
  lostSlot: boolean;
  alertExpectedAt: Date | null;
}

export interface SimReport {
  bookedPatients: number;
  avgWaitMinutes: number;
  maxWaitMinutes: number;
  lostSlots: number;
  etaMaeMinutes: number | null;
  details: SimBookedResult[];
}
