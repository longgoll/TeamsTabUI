import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base: "/",
  esbuild: {
    tsconfigRaw: fs.readFileSync("./tsconfig.app.json"),
  },
});
