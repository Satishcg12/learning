import { TodoResponse } from "@api/todo/todo.dto.ts";
import { Todo } from "../models/todo.model.ts";
import { ITodoDao } from "@api/todo/todo.interface.ts";

// In-memory implementation that mimics the model approach
export class TodoArrayDao implements ITodoDao {
  private todos: Todo[] = [];

  getTodos(
    page: number = 1,
    limit: number = 10,
  ): Promise<TodoResponse[]> {
    // Apply pagination similar to the model's approach (offset and limit)
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    // Sort by created_at descending to match postgres dao behavior
    const sortedTodos = [...this.todos].sort((a, b) => 
      b.created_at.getTime() - a.created_at.getTime()
    );
    
    // Apply pagination
    const paginatedTodos = sortedTodos.slice(startIndex, endIndex);
    
    // Map to response format
    const resTodos = paginatedTodos.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      createdAt: todo.created_at,
      updatedAt: todo.updated_at,
    }));

    return Promise.resolve(resTodos);
  }

  getTodoById(id: string): Promise<Todo | null> {
    // Similar to model's find() method
    const todo = this.todos.find((todo) => todo.id === id);
    return Promise.resolve(todo || null);
  }

  createTodo(todo: Todo): Promise<Todo> {
    // Similar to model's createTodo method
    this.todos.push(todo);
    return Promise.resolve(todo);
  }

  updateTodo(
    id: string,
    updatedTodo: Partial<Todo>,
  ): Promise<Todo | null> {
    // Similar to model's updateTodo method
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    
    // Set updated_at timestamp
    const todo = this.todos[index];
    this.todos[index] = { 
      ...todo, 
      ...updatedTodo,
      updated_at: new Date()
    };
    
    return Promise.resolve(this.todos[index]);
  }

  deleteTodo(id: string): Promise<boolean> {
    // Similar to model's deleteTodo method
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    
    this.todos.splice(index, 1);
    return Promise.resolve(true);
  }

  deleteAllTodos(): Promise<boolean> {
    // Similar to model's truncate method
    this.todos = [];
    return Promise.resolve(true);
  }
  
  // Helper method to get the total count of todos
  getTodoCount(): Promise<number> {
    return Promise.resolve(this.todos.length);
  }
}

// Export the singleton instance of TodoArrayDao
export const TodoDao = new TodoArrayDao();
