import { Context, State, Next } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { 
  ApiError, 
  ValidationError, 
  NotFoundError, 
  DatabaseError, 
  DaoError 
} from "../utils/errors.ts";

/**
 * Global error handler middleware for the API
 * Catches errors thrown in routes and returns appropriate responses
 */
export async function errorHandler(ctx: Context<State>, next: Next) {
  try {
    await next();
  } catch (error) {
    const err = error as Error;
    console.error(`[ERROR] ${err.name}: ${err.message}`, err);
    
    // Handle API errors (already formatted with status)
    if (error instanceof ApiError) {
      ctx.response.status = error.status;
      ctx.response.body = { 
        error: error.name,
        message: error.message 
      };
      return;
    }
    
    // Handle validation errors (400 Bad Request)
    if (error instanceof ValidationError) {
      ctx.response.status = 400;
      ctx.response.body = { 
        error: "ValidationError",
        message: error.message 
      };
      return;
    }
    
    // Handle not found errors (404 Not Found)
    if (error instanceof NotFoundError) {
      ctx.response.status = 404;
      ctx.response.body = { 
        error: "NotFoundError",
        message: error.message 
      };
      return;
    }
    
    // Handle database errors (500 Internal Server Error)
    if (error instanceof DatabaseError || error instanceof DaoError) {
      // Log detailed error for debugging but send limited info to client
      console.error("Database error details:", error.originalError);
      
      ctx.response.status = 500;
      ctx.response.body = { 
        error: "DatabaseError",
        message: "A database error occurred." 
      };
      return;
    }
    
    // Generic error fallback (500 Internal Server Error)
    ctx.response.status = 500;
    ctx.response.body = { 
      error: "InternalServerError",
      message: "An unexpected error occurred." 
    };
  } finally {
    // Always set content type to JSON
    ctx.response.headers.set("Content-Type", "application/json");
    
    // Log the response status for monitoring purposes
    console.log(`[${ctx.request.method}] ${ctx.request.url.pathname} - ${ctx.response.status}`);
  }
}
