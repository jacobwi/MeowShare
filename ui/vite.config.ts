import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // Load env from the UI directory (default)
  const env = loadEnv(mode, ".", "");

  // Also load env from parent directory
  const rootEnv = loadEnv(mode, "..", "");

  // Merge the environments, giving preference to UI directory vars
  const mergedEnv = { ...rootEnv, ...env };

  const useProxy = mergedEnv.USE_API_PROXY === "true";

  return {
    plugins: [react()],
    server: {
      proxy: useProxy
        ? {
            "/api": {
              target: env.API_TARGET || "https://backend:8080",
              changeOrigin: true,
              secure: false,
              configure: (proxy) => {
                proxy.on("error", (err) => {
                  console.log("proxy error", err);
                });
                proxy.on("proxyReq", (_, req) => {
                  console.log(
                    "Sending Request to the Target:",
                    req.method,
                    req.url,
                  );
                });
                proxy.on("proxyRes", (proxyRes, req) => {
                  console.log(
                    "Received Response from the Target:",
                    proxyRes.statusCode,
                    req.url,
                  );
                });
              },
            },
          }
        : undefined,
    },
    define: {
      // API Configuration
      "import.meta.env.VITE_API_URL": JSON.stringify(mergedEnv.VITE_API_URL),

      // Application Settings
      "import.meta.env.VITE_APP_NAME": JSON.stringify(mergedEnv.VITE_APP_NAME),

      // Demo Mode
      "import.meta.env.VITE_DEMO_MODE": JSON.stringify(
        mergedEnv.VITE_DEMO_MODE || mergedEnv.DEMO_MODE,
      ),

      // Admin Credentials - Use demo credentials if in demo mode
      "import.meta.env.VITE_ADMIN_EMAIL": JSON.stringify(
        mergedEnv.VITE_ADMIN_EMAIL ||
          mergedEnv.ADMIN_EMAIL ||
          (mergedEnv.VITE_DEMO_MODE === "true" || mergedEnv.DEMO_MODE === "true"
            ? "admin@example.com"
            : "admin@meow.local"),
      ),
      "import.meta.env.VITE_ADMIN_PASSWORD": JSON.stringify(
        mergedEnv.VITE_ADMIN_PASSWORD ||
          mergedEnv.ADMIN_PASSWORD ||
          (mergedEnv.VITE_DEMO_MODE === "true" || mergedEnv.DEMO_MODE === "true"
            ? "Admin123!"
            : "eMef7eI@qeDCFS4)"),
      ),

      // File Sizes
      "import.meta.env.VITE_MAX_FILE_SIZE": JSON.stringify(
        mergedEnv.VITE_MAX_FILE_SIZE || "104857600",
      ),
      "import.meta.env.VITE_CHUNK_SIZE": JSON.stringify(
        mergedEnv.VITE_CHUNK_SIZE || "5242880",
      ),
    },
  };
});
