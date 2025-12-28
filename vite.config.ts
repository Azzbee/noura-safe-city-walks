import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";
import { componentTagger } from "lovable-tagger";

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Force a single React instance across the entire bundle (prevents dispatcher=null hook crashes).
  const reactPath = require.resolve("react");
  const reactDomPath = require.resolve("react-dom");
  const reactDomClientPath = require.resolve("react-dom/client");
  const reactJsxRuntimePath = require.resolve("react/jsx-runtime");
  const reactJsxDevRuntimePath = require.resolve("react/jsx-dev-runtime");
  const schedulerPath = require.resolve("scheduler");

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        react: reactPath,
        "react-dom": reactDomPath,
        "react-dom/client": reactDomClientPath,
        "react/jsx-runtime": reactJsxRuntimePath,
        "react/jsx-dev-runtime": reactJsxDevRuntimePath,
        scheduler: schedulerPath,
      },
      dedupe: [
        "react",
        "react-dom",
        "react-dom/client",
        "react-router",
        "react-router-dom",
        "@tanstack/react-query",
        "scheduler",
      ],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
    },
  };
});
