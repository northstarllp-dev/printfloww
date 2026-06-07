import postgres from "postgres";
import { describeDatabaseUrl, loadEnv } from "./env.mjs";

loadEnv();

console.log("DATABASE_URL:", describeDatabaseUrl());

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing. Add it to .env.local.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  prepare: false,
  connect_timeout: 10,
  max: 1
});

try {
  const connection = await sql`
    select current_database() as database, current_user as "user", current_schema() as schema
  `;
  console.log("Connection OK:", connection[0]);

  const tables = await sql`
    select table_schema, table_name
    from information_schema.tables
    where table_schema in ('public', 'drizzle')
    order by table_schema, table_name
  `;
  console.log("Tables:", tables);
} catch (error) {
  console.error("Database check failed:", error.message);
  if (error.code) console.error("Postgres code:", error.code);
  process.exitCode = 1;
} finally {
  await sql.end().catch(() => {});
}
