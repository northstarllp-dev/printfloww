import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { describeDatabaseUrl, loadEnv } from "./env.mjs";

loadEnv();

console.log("DATABASE_URL:", describeDatabaseUrl());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to .env.local.");
  process.exit(1);
}

const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  connect_timeout: 10,
  max: 1
});
const db = drizzle(client);

try {
  await migrate(db, { migrationsFolder: "drizzle" });
  console.log("Migrations applied.");
} catch (error) {
  console.error("Migration failed:", error.message);
  if (error.code) console.error("Postgres code:", error.code);
  if (error.cause) {
    console.error("Cause:", error.cause.message ?? error.cause);
    if (error.cause.code) console.error("Cause code:", error.cause.code);
    if (error.cause.detail) console.error("Cause detail:", error.cause.detail);
  }
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
