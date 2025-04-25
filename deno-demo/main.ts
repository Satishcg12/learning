// server.ts

import { Application } from "@oak/oak";
import router from "./src/routes/routes.ts";

const app = new Application();

app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8000 });
