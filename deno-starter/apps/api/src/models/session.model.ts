// Generated model file for session
import { Model } from "./Model.ts";

export interface Session {
  id?: number;
  user_id: number;
  session_token: string;
  created_at?: Date;
  updated_at?: Date;
}

export class SessionModel extends Model<Session> {
  protected override fillable: string[] = [
    "user_id",
    "session_token"
  ];
  protected override primaryKey: string = "id";

  constructor() {
    super("session");
  }

  /**
   * Find session by id
   */
  async findById(id: string | number): Promise<Session | null> {
    return this.where("id", id).first();
  }

  /**
   * Create a new session record
   */
  async createSession(data: Partial<Session>): Promise<Session> {
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
   * Update a session record by ID
   */
  async updateSession(id: string | number, data: Partial<Session>): Promise<Session | null> {
    const updateData = { ...data };
    
    updateData.updated_at = new Date();
    
    const results = await this.where("id", id)
      .update(updateData);
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a session record by ID
   */
  async deleteSession(id: string | number): Promise<boolean> {
    const result = await this.where("id", id).delete();
    return result.length > 0;
  }
}

// Create a singleton instance
const sessionModel = new SessionModel();
export default sessionModel;
