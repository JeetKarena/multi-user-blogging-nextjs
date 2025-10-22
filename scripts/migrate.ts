// scripts/migrate.ts
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { Pool } from "pg";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const runMigrate = async () => {
  console.log("⏳ Running migrations...");

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    database: process.env.DATABASE_NAME,
    max: 1, // Use only one connection for migrations
    ssl: { rejectUnauthorized: false },
  });

  try {
    const db = drizzle(pool);
    await migrate(db, { migrationsFolder: "./drizzle/migrations" });
    console.log("✅ Migrations completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

runMigrate();
