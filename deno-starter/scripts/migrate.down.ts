import { Client } from 'jsr:@db/postgres';

const MIGRATION_DIR = './migrations';

const client = new Client({
  user: 'satish',
  password: 'satish',
  database: 'test',
  hostname: 'localhost',
  port: 5432,
});
await client.connect();

// Check if migrations table exists
const migrationTableCheck = await client.queryObject<{ exists: boolean }>(`
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'migrations'
  ) as exists;
`);

if (!migrationTableCheck.rows[0].exists) {
  console.error('No migrations table exists. Nothing to revert.');
  await client.end();
  Deno.exit(0);
}

// Get number of migrations to revert (defaults to 1)
const count = Deno.args[0] ? parseInt(Deno.args[0]) : 1;
if (isNaN(count) || count < 1) {
  console.error('Please provide a valid number of migrations to revert');
  await client.end();
  Deno.exit(1);
}

// Get already-run migrations in reverse chronological order (newest first)
const result = await client.queryObject<{ id: number, name: string }>(
  'SELECT id, name FROM migrations ORDER BY id DESC LIMIT $1',
  [count]
);

if (result.rows.length === 0) {
  console.log('No migrations to revert.');
  await client.end();
  Deno.exit(0);
}

// Process each migration to revert
for (const row of result.rows) {
  const migrationName = row.name;
  const downFilePath = `${MIGRATION_DIR}/${migrationName}.down.sql`;
  
  try {
    const downSql = await Deno.readTextFile(downFilePath);
    console.log(`Reverting migration: ${migrationName}`);
    
    // Execute down migration SQL
    await client.queryArray(downSql);
    
    // Remove migration record
    await client.queryObject(
      'DELETE FROM migrations WHERE id = $1',
      [row.id]
    );
    
    console.log(`Migration ${migrationName} reverted successfully.`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Failed to revert migration ${migrationName}: ${message}`);
    await client.end();
    Deno.exit(1);
  }
}

await client.end();
console.log(`Successfully reverted ${result.rows.length} migration(s).`);