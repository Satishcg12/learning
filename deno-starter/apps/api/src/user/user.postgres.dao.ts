import { IUserDao } from "./user.interface.ts";
import { User } from "../models/users.model.ts";
import usersModel from "../models/users.model.ts";
import { UserResponse } from "./user.dto.ts";
import { DaoError } from "../../../../packages/utils/errors.ts";

export class UserPostgresDao implements IUserDao {
  async getUsers(page = 1, limit = 10): Promise<UserResponse[]> {
    try {
      const offset = (page - 1) * limit;
      const users = await usersModel
        .select("id", "name", "email", "created_at")
        .orderBy("created_at", "DESC")
        .limit(limit)
        .offset(offset)
        .getAll<User>();
      
      return users.map(this.mapToUserResponse);
    } catch (error) {
      console.error('DAO error fetching users:', error);
      throw new DaoError('Failed to get users', error instanceof Error ? error : undefined);
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      return await usersModel.findById(id);
    } catch (error) {
      console.error('DAO error fetching user by id:', error);
      throw new DaoError('Failed to get user', error instanceof Error ? error : undefined);
    }
  }

  async createUser(user: User): Promise<User> {
    try {
      return await usersModel.createUser(user);
    } catch (error) {
      console.error('DAO error creating user:', error);
      throw new DaoError('Failed to create user', error instanceof Error ? error : undefined);
    }
  }

  async updateUser(id: string, updatedUser: Partial<User>): Promise<User | null> {
    try {
      return await usersModel.updateUser(id, updatedUser);
    } catch (error) {
      console.error('DAO error updating user:', error);
      throw new DaoError('Failed to update user', error instanceof Error ? error : undefined);
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      return await usersModel.deleteUser(id);
    } catch (error) {
      console.error('DAO error deleting user:', error);
      throw new DaoError('Failed to delete user', error instanceof Error ? error : undefined);
    }
  }

  /**
   * Get user by email - used for credential verification
   */
  async getUserByEmail(email: string): Promise<User | null> {
    try {
      return await usersModel
        .select("*")
        .where("email", email)
        .first<User>();
    } catch (error) {
      console.error('DAO error fetching user by email:', error);
      throw new DaoError('Failed to get user by email', error instanceof Error ? error : undefined);
    }
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

// Export the singleton instance
export const UserDao = new UserPostgresDao();