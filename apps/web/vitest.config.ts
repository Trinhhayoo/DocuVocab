import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Playwright runs e2e/ against a built app; Vitest covers unit specs only.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
