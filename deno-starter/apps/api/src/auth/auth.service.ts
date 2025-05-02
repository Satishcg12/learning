/**
 * Authentication Service Implementation
 * Handles user authentication operations
 */

import { verifyPassword } from "@utils/password.ts";
import { IUserService } from "../user/user.interface.ts";
import { UserService } from "../user/user.service.impl.ts";
import { ValidationError } from "../../../../packages/utils/errors.ts";
import { AuthResponse, LoginRequest, RegisterRequest } from "./auth.dto.ts";
import { IAuthService } from "./auth.interface.ts";

export class AuthService implements IAuthService {
  private userService: IUserService;

  constructor(userService: IUserService = new UserService()) {
    this.userService = userService;
  }

  /**
   * Register a new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    // Validate input
    if (!data.name) {
      throw new ValidationError("Name is required");
    }
    if (!data.email) {
      throw new ValidationError("Email is required");
    }
    if (!data.password) {
      throw new ValidationError("Password is required");
    }
    if (data.password.length < 8) {
      throw new ValidationError("Password must be at least 8 characters long");
    }

    // Check if email already exists by trying to find a user with the given email
    try {
      // Let the user service handle the user creation
      const newUser = await this.userService.createUser({
        name: data.name,
        email: data.email,
        password: data.password
      });

      return {
        message: "Registration successful",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          created_at: newUser.created_at
        }
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("already in use")) {
        throw new ValidationError("Email already in use");
      }
      throw error;
    }
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginRequest): Promise<AuthResponse | null> {
    // Validate input
    if (!credentials.email || !credentials.password) {
      throw new ValidationError("Email and password are required");
    }

    // Check if this user exists and get user details
    const user = await this.userService.getUserByEmail(credentials.email);
    
    if (!user) {
      return null; // User not found
    }

    // Get the full user details including password for verification
    const fullUserDetails = await this.userService.getUserDetailsForAuth(credentials.email);
    
    if (!fullUserDetails || !fullUserDetails.password) {
      return null; // User not found or no password
    }

    // Verify password
    const isPasswordValid = await verifyPassword(
      credentials.password, 
      fullUserDetails.password
    );
    
    if (!isPasswordValid) {
      return null; // Invalid password
    }

    return {
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: user.created_at
      }
    };
  }
}

// Create a singleton instance
export const authService = new AuthService();