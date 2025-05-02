/**
 * Authentication Routes
 * Defines API endpoints for authentication operations
 */

import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as authController from "./auth.controller.ts";

const authRouter = new Router({ prefix: "/auth" });

authRouter
  .post("/register", authController.register)
  .post("/login", authController.login);

export default authRouter;