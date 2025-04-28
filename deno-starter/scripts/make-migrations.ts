const MIGRATION_DIR = './migrations';

/**
 * Creates new SQL migration files (.up.sql and .down.sql)
 * 
 * Usage:
 * deno run --allow-read --allow-write scripts/make-migration.ts "migration_name"
 */

import { join } from "https://deno.land/std/path/mod.ts";
import { ensureDirSync } from "https://deno.land/std/fs/mod.ts";

// Get migration name from command line arguments
const migrationName = Deno.args[0];

if (!migrationName) {
  console.error("Error: Please provide a migration name");
  console.log("Usage: deno run --allow-read --allow-write scripts/make-migration.ts \"migration_name\"");
  Deno.exit(1);
}

// Generate timestamp
const now = new Date();
const timestamp = now.toISOString()
  .replace(/[-:]/g, "")
  .replace(/T/g, "")
  .replace(/\..+/, "");

// Create migration file names  
const migrationPrefix = `${timestamp}_${migrationName.replace(/\s+/g, "_").toLowerCase()}`;
const upMigrationFile = `${migrationPrefix}.up.sql`;
const downMigrationFile = `${migrationPrefix}.down.sql`;

// Ensure migration directory exists
ensureDirSync(MIGRATION_DIR);

// Create migration files
const upMigrationPath = join(MIGRATION_DIR, upMigrationFile);
const downMigrationPath = join(MIGRATION_DIR, downMigrationFile);

// Create .up.sql with empty template
await Deno.writeTextFile(
  upMigrationPath,
  `-- Migration: ${migrationName}\n-- Created at: ${now.toISOString()}\n\n-- Write your UP migration SQL here\n\n`
);

// Create .down.sql with empty template
await Deno.writeTextFile(
  downMigrationPath,
  `-- Migration: ${migrationName}\n-- Created at: ${now.toISOString()}\n\n-- Write your DOWN migration SQL here (to revert the changes)\n\n`
);

console.log(`Migration files created successfully:`);
console.log(`- ${upMigrationPath}`);
console.log(`- ${downMigrationPath}`);

