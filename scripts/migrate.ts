import { migrate } from "drizzle-orm/node-postgres/migrator";
import { db, pool } from "../src/server/db/client";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set");
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("migrations applied");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
