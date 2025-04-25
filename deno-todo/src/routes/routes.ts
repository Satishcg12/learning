import { Context, Router } from "@oak/oak";
import * as Controller from "../controllers/todo.controller.ts";

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
