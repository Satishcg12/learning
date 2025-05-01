import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { CreateUser, DeleteUser, GetUserById, GetUsers, UpdateUser } from "./user.controller.ts";

const userRouter = new Router();

userRouter
  .get("/users", GetUsers)
  .get("/users/:id", GetUserById)
  .post("/users", CreateUser)
  .put("/users/:id", UpdateUser)
  .delete("/users/:id", DeleteUser);

export default userRouter;