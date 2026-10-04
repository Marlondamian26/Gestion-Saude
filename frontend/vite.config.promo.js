import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'promo-root-files',
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist-promo');
        const promoHtml = path.resolve(outDir, 'promo.html');
        if (existsSync(promoHtml)) {
          copyFileSync(promoHtml, path.resolve(outDir, 'index.html'));
          copyFileSync(promoHtml, path.resolve(outDir, '404.html'));
          console.log('Created index.html and 404.html as fallbacks for SPA routing');
        }
      },
    },
    {
      name: 'promo-root-redirect',
      configureServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url === '/' || req.url === '') {
            req.url = '/promo.html';
          }
          next();
        });
      },
    },
  ],
  publicDir: 'public-promo',
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
