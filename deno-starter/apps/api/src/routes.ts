import { Router } from 'https://deno.land/x/oak@v12.6.1/mod.ts';
import todoRouter from '@api/todo/todo.routes.ts';
import userRouter from '@api/user/user.routes.ts';
import authRouter from '@api/auth/auth.routes.ts';

const apiRouter = new Router({ prefix: '/api' });

apiRouter
  .use(todoRouter.routes(), todoRouter.allowedMethods())
  .use(userRouter.routes(), userRouter.allowedMethods())
  .use(authRouter.routes(), authRouter.allowedMethods());

export default apiRouter;
