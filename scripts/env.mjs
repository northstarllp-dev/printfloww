import { existsSync, readFileSync } from "node:fs";

export function loadEnv() {
  for (const envFile of [".env.local", ".env"]) {
    if (!existsSync(envFile)) continue;

    const lines = readFileSync(envFile, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;

      const separator = trimmed.indexOf("=");
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator);
      let value = trimmed.slice(separator + 1);
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      process.env[key] ??= value;
    }
  }
}

export function describeDatabaseUrl() {
  const raw = process.env.DATABASE_URL ?? "";
  if (!raw) return { present: false };

  try {
    const url = new URL(raw);
    return {
      present: true,
      protocol: url.protocol,
      host: url.host,
      username: url.username,
      passwordLength: url.password.length,
      database: url.pathname,
      hasQuery: Boolean(url.search)
    };
  } catch (error) {
    return {
      present: true,
      parseError: error instanceof Error ? error.message : "Could not parse DATABASE_URL"
    };
  }
}
