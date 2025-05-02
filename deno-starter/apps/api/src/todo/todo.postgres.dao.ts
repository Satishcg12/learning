import { TodoResponse } from "@api/todo/todo.dto.ts";
import { Todo } from "../models/todo.model.ts";
import { ITodoDao } from "@api/todo/todo.interface.ts";
import todoModel from "../models/todo.model.ts";
import { DaoError } from "../../../../packages/utils/errors.ts";

export class TodoPostgresDao implements ITodoDao {
  
  async getTodos(
    page: number = 1,
    limit: number = 10,
  ): Promise<TodoResponse[]> {
    try {
      // Using the model with pagination
      const result = await todoModel
        .select("id", "title", "description", "completed", "created_at", "updated_at")
        .orderBy("created_at", "DESC")
        .limit(limit)
        .offset((page - 1) * limit)
        .getAll<Todo>();
      
      // Map to TodoResponse
      return result.map(todo => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        createdAt: todo.created_at,
        updatedAt: todo.updated_at
      }));
      
    } catch (error) {
      console.error('DAO error fetching todos:', error);
      throw new DaoError('Failed to get todos', error instanceof Error ? error : undefined);
    }
  }

  async getTodoById(id: string): Promise<Todo | null> {
    try {
      return await todoModel.find(id);
    } catch (error) {
      console.error('DAO error fetching todo by id:', error);
      throw new DaoError('Failed to get todo', error instanceof Error ? error : undefined);
    }
  }

  async createTodo(todo: Todo): Promise<Todo> {
    try {
      return await todoModel.createTodo(todo);
    } catch (error) {
      console.error('DAO error creating todo:', error);
      throw new DaoError('Failed to create todo', error instanceof Error ? error : undefined);
    }
  }

  async updateTodo(
    id: string,
    updatedTodo: Partial<Todo>,
  ): Promise<Todo | null> {
    try {
      return await todoModel.updateTodo(id, updatedTodo);
    } catch (error) {
      console.error('DAO error updating todo:', error);
      throw new DaoError('Failed to update todo', error instanceof Error ? error : undefined);
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      return await todoModel.deleteTodo(id);
    } catch (error) {
      console.error('DAO error deleting todo:', error);
      throw new DaoError('Failed to delete todo', error instanceof Error ? error : undefined);
    }
  }

  async deleteAllTodos(): Promise<boolean> {
    try {
      await todoModel.truncate();
      return true;
    } catch (error) {
      console.error('DAO error deleting all todos:', error);
      throw new DaoError('Failed to delete all todos', error instanceof Error ? error : undefined);
    }
  }
  
  // Helper method to get the total count of todos
  async getTodoCount(): Promise<number> {
    try {
      return await todoModel.count();
    } catch (error) {
      console.error('DAO error counting todos:', error);
      throw new DaoError('Failed to count todos', error instanceof Error ? error : undefined);
    }
  }
}

// Export the singleton instance
export const TodoDao = new TodoPostgresDao();