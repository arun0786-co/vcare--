import { and, count, eq, inArray } from "drizzle-orm";
import type { BookingRequest } from "@/domain/booking/request";
import { isInBookingWindow } from "@/domain/booking/window";
import { QueueError } from "@/domain/errors";
import { normalizeIndianMobile } from "@/domain/phone";
import type { Db } from "../db/client";
import { queueEntries } from "../db/schema";
import { insertEntry } from "../queue/insert-entry";
import { inPatientContext } from "./patient-context";

const MAX_ACTIVE_PER_PHONE = 3;

// A patient books a slot themselves. Families often share one phone, so a few bookings per number are allowed.
export async function createOnlineBooking(db: Db, input: BookingRequest, now: Date): Promise<{ token: string }> {
  return inPatientContext(db, input.sessionId, now, async (ctx) => {
    if (!isInBookingWindow(ctx.session.date, now, ctx.session.timezone)) {
      throw new QueueError("VALIDATION", "Bookings open 7 days ahead");
    }
    const phone = normalizeIndianMobile(input.phone);
    if (!phone) throw new QueueError("VALIDATION", "Enter a 10-digit Indian mobile number");
    const [{ active }] = await ctx.tx
      .select({ active: count() })
      .from(queueEntries)
      .where(
        and(
          eq(queueEntries.sessionId, ctx.session.id),
          eq(queueEntries.patientPhone, phone),
          inArray(queueEntries.status, ["BOOKED", "CHECKED_IN"]),
        ),
      );
    if (active >= MAX_ACTIVE_PER_PHONE) {
      throw new QueueError("VALIDATION", `This number already has ${MAX_ACTIVE_PER_PHONE} bookings in this session`);
    }
    const entry = await insertEntry(ctx, {
      channel: "ONLINE",
      name: input.name,
      phone,
      scheduledAt: input.scheduledAt,
      travelMinutes: input.travelMinutes,
    });
    return { token: entry.publicToken };
  });
}
