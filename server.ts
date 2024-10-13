import { Elysia } from "elysia";
import { vite } from "elysia-vite-server";
import { api } from "./src/server";
const isProduction = process.env.NODE_ENV === "production";
// Cached production assets
const templateHtml = isProduction ? await Bun.file("./index.html").text() : "";
const ssrManifest = isProduction
    ? await Bun.file("./index.html").text()
    : undefined;

new Elysia()
    .use(
        vite({
            static: {
                assets: "./dist/client",
                alwaysStatic: false,
                noCache: true,
            },
        })
    )
    .use(api)
    // .all("/api/*", api)
    .all("*", async ({ vite, request, set }) => {
        try {
            let template: string | undefined;
            let render: any;
            if (vite) {
                // Always read fresh template in development
                template = await Bun.file("./index.html").text();

                template = await vite.transformIndexHtml(request.url, template);
                render = (await vite.ssrLoadModule("/src/entry-server.ts"))
                    .render;
            } else {
                template = templateHtml;
                render = (await import("./dist/server/entry-server.js")).render;
            }

            const rendered = await render(request.url, ssrManifest);

            const html = template
                .replace("<!--app-head-->", rendered.head ?? "")
                .replace("<!--app-html-->", rendered.html ?? "");

            return new Response(html, {
                headers: {
                    "Content-Type": "text/html",
                },
            });
        } catch (e) {
            if (e instanceof Error) {
                vite?.ssrFixStacktrace(e);
                console.log(e.stack);
                set.status = 500;

                return e.stack;
            } else console.log(e);
        }
    })
    .use(api)
    .listen(3000, console.log);