import { expect, test } from "vitest";
import { db } from "@/server/db/client";
import { loadAlertHistory } from "@/server/notify/alert-history";
import { enqueueNotification } from "@/server/notify/outbox";
import { at } from "../support/time";
import { setupSession } from "./fixtures";
import { insertRawEntry } from "./helpers";

test("builds each entry's alert history from the outbox", async () => {
  const s = await setupSession();
  const a = await insertRawEntry(s.sessionId, { ticketNo: 1, status: "BOOKED", channel: "ONLINE", scheduledAt: at("11:00") });
  const b = await insertRawEntry(s.sessionId, { ticketNo: 2, status: "BOOKED", channel: "ONLINE", scheduledAt: at("11:15") });
  const alert = (entryId: string, kind: "LINK" | "LEAVE_NOW" | "DELAY", key: string, earlyAt: string | null, created: string) =>
    enqueueNotification(
      db,
      { entryId, kind, dedupeKey: key, toPhone: "+919876543210", body: "x", payload: earlyAt ? { earlyAt: at(earlyAt).toISOString() } : null },
      at(created),
    );
  await alert(a.id, "LINK", "LINK:a", null, "09:00");
  await alert(a.id, "LEAVE_NOW", "LEAVE_NOW:a", "11:00", "10:30");
  await alert(a.id, "DELAY", "DELAY:a:1", "11:25", "10:40");

  const history = await loadAlertHistory(db, [a.id, b.id]);
  expect(history.get(a.id)).toEqual({ leaveNowEarlyAt: at("11:00"), lastAlertEarlyAt: at("11:25"), delayCount: 1 });
  expect(history.get(b.id)).toBeUndefined();
  expect(await loadAlertHistory(db, [])).toEqual(new Map());
});
