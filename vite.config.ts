import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nitro } from "nitro/vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    tsConfigPaths(),
    tanstackStart({
      server: {
        entry: "server",
      },
    }),
    viteReact(),
    tailwindcss(),
    nitro({ preset: "cloudflare-pages" }),
  ],
});
