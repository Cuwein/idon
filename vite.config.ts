import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [".csb.app"],
    host: true,
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
  },
  // For SPA routing on Netlify
  base: "./",
});
