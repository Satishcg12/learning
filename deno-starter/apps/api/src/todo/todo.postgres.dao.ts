import { Client } from 'jsr:@db/postgres';
import { TodoResponse } from "@api/todo/todo.dto.ts";
import { Todo } from "@api/todo/todo.model.ts";
import { ITodoDao } from "@api/todo/todo.interface.ts";

export class TodoPostgresDao implements ITodoDao {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      user: 'satish',
      password: 'satish',
      database: 'test',
      hostname: 'localhost',
      port: 5432,
    });
  }
  
  private async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      console.error('Error connecting to PostgreSQL:', error);
      throw new Error('Database connection error');
    }
  }

  private async disconnect() {
    try {
      await this.client.end();
    } catch (error) {
      console.error('Error disconnecting from PostgreSQL:', error);
    }
  }

  async getTodos(
    page: number = 1,
    limit: number = 10,
  ): Promise<TodoResponse[]> {
    try {
      await this.connect();
      const offset = (page - 1) * limit;
      
      const result = await this.client.queryObject<TodoResponse>(`
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
      
      return result.rows;
    } catch (error) {
      console.error('Error fetching todos:', error);
      throw new Error('Failed to get todos');
    } finally {
      await this.disconnect();
    }
  }

  async getTodoById(id: string): Promise<Todo | null> {
    try {
      await this.connect();
      
      const result = await this.client.queryObject<Todo>(`
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
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error fetching todo by id:', error);
      throw new Error('Failed to get todo');
    } finally {
      await this.disconnect();
    }
  }

  async createTodo(todo: Todo): Promise<Todo> {
    try {
      await this.connect();
      
      // Let PostgreSQL handle the ID generation with SERIAL
      const result = await this.client.queryObject<Todo>(`
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
      
      return result.rows[0];
    } catch (error) {
      console.error('Error creating todo:', error);
      throw new Error('Failed to create todo');
    } finally {
      await this.disconnect();
    }
  }

  async updateTodo(
    id: string,
    updatedTodo: Partial<Todo>,
  ): Promise<Todo | null> {
    try {
      await this.connect();
      
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
        const todo = await this.getTodoById(id);
        return todo;
      }
      
      const result = await this.client.queryObject<Todo>(`
        UPDATE todos 
        SET ${updates.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, title, description, completed, created_at as "createdAt", updated_at as "updatedAt"
      `, values);
      
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      console.error('Error updating todo:', error);
      throw new Error('Failed to update todo');
    } finally {
      await this.disconnect();
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      await this.connect();
      
      const result = await this.client.queryObject(`
        DELETE FROM todos
        WHERE id = $1
        RETURNING id
      `, [id]);
      
      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting todo:', error);
      throw new Error('Failed to delete todo');
    } finally {
      await this.disconnect();
    }
  }

  async deleteAllTodos(): Promise<boolean> {
    try {
      await this.connect();
      
      await this.client.queryObject(`
        DELETE FROM todos
      `);
      
      return true;
    } catch (error) {
      console.error('Error deleting all todos:', error);
      throw new Error('Failed to delete all todos');
    } finally {
      await this.disconnect();
    }
  }
  
  // Helper method to get the total count of todos
  async getTodoCount(): Promise<number> {
    try {
      await this.connect();
      
      const result = await this.client.queryObject<{count: number}>(`
        SELECT COUNT(*) as count FROM todos
      `);
      
      return result.rows[0].count;
    } catch (error) {
      console.error('Error counting todos:', error);
      throw new Error('Failed to count todos');
    } finally {
      await this.disconnect();
    }
  }
}

// Export the singleton instance
export const TodoDao = new TodoPostgresDao();