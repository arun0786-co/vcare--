import { randomBytes } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { QueueError } from "@/domain/errors";
import { linkMessage } from "@/domain/notify/messages";
import { normalizeIndianMobile } from "@/domain/phone";
import { DEFAULTS, type Channel } from "@/domain/queue/types";
import { formatClinicTime } from "@/domain/time";
import { doctorSessions, queueEntries } from "../db/schema";
import { enqueueNotification } from "../notify/outbox";
import { statusUrl } from "../notify/status-url";
import type { ActionContext } from "./context";
import type { EntryRow } from "./entries";
import { recordEvent } from "./events";
import { assertSlotFree } from "./slot-check";

export interface NewEntry {
  channel: Channel;
  name: string;
  phone?: string | null;
  scheduledAt: Date | null;
  travelMinutes?: number | null;
}

function validPhone(input: NewEntry): string | null {
  if (!input.phone) {
    if (input.channel !== "WALK_IN") throw new QueueError("VALIDATION", "A phone number is needed for bookings");
    return null;
  }
  const phone = normalizeIndianMobile(input.phone);
  if (!phone) throw new QueueError("VALIDATION", "Enter a 10-digit Indian mobile number");
  return phone;
}

function validTravel(minutes: number | null | undefined): number | null {
  if (minutes === null || minutes === undefined) return null;
  if (!(DEFAULTS.travelOptions as readonly number[]).includes(minutes)) {
    throw new QueueError("VALIDATION", "Pick a travel time from the list");
  }
  return minutes;
}

// Adds a patient to the session: walk-ins are checked in straight away, bookings wait for their slot.
export async function insertEntry(ctx: ActionContext, input: NewEntry): Promise<EntryRow> {
  const isWalkIn = input.channel === "WALK_IN";
  const phone = validPhone(input);
  const travelMinutes = validTravel(input.travelMinutes);
  if (isWalkIn && input.scheduledAt) throw new QueueError("VALIDATION", "Walk-ins do not have a slot");
  if (!isWalkIn && !input.scheduledAt) throw new QueueError("VALIDATION", "Pick a slot for the booking");
  if (input.scheduledAt) await assertSlotFree(ctx, input.scheduledAt);

  const ticketNo = ctx.session.nextTicket;
  await ctx.tx
    .update(doctorSessions)
    .set({ nextTicket: sql`${doctorSessions.nextTicket} + 1` })
    .where(eq(doctorSessions.id, ctx.session.id));
  ctx.session.nextTicket += 1;

  const status = isWalkIn ? "CHECKED_IN" : "BOOKED";
  const [entry] = await ctx.tx
    .insert(queueEntries)
    .values({
      sessionId: ctx.session.id,
      ticketNo,
      channel: input.channel,
      status,
      patientName: input.name,
      patientPhone: phone,
      scheduledAt: input.scheduledAt,
      checkedInAt: isWalkIn ? ctx.now : null,
      travelMinutes,
      publicToken: randomBytes(24).toString("base64url"),
      createdAt: ctx.now,
      updatedAt: ctx.now,
    })
    .returning();

  if (phone) {
    await enqueueNotification(
      ctx.tx,
      {
        entryId: entry.id,
        kind: "LINK",
        dedupeKey: `LINK:${entry.id}`,
        toPhone: phone,
        body: linkMessage({
          clinicName: ctx.session.clinicName,
          name: entry.patientName,
          ticketNo,
          slot: entry.scheduledAt ? formatClinicTime(entry.scheduledAt, ctx.session.timezone) : null,
          url: statusUrl(entry.publicToken),
        }),
      },
      ctx.now,
    );
  }
  await recordEvent(ctx.tx, {
    sessionId: ctx.session.id,
    entryId: entry.id,
    type: "ENTRY_CREATED",
    to: status,
    actor: ctx.actor,
    payload: { channel: input.channel },
    at: ctx.now,
  });
  return entry;
}
