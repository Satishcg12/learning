import { Client } from 'jsr:@db/postgres';
import { walk } from 'https://deno.land/std/fs/mod.ts';

const MIGRATION_DIR = './migrations';

const client = new Client({
  user: 'satish',
  password: 'satish',
  database: 'test',
  hostname: 'localhost',
  port: 5432,
});
await client.connect();

// Create migrations table if not exists
await client.queryObject(`
  CREATE TABLE IF NOT EXISTS migrations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`);

// Get already-run migrations
const ranMigrations = new Set<string>();
const result = await client.queryObject<{ name: string }>(
  'SELECT name FROM migrations',
);
if (!result) {
  console.error('Failed to fetch migrations');
  Deno.exit(1);
}

result.rows.forEach((row: { name: string }) => ranMigrations.add(row.name));

// Walk migration files
for await (const entry of walk(MIGRATION_DIR, { exts: ['.sql'], includeDirs: false })) {
  if (entry.name.endsWith('.up.sql')) {
    const migrationName = entry.name.replace('.up.sql', '');
    if (ranMigrations.has(migrationName)) continue;

    console.log(`Running migration: ${migrationName}`);
    const sql = await Deno.readTextFile(entry.path);
    console.log(`Executing SQL: ${sql}`);
    await client.queryArray(sql);

    await client.queryObject(
      'INSERT INTO migrations (name) VALUES ($1)',
      [migrationName],
    );
    console.log(`Migration ${migrationName} applied successfully.`);
  }
}

await client.end();
