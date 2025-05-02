// Base API error class that extends Error
export class ApiError extends Error {
  status: number;
  
  constructor(message: string, status: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
  }
  
  static badRequest(message: string): ApiError {
    return new ApiError(message, 400);
  }
  
  static unauthorized(message: string = "Unauthorized"): ApiError {
    return new ApiError(message, 401);
  }
  
  static forbidden(message: string = "Forbidden"): ApiError {
    return new ApiError(message, 403);
  }
  
  static notFound(message: string): ApiError {
    return new ApiError(message, 404);
  }
  
  static conflict(message: string): ApiError {
    return new ApiError(message, 409);
  }
  
  static internal(message: string = "Internal Server Error"): ApiError {
    return new ApiError(message, 500);
  }
  
  static serviceUnavailable(message: string = "Service Unavailable"): ApiError {
    return new ApiError(message, 503);
  }
}

// Service layer error types
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "DatabaseError";
  }
}

// Database layer error
export class DaoError extends Error {
  constructor(message: string, public readonly originalError?: Error) {
    super(message);
    this.name = "DaoError";
  }
}