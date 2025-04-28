import {
  CreateTodoRequest,
  GetTodosRequest,
  TodoListResponse,
  TodoResponse,
} from "@api/todo/todo.dto.ts";
import { Todo } from "@api/todo/todo.model.ts";

export interface ITodoService {
  createTodo(todo: CreateTodoRequest): Promise<TodoResponse>;

  getTodos(req: GetTodosRequest): Promise<TodoListResponse>;

  getTodoById(id: string): Promise<TodoResponse>;

  updateTodo(id: string, updatedTodo: Partial<Todo>): Promise<TodoResponse>;

  deleteTodo(id: string): Promise<boolean>;

  deleteAllTodos(): Promise<boolean>;
}

export interface ITodoDao {
  getTodos(page?: number, limit?: number): Promise<TodoResponse[]>;
  getTodoById(id: string): Promise<Todo | null>;
  createTodo(todo: Todo): Promise<Todo>;
  updateTodo(id: string, updatedTodo: Partial<Todo>): Promise<Todo | null>;
  deleteTodo(id: string): Promise<boolean>;
  deleteAllTodos(): Promise<boolean>;
}
