import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'promo-root-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '') {
            req.url = '/promo.html';
          }
          next();
        });
      },
    },
  ],
  base: '/',
  server: {
    port: 5174,
    open: false,
  },
  build: {
    outDir: 'dist-promo',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        promo: path.resolve(__dirname, 'promo.html'),
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
        },
      },
    },
  },
  preview: {
    port: 4174,
  },
});
