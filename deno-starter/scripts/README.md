# Model Generator

This tool automatically generates model templates from your database migration files. It parses the migration files to extract table structures and creates corresponding TypeScript model files.

## Usage

```bash
deno run --allow-read --allow-write scripts/generate-models.ts [options]
```

### Options

- `--migrations=<path>`: Directory containing migration files (default: "./apps/api/src/db/migrations")
- `--models=<path>`: Output directory for generated models (default: "./apps/api/src/models")
- `--force`: Force regeneration of existing models
- `--table=<tableName>`: Generate model for a specific table only

### Examples

Generate all models:
```bash
deno run --allow-read --allow-write scripts/generate-models.ts
```

Force regeneration of all models:
```bash
deno run --allow-read --allow-write scripts/generate-models.ts --force
```

Generate model for a specific table:
```bash
deno run --allow-read --allow-write scripts/generate-models.ts --table=todos
```

## How It Works

1. The script parses migration files to extract table definitions
2. For each table, it generates:
   - An interface with proper TypeScript types
   - A model class extending the base Model
   - Common CRUD methods 
   - A singleton instance export

## Customization

After generating a model, you may want to add custom methods or modify the generated code to fit your specific needs.

When regenerating models with `--force`, any custom code you've added will be overwritten, so consider backing up your customizations.
