#!/usr/bin/env deno run --allow-read --allow-write

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join } from "https://deno.land/std/path/mod.ts";
import { exists } from "https://deno.land/std/fs/mod.ts";

// Parse command line arguments
const args = parse(Deno.args, {
  string: ["table", "pk"],
  boolean: ["force", "help"],
  alias: { t: "table", p: "pk", f: "force", h: "help" },
  default: { pk: "id" },
});

// Show help
if (args.help || !args.table) {
  console.log(`
  Single Model Generator - Generates a TypeScript model for a specific table

  Usage:
    deno run --allow-read --allow-write scripts/generate-model.ts --table <tableName> [options]

  Options:
    -t, --table       Table name (required)
    -p, --pk          Primary key name (default: "id")
    -f, --force       Force regeneration of existing model
    -h, --help        Show this help message
  `);
  Deno.exit(args.help ? 0 : 1);
}

const MODELS_DIR = join(Deno.cwd(), "apps", "api", "src", "models");
const TABLE_NAME = args.table;
const PRIMARY_KEY = args.pk;
const FORCE = args.force;

// Format table name to class name (users -> User, todo_items -> TodoItem)
function formatClassName(tableName: string): string {
  // Remove trailing 's' for singular form
  let singular = tableName.endsWith("s") ? tableName.slice(0, -1) : tableName;
  
  // Convert snake_case to PascalCase
  return singular
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

// Generate model content
function generateModelContent(tableName: string, primaryKey: string): string {
  const className = formatClassName(tableName);
  
  return `// Generated model file for ${tableName}
import { Model } from "./Model.ts";

export interface ${className} {
  ${primaryKey}?: number;
  // Add your other properties here
  created_at?: Date;
  updated_at?: Date;
}

export class ${className}Model extends Model<${className}> {
  protected override fillable: string[] = [
    // Add your fillable fields here
  ];
  protected override primaryKey: string = "${primaryKey}";

  constructor() {
    super("${tableName}");
  }

  /**
   * Find ${tableName} by id
   */
  async findById(id: string | number): Promise<${className} | null> {
    return this.where("${primaryKey}", id).first();
  }

  /**
   * Create a new ${tableName} record
   */
  async create${className}(data: Partial<${className}>): Promise<${className}> {
    const now = new Date();
    const insertData = {
      ...data
    };
    
    // Add timestamps if they exist in the schema
    insertData.created_at = now;
    insertData.updated_at = now;
    
    return await this.insert(insertData);
  }

  /**
   * Update a ${tableName} record by ID
   */
  async update${className}(id: string | number, data: Partial<${className}>): Promise<${className} | null> {
    const updateData = { ...data };
    
    // Add updated_at timestamp
    updateData.updated_at = new Date();
    
    const results = await this.where("${primaryKey}", id)
      .update(updateData);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a ${tableName} record by ID
   */
  async delete${className}(id: string | number): Promise<boolean> {
    const result = await this.where("${primaryKey}", id).delete();
    return result.length > 0;
  }
}

// Create a singleton instance
const ${tableName}Model = new ${className}Model();
export default ${tableName}Model;
`;
}

// Main function
async function main() {
  try {
    const modelFilePath = join(MODELS_DIR, `${TABLE_NAME}.model.ts`);
    const modelExists = await exists(modelFilePath);
    
    if (modelExists && !FORCE) {
      console.log(`Model for table '${TABLE_NAME}' already exists. Use --force to regenerate.`);
      return;
    }
    
    const modelContent = generateModelContent(TABLE_NAME, PRIMARY_KEY);
    await Deno.writeTextFile(modelFilePath, modelContent);
    
    console.log(`${modelExists ? 'Regenerated' : 'Generated'} model for table '${TABLE_NAME}'`);
    
  } catch (error) {
    console.error("Error generating model:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}
