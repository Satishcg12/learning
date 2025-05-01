// Generated model file for migrations
import { Model } from "./Model.ts";

export interface Migration {
  id?: number;
  name: string;
  run_on?: Date;
}

export class MigrationModel extends Model<Migration> {
  protected override fillable: string[] =     [
      "name",
      "run_on"
    ];
  protected override primaryKey: string = "id";

  constructor() {
    super("migrations");
  }

  /**
   * Find migrations by id
   */
  async findById(id: string | number): Promise<Migration | null> {
    return this.where("id", id).first();
  }

  /**
   * Create a new migrations record
   */
  async createMigration(data: Partial<Migration>): Promise<Migration> {
    const now = new Date();
    const insertData = {
      ...data
    };
    
    // Add timestamps if they exist in the schema
    
    
    
    return await this.insert(insertData);
  }

  /**
   * Update a migrations record by ID
   */
  async updateMigration(id: string | number, data: Partial<Migration>): Promise<Migration | null> {
    const updateData = { ...data };
    
    
    
    const results = await this.where("id", id)
      .update(updateData);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a migrations record by ID
   */
  async deleteMigration(id: string | number): Promise<boolean> {
    const result = await this.where("id", id).delete();
    return result.length > 0;
  }

  /**
   * Create a new migrations record
   */
  async createMigration

  /**
   * Update a migrations record by ID
   */
  async updateMigration

  /**
   * Delete a migrations record by ID
   */
  async deleteMigration
}

// Create a singleton instance
const migrationsModel = new MigrationModel();
export default migrationsModel;
