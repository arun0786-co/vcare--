import { z } from "zod";
import { parseOrThrow } from "../parse";

const bookingRequest = z.object({
  sessionId: z.uuid({ error: "Pick a session" }),
  scheduledAt: z.iso.datetime({ offset: true, error: "Pick a slot" }).transform((s) => new Date(s)),
  name: z.string({ error: "Enter your name" }).trim().min(1, { error: "Enter your name" }).max(80, { error: "Name is too long" }),
  phone: z.string({ error: "Enter your phone number" }).trim().min(1, { error: "Enter your phone number" }),
  travelMinutes: z
    .number({ error: "Pick a travel time from the list" })
    .int()
    .nullish()
    .transform((v) => v ?? null),
});

export type BookingRequest = z.output<typeof bookingRequest>;

export function parseBookingRequest(input: unknown): BookingRequest {
  return parseOrThrow(bookingRequest, input, "Invalid booking");
}

const travelUpdate = z.object({
  travelMinutes: z.number({ error: "Pick a travel time from the list" }).int().nullable(),
});

export function parseTravelUpdate(input: unknown): z.output<typeof travelUpdate> {
  return parseOrThrow(travelUpdate, input, "Invalid travel time");
}
