import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  plugins: [
    {
      name: "filmak-bundle-diagnostics",
      apply: "build",
      generateBundle(_options, bundle) {
        for (const [fileName, output] of Object.entries(bundle)) {
          if (output.type !== "chunk" || !fileName.includes("index-")) continue;
          const largestModules = Object.entries(output.modules)
            .sort((a, b) => b[1].renderedLength - a[1].renderedLength)
            .slice(0, 18)
            .map(([id, module]) => ({
              id: id.replaceAll("\\", "/").split("/node_modules/").pop() ?? id,
              bytes: module.renderedLength,
            }));
          console.info(
            "[filmak-bundle-diagnostics]",
            JSON.stringify({ fileName, bytes: output.code.length, largestModules }),
          );
        }
      },
    },
  ],
  tanstackStart: {
    server: { entry: "server" },
  },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          output: {
            strictExecutionOrder: true,
            manualChunks(id) {
              const moduleId = id.replaceAll("\\", "/");
              if (
                !moduleId.includes("/node_modules/") ||
                moduleId.includes(
                  "/node_modules/@tanstack/react-start/dist/plugin/default-entry/client",
                )
              ) {
                return;
              }

              if (/\/node_modules\/(react|react-dom|scheduler)\//.test(moduleId)) {
                return "react-vendor";
              }
              if (/\/node_modules\/@tanstack\//.test(moduleId)) {
                return "tanstack-vendor";
              }
              if (/\/node_modules\/@supabase\//.test(moduleId)) {
                return "supabase-vendor";
              }
              if (/\/node_modules\/@radix-ui\//.test(moduleId)) {
                return "radix-vendor";
              }
              if (/\/node_modules\/(ai|@ai-sdk)\//.test(moduleId)) {
                return "ai-vendor";
              }
              if (/\/node_modules\/recharts\//.test(moduleId)) {
                return "charts-vendor";
              }
              return "vendor";
            },
          },
        },
      },
    },
  },
});
