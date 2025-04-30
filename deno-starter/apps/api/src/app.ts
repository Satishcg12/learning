import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { errorHandler } from "./middleware/errorHandler.ts";
import { initDb } from "@utils/db.ts";
import apiRouter from "@api/routes.ts";

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
  poolSize: 10
});

// Create Oak application
export const app = new Application();


// Routes
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

app.addEventListener("listen", () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
await app.listen({ port: PORT });

// Close database connections when application shuts down
Deno.addSignalListener("SIGINT", async () => {
  console.log("Shutting down database connections...");
  await db.close();
  console.log("Database connections closed");
  Deno.exit();
});
