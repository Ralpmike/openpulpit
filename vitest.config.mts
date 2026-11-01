import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\//, replacement: `${src}/` },
      // `server-only` throws outside React Server Components; tests import server code directly.
      { find: "server-only", replacement: fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)) },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./src/test/setup.ts"],
    restoreMocks: true,
    // Component tests opt into jsdom with `// @vitest-environment jsdom` at the top of the file.
  },
});
