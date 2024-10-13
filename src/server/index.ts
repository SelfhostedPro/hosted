import { Elysia } from "elysia";

export const api = new Elysia({ prefix: "/api", name: "api" })
  .get("/", () => "Hello Elysia")
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${api.server?.hostname}:${api.server?.port}/api`
);
