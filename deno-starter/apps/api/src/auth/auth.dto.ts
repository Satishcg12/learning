/**
 * Authentication Data Transfer Objects
 * Defines the structure of data objects for auth operations
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  user: {
    id: string;
    name: string;
    email: string;
    created_at: Date;
  };
}