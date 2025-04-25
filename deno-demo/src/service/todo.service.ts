import { createTodo, getTodos, updateTodo, deleteTodo, deleteAllTodos, getTodoById } from "../DAO/todo.array.dao.ts";
import { CreateTodoRequest, GetTodosRequest } from "../DTO/todo.dto.ts";
import { Todo } from "../models/todo.model.ts";

export const CreateTodo = (todo: CreateTodoRequest) => {
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

    const todores = createTodo(newTodo);
    if (!todores) {
      throw new Error("Failed to create todo");
    }
    return {
      id: todores.id,
      title: todores.title,
      description: todores.description,
      completed: todores.completed,
      createdAt: todores.createdAt,
      updatedAt: todores.updatedAt,
    };
  } catch (error) {
    throw new Error("Internal server error");
  }
};

export const GetTodos = (req: GetTodosRequest) => {
  try {
    const page = req.page || 1;
    const limit = req.limit || 10;

    // Validate the page and limit
    if (page < 1 || limit < 1) {
      throw new Error("Page and limit must be greater than 0");
    }

    const todos = getTodos(page, limit);
    if (!todos) {
      throw new Error("Failed to get todos");
    }

    return {
      todos: todos,
      total: todos.length,
      page: page,
      limit: limit,
    };
  } catch (error) {
    throw new Error("Internal server error");
  }
};

export const GetTodoById = (id: string) => {
  try {
    // Validate the id
    if (!id) {
      throw new Error("ID is required");
    }

    const todo = getTodoById(id);
    if (!todo) {
      throw new Error("Todo not found");
    }

    return {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      createdAt: todo.createdAt,
      updatedAt: todo.updatedAt,
    };
  } catch (error) {
    throw error;
  }
};

export const UpdateTodo = (id: string, updatedTodo: Partial<Todo>) => {
  try {
    // Validate the id
    if (!id) {
      throw new Error("ID is required");
    }

    // Update updatedAt timestamp
    updatedTodo.updatedAt = new Date();
    
    // Use the DAO's updateTodo function to persist changes
    const updated = updateTodo(id, updatedTodo);
    if (!updated) {
      throw new Error("Todo not found");
    }

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description,
      completed: updated.completed,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  } catch (error) {
    throw error; // Re-throw the original error to preserve the message
  }
};

export const DeleteTodo = (id: string) => {
  try {
    // Validate the id
    if (!id) {
      throw new Error("ID is required");
    }

    const result = deleteTodo(id);
    if (!result) {
      throw new Error("Todo not found");
    }

    return true;
  } catch (error) {
    throw error;
  }
};

export const DeleteAllTodos = () => {
  try {
    // Use the DAO function to clear the todos array
    const result = deleteAllTodos();
    if (!result) {
      throw new Error("Failed to delete todos");
    }
    return true;
  } catch (error) {
    throw error;
  }
};
