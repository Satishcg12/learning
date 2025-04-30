import { TodoDao } from "@api/todo/todo.array.dao.ts";
import {
  CreateTodoRequest,
  GetTodosRequest,
  TodoListResponse,
  TodoResponse,
} from "@api/todo/todo.dto.ts";
import { ITodoService } from "@api/todo/todo.interface.ts";
import { Todo } from "@api/models/todo.model.ts";

export class TodoServiceImpl implements ITodoService {
  async createTodo(todo: CreateTodoRequest): Promise<TodoResponse> {
    try {
      // Validate the todo object
      if (!todo.title || !todo.description) {
        throw new Error("Title and description are required");
      }

      // Create a new todo object
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        title: todo.title,
        description: todo.description,
        completed: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const todores = await newTodo;
      if (!todores) {
        throw new Error("Failed to create todo");
      }

      return this.mapToTodoResponse(todores);
    } catch (error) {
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

      const todos = await TodoDao.getTodos(page, limit);
      if (!todos) {
        throw new Error("Failed to get todos");
      }

      return {
        todos: todos.map((todo) => this.mapToTodoResponse(todo)),
        total: todos.length,
        page: page,
        limit: limit,
      };
    } catch (error) {
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

      // Update updatedAt timestamp
      updatedTodo.updatedAt = new Date();

      // Use the DAO's updateTodo function to persist changes
      const updated = await TodoDao.updateTodo(id, updatedTodo);
      if (!updated) {
        throw new Error("Todo not found");
      }

      return this.mapToTodoResponse(updated);
    } catch (error) {
      throw error; // Re-throw the original error to preserve the message
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
      throw error;
    }
  }

  async deleteAllTodos(): Promise<boolean> {
    try {
      // Use the DAO function to clear the todos array
      const result = await TodoDao.deleteAllTodos();
      if (!result) {
        throw new Error("Failed to delete todos");
      }
      return true;
    } catch (error) {
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
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  }
}

// Create and export an instance for singleton usage
export const todoService = new TodoServiceImpl();
