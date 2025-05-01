import {
  CreateUserRequest,
  GetUsersRequest,
  UserListResponse,
  UserResponse,
} from "./user.dto.ts";
import { User } from "../models/users.model.ts";

export interface IUserService {
  createUser(user: CreateUserRequest): Promise<UserResponse>;

  getUsers(req: GetUsersRequest): Promise<UserListResponse>;

  getUserById(id: string): Promise<UserResponse>;

  updateUser(id: string, updatedUser: Partial<User>): Promise<UserResponse>;

  deleteUser(id: string): Promise<boolean>;
}

export interface IUserDao {
  getUsers(page?: number, limit?: number): Promise<UserResponse[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, updatedUser: Partial<User>): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}