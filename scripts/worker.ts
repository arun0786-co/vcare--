import { pool, db } from "../src/server/db/client";
import { deliverPending } from "../src/server/notify/deliver";
import { simulatedSender } from "../src/server/notify/sender";
import { runAlertSweep } from "../src/server/notify/sweep";

const TICK_MS = 15_000;

let stopping = false;
let timer: NodeJS.Timeout | undefined;

async function tick() {
  const now = new Date();
  try {
    const planned = await runAlertSweep(db, now);
    const sent = await deliverPending(db, simulatedSender, now);
    if (planned || sent) console.log(`[worker] ${now.toISOString()} planned ${planned}, delivered ${sent}`);
  } catch (err) {
    console.error("[worker] tick failed", err);
  }
  if (!stopping) timer = setTimeout(tick, TICK_MS);
}

async function stop() {
  stopping = true;
  clearTimeout(timer);
  await pool.end();
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
console.log(`[worker] running every ${TICK_MS / 1000}s with simulated delivery`);
void tick();
