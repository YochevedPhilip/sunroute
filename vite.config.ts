import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" lets the app work from any folder (GitHub Pages sub-path included).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
