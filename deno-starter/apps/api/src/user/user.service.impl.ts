import { 
  CreateUserRequest,
  GetUsersRequest,
  UserListResponse,
  UserResponse 
} from "./user.dto.ts";
import { IUserDao, IUserService } from "./user.interface.ts";
import { User } from "../models/users.model.ts";
import { UserPostgresDao } from "./user.postgres.dao.ts";

export class UserService implements IUserService {
  private userDao: IUserDao;

  constructor(userDao: IUserDao = new UserPostgresDao()) {
    this.userDao = userDao;
  }

  async createUser(user: CreateUserRequest): Promise<UserResponse> {
    const newUser = await this.userDao.createUser(user as User);
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

  async updateUser(id: string, updatedUser: Partial<User>): Promise<UserResponse> {
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