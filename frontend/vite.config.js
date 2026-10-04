import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve, dirname } from 'path'
import { copyFileSync, existsSync, mkdirSync, cpSync } from 'fs'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

function redirectPlugin() {
  return {
    name: 'redirect-plugin',
    closeBundle() {
      const sitioDir = resolve(__dirname, '..', 'backend', 'sitio')
      if (!existsSync(sitioDir)) {
        mkdirSync(sitioDir, { recursive: true })
      }
      const srcDist = resolve(__dirname, 'dist')
      if (existsSync(srcDist)) {
        cpSync(srcDist, sitioDir, { recursive: true })
      }
      const redirectFile = resolve(sitioDir, '_redirects')
      if (!existsSync(redirectFile)) {
        const srcRedirects = resolve(__dirname, 'public', '_redirects')
        if (existsSync(srcRedirects)) {
          copyFileSync(srcRedirects, redirectFile)
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
    /*, redirectPlugin()*/
  ],
  base: '/',
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-forms': ['react-hook-form'],
          'vendor-util': ['date-fns', 'jwt-decode', 'axios'],
        },
      },
    },
  },
  preview: {
    port: 4173,
  },
})
