import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as Service from "@api/todo/todo.service.ts";

export const CreateTodo = async (ctx: RouterContext<string>) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;
    const { title, description } = body;
    // Validate the request body
    if (!title || !description) {
      ctx.response.status = 400;
      ctx.response.body = { message: "Title and description are required" };
      return;
    }
    const res = await Service.CreateTodo({
      title,
      description,
    });

    ctx.response.status = 201;
    ctx.response.body = {
      id: res.id,
      title: res.title,
      description: res.description,
      completed: res.completed,
      createdAt: res.createdAt,
      updatedAt: res.updatedAt,
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Title and description are required") {
        ctx.response.status = 400;
        ctx.response.body = { message: error.message };
        return;
      }

      if (error.message === "Failed to create todo") {
        ctx.response.status = 500;
        ctx.response.body = { message: error.message };
        return;
      }
    }

    // Default error handling
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
};

export const GetTodos = async (ctx: RouterContext<string>) => {
  try {
    const url = new URL(ctx.request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");

    const res = await Service.GetTodos({ page, limit });

    ctx.response.status = 200;
    ctx.response.body = res;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Page and limit must be greater than 0") {
        ctx.response.status = 400;
        ctx.response.body = { message: error.message };
        return;
      }

      if (error.message === "Failed to get todos") {
        ctx.response.status = 500;
        ctx.response.body = { message: error.message };
        return;
      }
    }

    // Default error handling
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
};

export const GetTodoById = async (ctx: RouterContext<string>) => {
  try {
    const id = ctx.params.id;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { message: "ID is required" };
      return;
    }

    const res = await Service.GetTodoById(id);

    ctx.response.status = 200;
    ctx.response.body = res;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Todo not found") {
        ctx.response.status = 404;
        ctx.response.body = { message: error.message };
        return;
      }
    }

    // Default error handling
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
};

export const UpdateTodo = async (ctx: RouterContext<string>) => {
  try {
    const id = ctx.params.id;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { message: "ID is required" };
      return;
    }

    const body = await ctx.request.body({ type: "json" }).value;
    const res = await Service.UpdateTodo(id, body);

    ctx.response.status = 200;
    ctx.response.body = res;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Todo not found") {
        ctx.response.status = 404;
        ctx.response.body = { message: error.message };
        return;
      }
    }

    // Default error handling
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
};

export const DeleteTodo = async (ctx: RouterContext<string>) => {
  try {
    const id = ctx.params.id;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { message: "ID is required" };
      return;
    }

    const res = await Service.DeleteTodo(id);

    ctx.response.status = 204; // No content
    ctx.response.body = null;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Todo not found") {
        ctx.response.status = 404;
        ctx.response.body = { message: error.message };
        return;
      }
    }

    // Default error handling
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
};

export const DeleteAllTodos = async (ctx: RouterContext<string>) => {
  try {
    const res = await Service.DeleteAllTodos();

    ctx.response.status = 204; // No content
    ctx.response.body = null;
  } catch (error) {
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Failed to delete todos") {
        ctx.response.status = 500;
        ctx.response.body = { message: error.message };
        return;
      }
    }

    // Default error handling
    ctx.response.status = 500;
    ctx.response.body = { message: "Internal server error" };
    return;
  }
};
