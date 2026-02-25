import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          tensorflow: ["@tensorflow/tfjs"],
          recharts: ["recharts"],
          mui: ["@mui/material", "@mui/icons-material"],
          muiDataGrid: ["@mui/x-data-grid"],
        },
      },
    },
  },
});
