import { Context, Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as Controller from "@api/todo/todo.controller.ts";

interface Book {
  id: string;
  title: string;
  author: string;
}

const router = new Router();

router.get("/", (ctx: Context) => {
  ctx.response.body = "Welcome to TODO API";
});

// create todo
router.post("/todos", Controller.CreateTodo);

// get all todos
router.get("/todos", Controller.GetTodos);

// get todo by id
router.get("/todos/:id", Controller.GetTodoById);

// update todo
router.put("/todos/:id", Controller.UpdateTodo);

// delete todo
router.delete("/todos/:id", Controller.DeleteTodo);

// delete all todos
router.delete("/todos", Controller.DeleteAllTodos);

export default router;
