import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";

async function resetDatabase() {
  const sql = neon(process.env.DATABASE_URL!);

  console.log("Dropping existing tables...");

  await sql`DROP TABLE IF EXISTS media CASCADE`;
  await sql`DROP TABLE IF EXISTS daily_entries CASCADE`;
  await sql`DROP TABLE IF EXISTS entries CASCADE`;
  await sql`DROP TABLE IF EXISTS albums CASCADE`;
  await sql`DROP TABLE IF EXISTS users CASCADE`;

  console.log("All tables dropped successfully!");
}

resetDatabase().catch(console.error);
