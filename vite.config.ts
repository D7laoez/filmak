import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  environments: {
    client: {
      build: {
        rolldownOptions: {
          output: {
            strictExecutionOrder: true,
            codeSplitting: {
              groups: [
                {
                  name: "react-vendor",
                  test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
                  priority: 30,
                },
                {
                  name: "tanstack-vendor",
                  test: /node_modules[\\/]@tanstack[\\/](?!react-start[\\/]dist[\\/]plugin[\\/]default-entry[\\/]client)/,
                  minSize: 20_000,
                  priority: 25,
                },
                {
                  name: "supabase-vendor",
                  test: /node_modules[\\/]@supabase[\\/]/,
                  minSize: 20_000,
                  priority: 25,
                },
                {
                  name: "radix-vendor",
                  test: /node_modules[\\/]@radix-ui[\\/]/,
                  minSize: 30_000,
                  priority: 20,
                },
                {
                  name: "ai-vendor",
                  test: /node_modules[\\/](ai|@ai-sdk)[\\/]/,
                  minSize: 20_000,
                  priority: 20,
                },
                {
                  name: "charts-vendor",
                  test: /node_modules[\\/]recharts[\\/]/,
                  minSize: 20_000,
                  priority: 20,
                },
                {
                  name: "vendor-rest",
                  test: /node_modules[\\/](?!@tanstack[\\/]react-start[\\/]dist[\\/]plugin[\\/]default-entry[\\/]client)/,
                  minSize: 50_000,
                  maxSize: 220_000,
                  priority: 1,
                },
              ],
            },
          },
        },
      },
    },
  },
});
