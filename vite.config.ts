import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // VITE_DEMO_MODE=true swaps the Supabase client for an offline in-memory
  // backend (src/integrations/supabase/demo-client.ts).
  const demo = env.VITE_DEMO_MODE === "true";

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: [
        ...(demo
          ? [
              {
                find: /^@\/integrations\/supabase\/client$/,
                replacement: path.resolve(__dirname, "./src/integrations/supabase/demo-client.ts"),
              },
            ]
          : []),
        { find: "@", replacement: path.resolve(__dirname, "./src") },
      ],
      dedupe: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
    },
    optimizeDeps: {
      include: ["react", "react-dom", "react-router-dom", "@tanstack/react-query"],
    },
  };
});
