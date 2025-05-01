// filepath: /home/mine/Projects/learning/deno-starter/apps/api/src/user/user.dto.ts
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
}

export interface GetUsersRequest {
  page?: number;
  limit?: number;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  created_at: Date;
}

export interface UserListResponse {
  users: UserResponse[];
  total: number;
  page: number;
  limit: number;
}