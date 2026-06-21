import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5174,
    hmr: {
      overlay: false,
    },
    proxy: {
      '/rapidapi': {
        target: 'https://instagram120.p.rapidapi.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rapidapi/, ''),
      },
      '/ig-image': {
        target: 'https://instagram.fbdo9-1.fna.fbcdn.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/ig-image/, ''),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
