import { TodoResponse } from "@api/todo/todo.dto.ts";
import { Todo } from "@api/todo/todo.model.ts";
import { ITodoDao } from "@api/todo/todo.interface.ts";
import { getDb } from "../../../../packages/utils/db.ts";

export class TodoPostgresDao implements ITodoDao {
  
  async getTodos(
    page: number = 1,
    limit: number = 10,
  ): Promise<TodoResponse[]> {
    try {
      const offset = (page - 1) * limit;
      
      const db = getDb();
      return await db.query<TodoResponse>(`
        SELECT 
          id, 
          title, 
          description, 
          completed, 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM todos
        ORDER BY created_at DESC
        LIMIT $1 OFFSET $2
      `, [limit, offset]);
      
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw new Error('Failed to get todos');
    }
  }

  async getTodoById(id: string): Promise<Todo | null> {
    try {
      const db = getDb();
      const result = await db.query<Todo>(`
        SELECT 
          id, 
          title, 
          description, 
          completed, 
          created_at as "createdAt", 
          updated_at as "updatedAt"
        FROM todos
        WHERE id = $1
      `, [id]);
      
      return result.length > 0 ? result[0] : null;
    } catch (error) {
      console.error('Error fetching todo by id:', error);
      throw new Error('Failed to get todo');
    }
  }

  async createTodo(todo: Todo): Promise<Todo> {
    try {
      const db = getDb();
      const result = await db.query<Todo>(`
        INSERT INTO todos (title, description, completed, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"
      `, [
        todo.title,
        todo.description,
        todo.completed,
        todo.createdAt,
        todo.updatedAt
      ]);
      
      return result[0];
    } catch (error) {
      console.error('Error creating todo:', error);
      throw new Error('Failed to create todo');
    }
  }

  async updateTodo(
    id: string,
    updatedTodo: Partial<Todo>,
  ): Promise<Todo | null> {
    // Use a transaction for complex update operation
    try {
      const db = getDb();
      
      return await db.transaction(async (client) => {
        // Build dynamic SQL for update
        const updates: string[] = [];
        const values: any[] = [];
        let paramCount = 1;
        
        if (updatedTodo.title !== undefined) {
          updates.push(`title = $${paramCount++}`);
          values.push(updatedTodo.title);
        }
        
        if (updatedTodo.description !== undefined) {
          updates.push(`description = $${paramCount++}`);
          values.push(updatedTodo.description);
        }
        
        if (updatedTodo.completed !== undefined) {
          updates.push(`completed = $${paramCount++}`);
          values.push(updatedTodo.completed);
        }
        
        if (updatedTodo.updatedAt !== undefined) {
          updates.push(`updated_at = $${paramCount++}`);
          values.push(updatedTodo.updatedAt);
        }
        
        // Add ID as the last parameter
        values.push(id);
        
        if (updates.length === 0) {
          const todoResult = await client.queryObject<Todo>(`
            SELECT id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"
            FROM todos
            WHERE id = $1
          `, [id]);
          return todoResult.rows.length > 0 ? todoResult.rows[0] : null;
        }
        
        const result = await client.queryObject<Todo>(`
          UPDATE todos 
          SET ${updates.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"
        `, values);
        
        return result.rows.length > 0 ? result.rows[0] : null;
      });
    } catch (error) {
      console.error('Error updating todo:', error);
      throw new Error('Failed to update todo');
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      const db = getDb();
      const result = await db.query<{ id: string }>(`
        DELETE FROM todos
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw new Error('Failed to delete todo');
    }
  }

  async deleteAllTodos(): Promise<boolean> {
    try {
      const db = getDb();
      await db.query(`
        DELETE FROM todos
      `);
      
      return true;
    } catch (error) {
      console.error('Error deleting all todos:', error);
      throw new Error('Failed to delete all todos');
    }
  }
  
  // Helper method to get the total count of todos
  async getTodoCount(): Promise<number> {
    try {
      const db = getDb();
      const result = await db.query<{count: number}>(`
        SELECT COUNT(*) as count FROM todos
      `);
      
      return result[0].count;
    } catch (error) {
      console.error('Error counting todos:', error);
      throw new Error('Failed to count todos');
    }
  }
}

// Export the singleton instance
export const TodoDao = new TodoPostgresDao();