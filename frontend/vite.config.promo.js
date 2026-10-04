import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { writeFileSync, existsSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'promo-redirects',
      closeBundle() {
        if (existsSync(path.resolve(__dirname, 'dist-promo'))) {
          writeFileSync(
            path.resolve(__dirname, 'dist-promo', '_redirects'),
            '/* /promo.html 200\n',
          );
        }
      },
    },
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
        manualChunks(id) {
          if (id.includes('node_modules/react') && !id.includes('react-router')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
        },
      },
    },
  },
  preview: {
    port: 4174,
  },
});
