import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Pool } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("Missing DATABASE_URL. Set it before running this script.");
  process.exit(1);
}

const isLocalDatabase = /localhost|127\.0\.0\.1/i.test(databaseUrl);
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: isLocalDatabase ? undefined : { rejectUnauthorized: false }
});

try {
  const schemaPath = path.join(process.cwd(), "database", "schema.sql");
  const schema = await readFile(schemaPath, "utf8");
  await pool.query(schema);
  console.log("PostgreSQL schema is ready.");
} finally {
  await pool.end();
}
