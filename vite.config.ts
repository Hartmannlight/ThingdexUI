import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_UPSTREAM || env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  const labelUpstream = env.VITE_LABEL_SERVICE_UPSTREAM || "http://label.xn--jahnstrae-n1a.de/api/v1";
  const printerUpstream = env.VITE_PRINTER_HUB_UPSTREAM || "http://printhub.xn--jahnstrae-n1a.de/v1";

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
      }
    },
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": {
          target: apiTarget,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, "")
        },
        "/ext/label": {
          target: labelUpstream,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ext\/label/, "")
        },
        "/ext/printhub": {
          target: printerUpstream,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/ext\/printhub/, "")
        }
      }
    }
  };
});
