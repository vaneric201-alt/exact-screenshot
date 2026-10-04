import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { writeFileSync, mkdirSync } from "node:fs";

/**
 * Dev-only helper: POST a data URL to /__shot?name=x and it is saved as
 * .shots/x.jpg, so rendered WebGL frames can be inspected outside the browser.
 */
function shots(): Plugin {
  return {
    name: "dev-shots",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__shot", (req, res) => {
        const url = new URL(req.url ?? "", "http://x");
        const name = (url.searchParams.get("name") ?? "shot").replace(/[^\w.-]/g, "_");
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          const b64 = body.replace(/^data:image\/\w+;base64,/, "");
          mkdirSync(".shots", { recursive: true });
          writeFileSync(`.shots/${name}.jpg`, Buffer.from(b64, "base64"));
          res.end("ok");
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), shots()],
});
