import { 
  CreateUserRequest,
  GetUsersRequest,
  UserListResponse,
  UserResponse 
} from "./user.dto.ts";
import { IUserDao, IUserService } from "./user.interface.ts";
import { User } from "../models/users.model.ts";
import { UserPostgresDao } from "./user.postgres.dao.ts";
import { hashPassword } from "@utils/password.ts";
import { ValidationError } from "../../../../packages/utils/errors.ts";

export class UserService implements IUserService {
  private userDao: IUserDao;

  constructor(userDao: IUserDao = new UserPostgresDao()) {
    this.userDao = userDao;
  }

  async createUser(user: CreateUserRequest): Promise<UserResponse> {
    // Check if email already exists
    const existingUser = await this.userDao.getUserByEmail(user.email);
    if (existingUser) {
      throw new ValidationError("Email already in use");
    }
    
    // Hash the password before storing it
    const hashedPassword = await hashPassword(user.password);
    
    // Create user with hashed password
    const userWithHashedPassword = {
      ...user,
      password: hashedPassword
    } as User;
    
    const newUser = await this.userDao.createUser(userWithHashedPassword);
    return this.mapToUserResponse(newUser);
  }

  async getUsers(req: GetUsersRequest): Promise<UserListResponse> {
    const { page = 1, limit = 10 } = req;
    const users = await this.userDao.getUsers(page, limit);
    const total = users.length; // In a real app, this would be a separate count query

    return {
      users,
      total,
      page,
      limit
    };
  }

  async getUserById(id: string): Promise<UserResponse> {
    const user = await this.userDao.getUserById(id);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return this.mapToUserResponse(user);
  }

  async getUserByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.userDao.getUserByEmail(email);
    if (!user) {
      return null;
    }
    return this.mapToUserResponse(user);
  }
  
  async getUserDetailsForAuth(email: string): Promise<User | null> {
    // This method is specifically for authentication purposes
    // It returns the full user object including password
    return await this.userDao.getUserByEmail(email);
  }

  async updateUser(id: string, updatedUser: Partial<User>): Promise<UserResponse> {
    // If the password is being updated, hash it first
    if (updatedUser.password) {
      updatedUser.password = await hashPassword(updatedUser.password);
    }
    
    const user = await this.userDao.updateUser(id, updatedUser);
    if (!user) {
      throw new Error(`User with ID ${id} not found`);
    }
    return this.mapToUserResponse(user);
  }

  async deleteUser(id: string): Promise<boolean> {
    return await this.userDao.deleteUser(id);
  }

  private mapToUserResponse(user: User): UserResponse {
    return {
      id: user.id?.toString() || "",
      name: user.name,
      email: user.email,
      created_at: user.created_at || new Date()
    };
  }
}