import { TodoResponse } from "../DTO/todo.dto.ts";
import { Todo } from "../models/todo.model.ts";

let todos: Todo[] = [];

export const getTodos = (
  page: number = 1,
  limit: number = 10,
): TodoResponse[] => {
  const resTodos = todos.slice((page - 1) * limit, page * limit).map((
    todo,
  ) => ({
    id: todo.id,
    title: todo.title,
    description: todo.description,
    completed: todo.completed,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  }));

  return resTodos;
};
export const getTodoById = (id: string): Todo | null => {
  const todo = todos.find((todo) => todo.id === id);
  if (!todo) {
    return null;
  }
  return todo;
};
export const createTodo = (todo: Todo): Todo => {
  todos.push(todo);
  return todo;
};
export const updateTodo = (
  id: string,
  updatedTodo: Partial<Todo>,
): Todo | null => {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    return null;
  }
  const todo = todos[index];
  todos[index] = { ...todo, ...updatedTodo };
  return todos[index];
};
export const deleteTodo = (id: string): boolean => {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    return false;
  }
  todos.splice(index, 1);
  return true;
};
export const deleteAllTodos = (): boolean => {
  todos = [];
  return true;
};
