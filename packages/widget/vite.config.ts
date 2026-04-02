import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    lib: {
      entry: "src/index.ts",
      name: "OpenHelpdesk",
      formats: ["iife"],
      fileName: () => "open-helpdesk.js",
    },
    outDir: "dist",
    minify: "esbuild",
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
});
