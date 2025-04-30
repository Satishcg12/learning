import apiRouter from "@api/routes.ts";
import { initDb } from "@utils/db.ts";
import { info, error } from "@utils/logger.ts";
import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { errorHandler } from "./middleware/errorHandler.ts";

// start the server
const PORT = 8000;

// Initialize the database connection pool once with the correct credentials
// These should match your PostgreSQL setup
const db = initDb({
  user: "satish",
  password: "satish",
  database: "test",
  hostname: "localhost",
  port: 5432,
  poolSize: 10,
});

// Create Oak application
export const app = new Application();

// Apply our centralized error handler middleware
app.use(errorHandler);

// Routes
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

app.addEventListener("listen", () => {
  info(`Server is running on http://localhost:${PORT}`);
});
await app.listen({ port: PORT });

// Close database connections when application shuts down
Deno.addSignalListener("SIGINT", async () => {
  info("Shutting down database connections...");
  await db.close();
  info("Database connections closed");
  Deno.exit();
});
