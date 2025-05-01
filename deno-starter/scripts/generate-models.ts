#!/usr/bin/env -S deno run --allow-read --allow-write --allow-net
/**
 * Model Generator Script for Deno Starter
 *
 * This script automatically generates model files based on database tables.
 * It can also regenerate existing models while preserving custom methods.
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-net scripts/generate-models.ts [tableName]
 *
 *   - If tableName is provided, it generates/updates only that model
 *   - Otherwise, it generates/updates models for all tables
 */

import { getDb } from '../packages/utils/db.ts';
import { dirname, join } from 'jsr:@std/path';
import { ensureDir, exists } from 'jsr:@std/fs';
import { parse } from 'jsr:@std/flags';

// Target directory for model files
const MODEL_DIR = join(Deno.cwd(), 'apps', 'api', 'src', 'models');
const MODEL_BASE_PATH = join(MODEL_DIR, 'Model.ts');

// Custom method regex patterns
const METHOD_REGEX = /\/\*\*\s*\n([^*]|\*[^/])*\*\/\s*\n\s*async\s+(\w+)/g;
const CLASS_END_REGEX = /}\s*\n\s*\/\/\s*Create a singleton instance/;
const IMPORTS_REGEX = /import\s+.*?from\s+['"].*?['"];?\s*\n/g;
const CLASS_START_REGEX = /export class (\w+)Model extends Model<\1>/;

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  is_primary: boolean;
}

interface CustomMethod {
  fullMethod: string;
  methodName: string;
}

interface TableInfo {
  tableName: string;
  modelName: string;
  columns: ColumnInfo[];
}

// TypeScript type mapping from Postgres types
function mapPostgresTypeToTs(pgType: string): string {
  const typeMap: Record<string, string> = {
    'integer': 'number',
    'bigint': 'number',
    'smallint': 'number',
    'decimal': 'number',
    'numeric': 'number',
    'real': 'number',
    'double precision': 'number',
    'serial': 'number',
    'bigserial': 'number',
    'money': 'number',
    'boolean': 'boolean',
    'char': 'string',
    'varchar': 'string',
    'character varying': 'string',
    'text': 'string',
    'uuid': 'string',
    'json': 'Record<string, unknown>',
    'jsonb': 'Record<string, unknown>',
    'timestamp': 'Date',
    'timestamp with time zone': 'Date',
    'timestamp without time zone': 'Date',
    'date': 'Date',
    'time': 'Date',
    'time with time zone': 'Date',
    'time without time zone': 'Date',
    'interval': 'string',
    'bytea': 'Uint8Array',
  };

  return typeMap[pgType] || 'unknown';
}

// Get all tables from the database
async function getAllTables(): Promise<string[]> {
  const db = getDb();
  const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  const tables = await db.query<{ table_name: string }>(sql);
  return tables.map((t) => t.table_name);
}

// Get column information for a specific table
async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const db = getDb();
  const sql = `
    SELECT 
      c.column_name, 
      c.data_type, 
      c.is_nullable,
      c.column_default,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary
    FROM 
      information_schema.columns c
    LEFT JOIN (
      SELECT 
        ku.table_name, 
        ku.column_name
      FROM 
        information_schema.table_constraints tc
      JOIN 
        information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
      WHERE 
        tc.constraint_type = 'PRIMARY KEY'
    ) pk
    ON 
      c.table_name = pk.table_name 
      AND c.column_name = pk.column_name
    WHERE 
      c.table_name = $1
      AND c.table_schema = 'public'
    ORDER BY 
      c.ordinal_position;
  `;

  return await db.query<ColumnInfo>(sql, [tableName]);
}

// Convert table name to model name (singular and PascalCase)
function tableToModelName(tableName: string): string {
  // Handle common plural forms and remove trailing 's'
  let singular = tableName;
  if (singular.endsWith('ies')) {
    singular = singular.slice(0, -3) + 'y';
  } else if (singular.endsWith('s') && !singular.endsWith('ss')) {
    singular = singular.slice(0, -1);
  }

  // Convert to PascalCase
  return singular
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

// Extract custom methods from an existing model file
async function extractCustomMethods(modelPath: string): Promise<CustomMethod[]> {
  try {
    if (!(await exists(modelPath))) {
      return [];
    }

    const content = await Deno.readTextFile(modelPath);
    const methods: CustomMethod[] = [];

    let match;
    while ((match = METHOD_REGEX.exec(content)) !== null) {
      const methodName = match[2];
      const fullMethod = match[0];

      // Skip built-in methods that would be regenerated
      const builtInMethods = [
        'findById',
        'findByCompletionStatus',
        'findCreatedAfter',
        'createTodo',
        'updateTodo',
        'deleteTodo',
      ];

      if (!builtInMethods.includes(methodName)) {
        methods.push({ fullMethod, methodName });
      }
    }

    return methods;
  } catch (error) {
    console.error(`Error extracting methods from ${modelPath}:`, error);
    return [];
  }
}

// Generate the model interface
function generateInterface(tableName: string, modelName: string, columns: ColumnInfo[]): string {
  const props = columns.map((col) => {
    const isOptional = col.is_nullable === 'YES' || col.column_default !== null;
    return `  ${col.column_name}${isOptional ? '?' : ''}: ${mapPostgresTypeToTs(col.data_type)};`;
  });

  return `export interface ${modelName} {
${props.join('\n')}
}`;
}

// Generate the model class
function generateClass(
  tableName: string,
  modelName: string,
  columns: ColumnInfo[],
  customMethods: CustomMethod[] = [],
): string {
  // Find primary key column or default to "id"
  const primaryKey = columns.find((c) => c.is_primary)?.column_name || 'id';

  // Get fillable columns (excluding auto-generated ones like id, created_at, etc.)
  const fillable = columns
    .filter((c) => !c.is_primary && !['created_at', 'updated_at'].includes(c.column_name))
    .map((c) => c.column_name);

  const fillableStr = JSON.stringify(fillable, null, 2)
    .split('\n')
    .map((line) => '    ' + line)
    .join('\n')
    .replace(/"/g, '"');

  // Basic model methods
  const basicMethods = `
  /**
   * Find ${tableName} by id
   */
  async findById(id: string | number): Promise<${modelName} | null> {
    return this.where("${primaryKey}", id).first();
  }

  /**
   * Create a new ${tableName} record
   */
  async create${modelName}(data: Partial<${modelName}>): Promise<${modelName}> {
    const now = new Date();
    const insertData = {
      ...data
    };
    
    // Add timestamps if they exist in the schema
    ${columns.some((c) => c.column_name === 'created_at') ? 'insertData.created_at = now;' : ''}
    ${columns.some((c) => c.column_name === 'updated_at') ? 'insertData.updated_at = now;' : ''}
    
    return await this.insert(insertData);
  }

  /**
   * Update a ${tableName} record by ID
   */
  async update${modelName}(id: string | number, data: Partial<${modelName}>): Promise<${modelName} | null> {
    const updateData = { ...data };
    
    ${
    columns.some((c) => c.column_name === 'updated_at') ? 'updateData.updated_at = new Date();' : ''
  }
    
    const results = await this.where("${primaryKey}", id)
      .update(updateData);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a ${tableName} record by ID
   */
  async delete${modelName}(id: string | number): Promise<boolean> {
    const result = await this.where("${primaryKey}", id).delete();
    return result.length > 0;
  }`;

  // Append custom methods
  const methodsText = customMethods.map((m) => m.fullMethod).join('\n\n  ');

  return `export class ${modelName}Model extends Model<${modelName}> {
  protected override fillable: string[] = ${fillableStr};
  protected override primaryKey: string = "${primaryKey}";

  constructor() {
    super("${tableName}");
  }
${basicMethods}
${methodsText ? '\n  ' + methodsText : ''}
}

// Create a singleton instance
const ${tableName}Model = new ${modelName}Model();
export default ${tableName}Model;`;
}

// Generate the full model file content
async function generateModelFile(
  table: TableInfo,
  customMethods: CustomMethod[] = [],
): Promise<string> {
  const { tableName, modelName, columns } = table;

  return `// Generated model file for ${tableName}
import { Model } from "./Model.ts";

${generateInterface(tableName, modelName, columns)}

${generateClass(tableName, modelName, columns, customMethods)}
`;
}

// Write model file to disk
async function writeModelFile(tableName: string, content: string): Promise<void> {
  const modelPath = join(MODEL_DIR, `${tableName}.model.ts`);

  try {
    await ensureDir(dirname(modelPath));
    await Deno.writeTextFile(modelPath, content);
    console.log(`✅ Model file generated: ${modelPath}`);
  } catch (error) {
    console.error(`❌ Error writing model file ${modelPath}:`, error);
  }
}

// Process a single table
async function processTable(tableName: string): Promise<void> {
  try {
    const columns = await getTableColumns(tableName);
    const modelName = tableToModelName(tableName);
    const modelPath = join(MODEL_DIR, `${tableName}.model.ts`);

    // Extract custom methods if file already exists
    const customMethods = await extractCustomMethods(modelPath);

    console.log(`Processing table: ${tableName} → ${modelName}Model`);
    if (customMethods.length > 0) {
      console.log(`Found ${customMethods.length} custom methods to preserve`);
    }

    const tableInfo: TableInfo = { tableName, modelName, columns };
    const modelContent = await generateModelFile(tableInfo, customMethods);

    await writeModelFile(tableName, modelContent);
  } catch (error) {
    console.error(`❌ Error processing table ${tableName}:`, error);
  }
}

// Main function to generate all models
async function generateModels(): Promise<void> {
  const args = parse(Deno.args);
  const specificTable = args._[0] as string | undefined;

  try {
    // Check if Model.ts exists before proceeding
    if (!(await exists(MODEL_BASE_PATH))) {
      console.error(`❌ Base Model class not found at ${MODEL_BASE_PATH}`);
      console.error('Please make sure the Model.ts file exists before generating models');
      Deno.exit(1);
    }

    if (specificTable) {
      await processTable(specificTable);
    } else {
      const tables = await getAllTables();
      console.log(`Found ${tables.length} tables`);

      for (const table of tables) {
        await processTable(table);
      }
    }

    console.log('✅ Model generation completed');
  } catch (error) {
    console.error('❌ Error generating models:', error);
  } finally {
    // Close DB connection
    await getDb().close();
  }
}

if (import.meta.main) {
  generateModels();
}
