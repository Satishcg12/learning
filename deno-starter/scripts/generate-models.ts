#!/usr/bin/env deno run --allow-read --allow-write

import { parse } from "https://deno.land/std/flags/mod.ts";
import { join, basename } from "https://deno.land/std/path/mod.ts";
import { ensureDir, exists } from "https://deno.land/std/fs/mod.ts";

// Parse command line arguments
const args = parse(Deno.args, {
  boolean: ["force", "help"],
  alias: { f: "force", h: "help" },
});

if (args.help) {
  console.log(`
  Model Generator - Generates TypeScript models from SQL migrations

  Usage:
    deno run --allow-read --allow-write scripts/generate-models.ts [options]

  Options:
    -f, --force       Force regeneration of existing models
    -h, --help        Show this help message
  `);
  Deno.exit(0);
}

const MIGRATIONS_DIR = join(Deno.cwd(), "migrations");
const MODELS_DIR = join(Deno.cwd(), "apps", "api", "src", "models");
const FORCE = args.force;

// Types for extracted table information
interface Column {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimary: boolean;
  hasDefault: boolean;
}

interface TableInfo {
  name: string;
  columns: Column[];
  primaryKey: string;
}

// Map SQL types to TypeScript types
function mapSqlTypeToTs(sqlType: string): string {
  const typeLower = sqlType.toLowerCase();
  
  if (typeLower.includes("int") || typeLower.includes("serial")) return "number";
  if (typeLower.includes("bool")) return "boolean";
  if (typeLower.includes("timestamp") || typeLower.includes("date")) return "Date";
  if (typeLower.includes("json") || typeLower.includes("jsonb")) return "Record<string, unknown>";
  if (typeLower.includes("float") || typeLower.includes("decimal") || typeLower.includes("numeric")) return "number";
  
  // Default to string for text, varchar, char, etc.
  return "string";
}

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

// Parse CREATE TABLE statement to extract column information
function parseCreateTableStatement(sql: string): TableInfo | null {
  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:"|`)?(\w+)(?:"|`)?/i;
  const tableMatch = sql.match(createTableRegex);
  
  if (!tableMatch) return null;
  
  const tableName = tableMatch[1];
  const columnsSection = sql.substring(sql.indexOf("(") + 1, sql.lastIndexOf(")"));
  
  // Split by commas but handle cases where commas are inside parentheses
  let depth = 0;
  let currentCol = "";
  const columnDefinitions: string[] = [];
  
  for (const char of columnsSection) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    else if (char === ',' && depth === 0) {
      columnDefinitions.push(currentCol.trim());
      currentCol = "";
      continue;
    }
    currentCol += char;
  }
  if (currentCol.trim()) columnDefinitions.push(currentCol.trim());
  
  const columns: Column[] = [];
  let primaryKey = "id"; // Default primary key
  
  for (const colDef of columnDefinitions) {
    // Skip constraints, indexes, etc.
    if (
      colDef.trim().startsWith("CONSTRAINT") ||
      colDef.trim().startsWith("PRIMARY KEY") ||
      colDef.trim().startsWith("FOREIGN KEY") ||
      colDef.trim().startsWith("UNIQUE") ||
      colDef.trim().startsWith("CHECK") ||
      colDef.trim().startsWith("INDEX")
    ) {
      // Extract primary key if it's defined as a constraint
      const pkMatch = colDef.match(/PRIMARY\s+KEY\s+\(\s*"?(\w+)"?\s*\)/i);
      if (pkMatch) {
        primaryKey = pkMatch[1];
      }
      continue;
    }
    
    const colParts = colDef.split(/\s+/);
    if (colParts.length < 2) continue;
    
    const name = colParts[0].replace(/["`]/g, "");
    const type = colParts[1];
    const isPrimary = colDef.toUpperCase().includes("PRIMARY KEY");
    const isNullable = !colDef.toUpperCase().includes("NOT NULL");
    const hasDefault = colDef.toUpperCase().includes("DEFAULT");
    
    columns.push({
      name,
      type,
      isNullable,
      isPrimary,
      hasDefault
    });
    
    if (isPrimary) {
      primaryKey = name;
    }
  }
  
  return { name: tableName, columns, primaryKey };
}

// Generate TypeScript model from table information
function generateModelContent(tableInfo: TableInfo): string {
  const tableName = tableInfo.name;
  const className = formatClassName(tableName);
  
  // Generate interface properties
  const interfaceProps = tableInfo.columns.map(column => {
    const tsType = mapSqlTypeToTs(column.type);
    const optional = column.isNullable || column.hasDefault ? "?" : "";
    return `  ${column.name}${optional}: ${tsType};`;
  }).join("\n");
  
  // Generate fillable fields (exclude primary key and timestamps)
  const fillableFields = tableInfo.columns
    .filter(col => 
      !col.isPrimary && 
      !["created_at", "updated_at", "deleted_at"].includes(col.name)
    )
    .map(col => `    "${col.name}"`)
    .join(",\n");
  
  // Check if table has timestamp columns
  const hasCreatedAt = tableInfo.columns.some(col => col.name === "created_at");
  const hasUpdatedAt = tableInfo.columns.some(col => col.name === "updated_at");
  
  return `// Generated model file for ${tableName}
import { Model } from "./Model.ts";

export interface ${className} {
${interfaceProps}
}

export class ${className}Model extends Model<${className}> {
  protected override fillable: string[] = [
${fillableFields}
  ];
  protected override primaryKey: string = "${tableInfo.primaryKey}";

  constructor() {
    super("${tableName}");
  }

  /**
   * Find ${tableName} by id
   */
  async findById(id: string | number): Promise<${className} | null> {
    return this.where("${tableInfo.primaryKey}", id).first();
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
    ${hasCreatedAt ? 'insertData.created_at = now;' : '// No created_at field in table'}
    ${hasUpdatedAt ? 'insertData.updated_at = now;' : '// No updated_at field in table'}
    
    return await this.insert(insertData);
  }

  /**
   * Update a ${tableName} record by ID
   */
  async update${className}(id: string | number, data: Partial<${className}>): Promise<${className} | null> {
    const updateData = { ...data };
    
    ${hasUpdatedAt ? 'updateData.updated_at = new Date();' : '// No updated_at field in table'}
    
    const results = await this.where("${tableInfo.primaryKey}", id)
      .update(updateData);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a ${tableName} record by ID
   */
  async delete${className}(id: string | number): Promise<boolean> {
    const result = await this.where("${tableInfo.primaryKey}", id).delete();
    return result.length > 0;
  }
}

// Create a singleton instance
const ${tableName}Model = new ${className}Model();
export default ${tableName}Model;
`;
}

// Extract table information from migration files
async function extractTableInfoFromMigrations(): Promise<TableInfo[]> {
  const extractedTables: TableInfo[] = [];
  const processedTableNames = new Set<string>();
  
  try {
    // Read all .up.sql files from migrations directory
    for await (const entry of Deno.readDir(MIGRATIONS_DIR)) {
      if (entry.isFile && entry.name.endsWith('.up.sql')) {
        const filePath = join(MIGRATIONS_DIR, entry.name);
        const content = await Deno.readTextFile(filePath);
        
        // Look for CREATE TABLE statements
        if (content.toUpperCase().includes('CREATE TABLE')) {
          const tableInfo = parseCreateTableStatement(content);
          
          if (tableInfo && !processedTableNames.has(tableInfo.name)) {
            processedTableNames.add(tableInfo.name);
            extractedTables.push(tableInfo);
            console.log(`Found table definition for '${tableInfo.name}' with ${tableInfo.columns.length} columns`);
          }
        }
      }
    }
    
    return extractedTables;
    
  } catch (error) {
    console.error("Error reading migration files:", error);
    return [];
  }
}

// Generate model files
async function generateModels(tables: TableInfo[]): Promise<void> {
  // Create models directory if it doesn't exist
  await ensureDir(MODELS_DIR);
  
  for (const tableInfo of tables) {
    const modelFilePath = join(MODELS_DIR, `${tableInfo.name}.model.ts`);
    const modelExists = await exists(modelFilePath);
    
    if (modelExists && !FORCE) {
      console.log(`Model for table '${tableInfo.name}' already exists. Use --force to regenerate.`);
      continue;
    }
    
    const modelContent = generateModelContent(tableInfo);
    await Deno.writeTextFile(modelFilePath, modelContent);
    
    console.log(`${modelExists ? 'Regenerated' : 'Generated'} model for table '${tableInfo.name}'`);
  }
}

// Main function
async function main() {
  try {
    console.log("Extracting table information from migrations...");
    const tables = await extractTableInfoFromMigrations();
    
    if (tables.length === 0) {
      console.log("No table definitions found in migration files.");
      return;
    }
    
    console.log(`Found ${tables.length} table(s): ${tables.map(t => t.name).join(', ')}`);
    
    await generateModels(tables);
    
    console.log("Model generation complete.");
    
  } catch (error) {
    console.error("Error generating models:", error);
    Deno.exit(1);
  }
}

// Run the main function
if (import.meta.main) {
  main();
}
