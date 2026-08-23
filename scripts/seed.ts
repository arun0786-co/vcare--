import { db, pool } from "../src/server/db/client";
import { seedDemo } from "../src/server/dev/seed-demo";

async function main() {
  const password = process.env.SEED_STAFF_PASSWORD;
  if (!password) throw new Error("Set SEED_STAFF_PASSWORD in .env first");
  await seedDemo(db, password);
  console.log("seeded Demo Clinic (/c/demo); staff logins reception@demo.test and meera@demo.test");
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
