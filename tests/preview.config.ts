import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      {
        find: "@/lib/supabase",
        replacement: path.resolve("tests/fixtures/supabase.ts"),
      },
      { find: "@", replacement: path.resolve("src") },
      {
        find: "virtual:pwa-register",
        replacement: path.resolve("tests/fixtures/pwa.ts"),
      },
    ],
  },
  server: { host: "127.0.0.1", port: 5174 },
});
