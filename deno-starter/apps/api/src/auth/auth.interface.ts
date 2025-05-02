/**
 * Authentication Service Interface
 * Defines the contract for authentication operations
 */

import { LoginRequest, RegisterRequest, AuthResponse } from "./auth.dto.ts";

export interface IAuthService {
  /**
   * Registers a new user in the system
   * @param data User registration data
   */
  register(data: RegisterRequest): Promise<AuthResponse>;

  /**
   * Authenticates a user
   * @param credentials User login credentials
   */
  login(credentials: LoginRequest): Promise<AuthResponse | null>;
}