import { TodoResponse } from "@api/todo/todo.dto.ts";
import { Todo } from "@api/todo/todo.model.ts";
import { TodoDao } from "@api/todo/todo.dao.ts";

// In-memory implementation of TodoDao using an array
export class TodoArrayDao implements TodoDao {
  private todos: Todo[] = [];

  getTodos(
    page: number = 1,
    limit: number = 10,
  ): Promise<TodoResponse[]> {
    const resTodos = this.todos.slice((page - 1) * limit, page * limit).map((
      todo,
    ) => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    }));

    return Promise.resolve(resTodos);
  }

  getTodoById(id: string): Promise<Todo | null> {
    const todo = this.todos.find((todo) => todo.id === id);
    if (!todo) {
      return Promise.resolve(null);
    }
    return Promise.resolve(todo);
  }

  createTodo(todo: Todo): Promise<Todo> {
    this.todos.push(todo);
    return Promise.resolve(todo);
  }

  updateTodo(
    id: string,
    updatedTodo: Partial<Todo>,
  ): Promise<Todo | null> {
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      return Promise.resolve(null);
    }
    const todo = this.todos[index];
    this.todos[index] = { ...todo, ...updatedTodo };
    return Promise.resolve(this.todos[index]);
  }

  deleteTodo(id: string): Promise<boolean> {
    const index = this.todos.findIndex((todo) => todo.id === id);
    if (index === -1) {
      return Promise.resolve(false);
    }
    this.todos.splice(index, 1);
    return Promise.resolve(true);
  }

  deleteAllTodos(): Promise<boolean> {
    this.todos = [];
    return Promise.resolve(true);
  }
}

// Create an instance of TodoArrayDao to export as a singleton
const todoDao: TodoDao = new TodoArrayDao();
export default todoDao;

// Export individual methods for backward compatibility
export const { 
  getTodos, 
  getTodoById, 
  createTodo, 
  updateTodo, 
  deleteTodo,
  deleteAllTodos 
} = todoDao;
