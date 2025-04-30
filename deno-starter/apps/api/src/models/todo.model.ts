import { Model } from "./Model.ts";

export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  created_at: Date;
  updated_at: Date;
}

export class TodoModel extends Model<Todo> {
  protected override fillable: string[] = [
    "title",
    "description",
    "completed",
  ];

  constructor() {
    super("todos");
  }

  /**
   * Find todos by completion status
   */
  async findByCompletionStatus(completed: boolean): Promise<Todo[]> {
    return this.where("completed", completed).getAll();
  }

  /**
   * Find todos created after a specific date
   */
  async findCreatedAfter(date: Date): Promise<Todo[]> {
    return this.where("created_at", ">", date).getAll();
  }

  /**
   * Create a new todo
   */
  async createTodo(todo: Partial<Todo>): Promise<Todo> {
    const now = new Date();
    return await this.insert({
      ...todo,
      created_at: now,
      updated_at: now,
    });
  }

  /**
   * Update a todo by ID
   */
  async updateTodo(id: string, todo: Partial<Todo>): Promise<Todo | null> {
    const results = await this.where(this.primaryKey, id)
      .update({
        ...todo,
        updated_at: new Date(),
      });
    
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Delete a todo by ID
   */
  async deleteTodo(id: string): Promise<boolean> {
    const result = await this.where(this.primaryKey, id).delete();
    return result.length > 0;
  }
}

// Create a singleton instance
const todoModel = new TodoModel();
export default todoModel;
