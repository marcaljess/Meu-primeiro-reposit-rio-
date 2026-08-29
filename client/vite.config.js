import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const PORTA_API = process.env.PORT || 3001;

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: `http://localhost:${PORTA_API}`,
        changeOrigin: true,
      },
    },
  },
});
