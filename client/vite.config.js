import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@openscaffold/core': path.resolve(__dirname, '../../openscaffold-core')
    }
  },
  server: {
    port: 5180,
    fs: {
      allow: [
        '.',
        '../../openscaffold-core'
      ]
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3012',
        changeOrigin: true
      }
    }
  }
})
