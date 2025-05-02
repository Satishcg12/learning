/**
 * Authentication Controller
 * Handles HTTP requests for authentication operations
 */

import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { authService } from "./auth.service.ts";
import { ApiError, ValidationError } from "../../../../packages/utils/errors.ts";
import { LoginRequest, RegisterRequest } from "./auth.dto.ts";

/**
 * Register a new user
 */
export const register = async (ctx: RouterContext<string>) => {
  try {
    // Parse request body
    const body = await ctx.request.body({ type: "json" }).value as RegisterRequest;
    
    // Validate basic request data
    if (!body.name || !body.email || !body.password) {
      throw ApiError.badRequest("Name, email, and password are required");
    }
    
    if (body.password.length < 8) {
      throw ApiError.badRequest("Password must be at least 8 characters long");
    }
    
    // Register the user
    try {
      const response = await authService.register(body);
      
      // Return success response
      ctx.response.status = 201;
      ctx.response.body = response;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw ApiError.badRequest(error.message);
      }
      throw error;
    }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.badRequest(error instanceof Error ? error.message : 'Unknown error');
  }
};

/**
 * Login a user
 */
export const login = async (ctx: RouterContext<string>) => {
  try {
    // Parse request body
    const body = await ctx.request.body({ type: "json" }).value as LoginRequest;
    
    // Validate basic request data
    if (!body.email || !body.password) {
      throw ApiError.badRequest("Email and password are required");
    }
    
    // Authenticate the user
    const response = await authService.login(body);
    
    // Handle invalid credentials
    if (!response) {
      throw ApiError.unauthorized("Invalid email or password");
    }
    
    // Return success response
    ctx.response.status = 200;
    ctx.response.body = response;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.badRequest(error instanceof Error ? error.message : 'Unknown error');
  }
};