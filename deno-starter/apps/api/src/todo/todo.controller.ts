import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { todoService } from "@api/todo/todo.service.impl.ts";
import { ApiError } from "../../../../packages/utils/errors.ts";

export const CreateTodo = async (ctx: RouterContext<string>) => {
  let body;
  try {
    body = await ctx.request.body({ type: "json" }).value;
  } catch (e) {
    throw ApiError.badRequest("Invalid JSON in request body");
  }
  
  const { title, description } = body;
  
  // Validate the request body
  if (!title || !description) {
    throw ApiError.badRequest("Title and description are required");
  }
  
  const res = await todoService.createTodo({ title, description });

  ctx.response.status = 201;
  ctx.response.body = res;
};

export const GetTodos = async (ctx: RouterContext<string>) => {
  const url = new URL(ctx.request.url);
  let page: number, limit: number;
  
  try {
    page = parseInt(url.searchParams.get("page") || "1");
    limit = parseInt(url.searchParams.get("limit") || "10");
  } catch (e) {
    throw ApiError.badRequest("Page and limit must be valid numbers");
  }

  if (page < 1 || limit < 1) {
    throw ApiError.badRequest("Page and limit must be greater than 0");
  }

  const res = await todoService.getTodos({ page, limit });

  ctx.response.status = 200;
  ctx.response.body = res;
};

export const GetTodoById = async (ctx: RouterContext<string>) => {
  const id = ctx.params.id;
  if (!id) {
    throw ApiError.badRequest("ID is required");
  }

  const res = await todoService.getTodoById(id);

  ctx.response.status = 200;
  ctx.response.body = res;
};

export const UpdateTodo = async (ctx: RouterContext<string>) => {
  const id = ctx.params.id;
  if (!id) {
    throw ApiError.badRequest("ID is required");
  }

  let body;
  try {
    body = await ctx.request.body({ type: "json" }).value;
  } catch (e) {
    throw ApiError.badRequest("Invalid JSON in request body");
  }
  
  const res = await todoService.updateTodo(id, body);

  ctx.response.status = 200;
  ctx.response.body = res;
};

export const DeleteTodo = async (ctx: RouterContext<string>) => {
  const id = ctx.params.id;
  if (!id) {
    throw ApiError.badRequest("ID is required");
  }

  await todoService.deleteTodo(id);
  
  ctx.response.status = 204; // No content
  ctx.response.body = null;
};

export const DeleteAllTodos = async (ctx: RouterContext<string>) => {
  await todoService.deleteAllTodos();

  ctx.response.status = 204; // No content
  ctx.response.body = null;
};
