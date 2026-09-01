import { z } from "zod";
import { parseOrThrow } from "../parse";

const entryId = z.uuid({ error: "Unknown entry" });
const name = z.string().trim().min(1, { error: "Enter the patient's name" }).max(80, { error: "Name is too long" });
const optionalText = z.string().trim().max(200, { error: "Keep it under 200 characters" }).optional();
const time = z.iso.datetime({ offset: true, error: "Invalid time" }).transform((s) => new Date(s));
const blankToUndefined = (v: string | undefined) => (v ? v : undefined);

export const staffActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("NEXT"), expectedCurrentId: z.uuid().nullable() }),
  z.object({ type: z.literal("COMPLETE_CURRENT"), expectedCurrentId: z.uuid() }),
  z.object({ type: z.literal("CHECK_IN"), entryId }),
  z.object({ type: z.literal("RECHECK_IN"), entryId }),
  z.object({ type: z.literal("MARK_NO_SHOW"), entryId }),
  z.object({ type: z.literal("CANCEL"), entryId, reason: optionalText }),
  z.object({
    type: z.literal("PRIORITIZE"),
    entryId,
    reason: z.string().trim().min(3, { error: "Give a reason (at least 3 characters)" }).max(200),
  }),
  z.object({ type: z.literal("ADD_WALK_IN"), name, phone: z.string().trim().optional().transform(blankToUndefined) }),
  z.object({ type: z.literal("ADD_PHONE_BOOKING"), name, phone: z.string().trim(), scheduledAt: time }),
  z.object({ type: z.literal("DOCTOR_LATE"), expectedStartAt: time }),
  z.object({ type: z.literal("DOCTOR_ARRIVED") }),
  z.object({ type: z.literal("START_BREAK"), until: time, reason: optionalText }),
  z.object({ type: z.literal("END_BREAK") }),
  z.object({ type: z.literal("SET_NOTE"), note: z.string().trim().max(200, { error: "Keep it under 200 characters" }).nullable() }),
  z.object({ type: z.literal("CLOSE_SESSION") }),
]);

export type StaffAction = z.infer<typeof staffActionSchema>;
// The JSON a client sends, before parsing (times as ISO strings).
export type StaffActionInput = z.input<typeof staffActionSchema>;
export type StaffActionType = StaffAction["type"];

export function parseStaffAction(input: unknown): StaffAction {
  return parseOrThrow(staffActionSchema, input, "Invalid action");
}
