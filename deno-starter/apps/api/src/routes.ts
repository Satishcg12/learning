import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import todoRouter from '@api/todo/todo.routes.ts';

const apiRouter = new Router({ prefix: '/api' });

apiRouter
  .use(todoRouter.routes(), todoRouter.allowedMethods());

export default apiRouter;
