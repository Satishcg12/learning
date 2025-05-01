import { RouterContext } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { UserService } from "./user.service.impl.ts";
import { ApiError } from "../utils/errors.ts";

// Create a singleton instance of the service
const userService = new UserService();

export const CreateUser = async (ctx: RouterContext<string>) => {
  let body;
  try {
    body = await ctx.request.body({ type: "json" }).value;
  } catch (e) {
    throw ApiError.badRequest("Invalid JSON in request body");
  }
  
  const { name, email, password } = body;
  
  // Validate the request body
  if (!name || !email || !password) {
    throw ApiError.badRequest("Name, email, and password are required");
  }
  
  const res = await userService.createUser({ name, email, password });

  ctx.response.status = 201;
  ctx.response.body = res;
};

export const GetUsers = async (ctx: RouterContext<string>) => {
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

  const res = await userService.getUsers({ page, limit });

  ctx.response.status = 200;
  ctx.response.body = res;
};

export const GetUserById = async (ctx: RouterContext<string>) => {
  const id = ctx.params.id;
  if (!id) {
    throw ApiError.badRequest("ID is required");
  }

  const res = await userService.getUserById(id);

  ctx.response.status = 200;
  ctx.response.body = res;
};

export const UpdateUser = async (ctx: RouterContext<string>) => {
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
  
  const res = await userService.updateUser(id, body);

  ctx.response.status = 200;
  ctx.response.body = res;
};

export const DeleteUser = async (ctx: RouterContext<string>) => {
  const id = ctx.params.id;
  if (!id) {
    throw ApiError.badRequest("ID is required");
  }

  await userService.deleteUser(id);
  
  ctx.response.status = 204; // No content
  ctx.response.body = null;
};