import { TodoDao } from "@api/todo/todo.postgres.dao.ts";
import {
  CreateTodoRequest,
  GetTodosRequest,
  TodoListResponse,
  TodoResponse,
} from "@api/todo/todo.dto.ts";
import { ITodoService } from "@api/todo/todo.interface.ts";
import { Todo } from "../models/todo.model.ts";

export class TodoServiceImpl implements ITodoService {
  async createTodo(todo: CreateTodoRequest): Promise<TodoResponse> {
    try {
      // Validate the todo object
      if (!todo.title || !todo.description) {
        throw new Error("Title and description are required");
      }

      // Create a new todo object with the required fields
      const newTodo = {
        id: crypto.randomUUID(),
        title: todo.title,
        description: todo.description,
        completed: false,
      };

      // Use the DAO to persist the todo
      const createdTodo = await TodoDao.createTodo(newTodo as Todo);

      return this.mapToTodoResponse(createdTodo);
    } catch (error) {
      console.error('Error in createTodo service:', error);
      throw new Error("Internal server error");
    }
  }

  async getTodos(req: GetTodosRequest): Promise<TodoListResponse> {
    try {
      const page = req.page || 1;
      const limit = req.limit || 10;

      // Validate the page and limit
      if (page < 1 || limit < 1) {
        throw new Error("Page and limit must be greater than 0");
      }

      // Get todos with pagination
      const todos = await TodoDao.getTodos(page, limit);
      
      // Get the total count
      const total = await TodoDao.getTodoCount();

      return {
        todos,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error in getTodos service:', error);
      throw new Error("Internal server error");
    }
  }

  async getTodoById(id: string): Promise<TodoResponse> {
    try {
      // Validate the id
      if (!id) {
        throw new Error("ID is required");
      }

      const todo = await TodoDao.getTodoById(id);
      if (!todo) {
        throw new Error("Todo not found");
      }

      return this.mapToTodoResponse(todo);
    } catch (error) {
      console.error('Error in getTodoById service:', error);
      throw error;
    }
  }

  async updateTodo(
    id: string,
    updatedTodo: Partial<Todo>,
  ): Promise<TodoResponse> {
    try {
      // Validate the id
      if (!id) {
        throw new Error("ID is required");
      }

      // Use the DAO's updateTodo function to persist changes
      const updated = await TodoDao.updateTodo(id, updatedTodo);
      if (!updated) {
        throw new Error("Todo not found");
      }

      return this.mapToTodoResponse(updated);
    } catch (error) {
      console.error('Error in updateTodo service:', error);
      throw error;
    }
  }

  async deleteTodo(id: string): Promise<boolean> {
    try {
      // Validate the id
      if (!id) {
        throw new Error("ID is required");
      }

      const result = await TodoDao.deleteTodo(id);
      if (!result) {
        throw new Error("Todo not found");
      }

      return true;
    } catch (error) {
      console.error('Error in deleteTodo service:', error);
      throw error;
    }
  }

  async deleteAllTodos(): Promise<boolean> {
    try {
      return await TodoDao.deleteAllTodos();
    } catch (error) {
      console.error('Error in deleteAllTodos service:', error);
      throw error;
    }
  }

  // Helper method to map Todo entity to TodoResponse
  private mapToTodoResponse(todo: Todo): TodoResponse {
    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
    };
  }
}

// Create and export an instance for singleton usage
export const todoService = new TodoServiceImpl();
