// Generated model file for users
import { Model } from "./Model.ts";

export interface User {
  id?: number;
  name: string;
  email: string;
  password: string;
  created_at?: Date;
}

export class UserModel extends Model<User> {
  protected override fillable: string[] =     [
      "name",
      "email",
      "password"
    ];
  protected override primaryKey: string = "id";

  constructor() {
    super("users");
  }

  /**
   * Find users by id
   */
  async findById(id: string | number): Promise<User | null> {
    return this.where("id", id).first();
  }

  /**
   * Create a new users record
   */
  async createUser(data: Partial<User>): Promise<User> {
    const now = new Date();
    const insertData = {
      ...data
    };
    
    // Add timestamps if they exist in the schema
    insertData.created_at = now;
    
    
    return await this.insert(insertData);
  }

  /**
   * Update a users record by ID
   */
  async updateUser(id: string | number, data: Partial<User>): Promise<User | null> {
    const updateData = { ...data };
    
    
    
    const results = await this.where("id", id)
      .update(updateData);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a users record by ID
   */
  async deleteUser(id: string | number): Promise<boolean> {
    const result = await this.where("id", id).delete();
    return result.length > 0;
  }

}

// Create a singleton instance
const usersModel = new UserModel();
export default usersModel;
