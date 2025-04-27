import { TodoResponse } from "@api/todo/todo.dto.ts";
import { Todo } from "@api/todo/todo.model.ts";

// TodoDao interface defines all the operations for Todo data access
export interface TodoDao {
  getTodos(page?: number, limit?: number): Promise<TodoResponse[]>;
  getTodoById(id: string): Promise<Todo | null>;
  createTodo(todo: Todo): Promise<Todo>;
  updateTodo(id: string, updatedTodo: Partial<Todo>): Promise<Todo | null>;
  deleteTodo(id: string): Promise<boolean>;
  deleteAllTodos(): Promise<boolean>;
}