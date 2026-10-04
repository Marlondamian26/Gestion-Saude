import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: [
        '**/*.test.*',
        '**/*.spec.*',
        '**/node_modules/**',
        'main.jsx',
        'src/test/**',
        'src/context/LanguageContext.jsx',
      ],
    },
    mockReset: true,
  },
}));
