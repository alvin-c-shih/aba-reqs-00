import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Dev: the web app proxies /api to the API, so the browser sees one origin (cookies stay SameSite=Strict).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { "/api": "http://127.0.0.1:8010" } },
});
