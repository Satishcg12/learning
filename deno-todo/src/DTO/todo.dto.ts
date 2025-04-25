export interface CreateTodoRequest {
  title: string;
  description: string;
}

export interface UpdateTodoRequest {
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface GetTodosRequest {
  page?: number;
  limit?: number;
}

export interface TodoResponse {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface TodoListResponse {
  todos: TodoResponse[];
  total: number;
  page: number;
  limit: number;
}
