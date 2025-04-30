import { Context } from "https://deno.land/x/oak@v12.6.1/mod.ts";

export async function errorHandler(ctx: Context, next: () => Promise<void>) {
  try {
    await next();
  } catch (err) {
    console.error("Error:", err);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal Server Error" };
    ctx.response.headers.set("Content-Type", "application/json");
  }
}
