import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Capacitor가 빌드 결과물을 읽어가는 폴더는 dist 입니다.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  server: {
    port: 5173,
    host: true,
  },
});
