import { Application } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import apiRouter from '@api/routes.ts';

const app = new Application();

// Middleware
app.use(errorHandler);
app.use(apiRouter.routes());
app.use(apiRouter.allowedMethods());

// Start server
const PORT = Deno.env.get('PORT') || '8000';
console.log(`🚀 Server running on http://localhost:${PORT}`);
await app.listen({ port: Number(PORT) });
