import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [tailwindcss(), react()],
    base: "/",
    esbuild: {
      tsconfigRaw: fs.readFileSync("./tsconfig.app.json"),
    },
    define: {
      'process.env.TENANT_ID': JSON.stringify(env.TENANT_ID),
      'process.env.CLIENT_ID': JSON.stringify(env.CLIENT_ID),
      'process.env.CLIENT_SECRET': JSON.stringify(env.CLIENT_SECRET)
    }
  };
});
