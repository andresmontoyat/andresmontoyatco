import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    react({
      include: '**/*.{jsx,js}',
    }),
    visualizer({
      filename: 'dist/stats.html',
      template: 'treemap',
      emitFile: false,
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    exclude: [],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
