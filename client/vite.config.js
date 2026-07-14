import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

// openscaffold-core is optional: use the real ecosystem package when the
// sibling directory exists (local Open Scaffold installs), otherwise fall
// back to bundled stubs so standalone/cloud builds work.
const corePath = path.resolve(__dirname, '../../openscaffold-core')
const coreAvailable = fs.existsSync(corePath)
const coreAlias = coreAvailable ? corePath : path.resolve(__dirname, 'src/stubs/openscaffold-core')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@openscaffold/core': coreAlias
    }
  },
  server: {
    port: 5180,
    fs: {
      allow: coreAvailable ? ['.', corePath] : ['.']
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3012',
        changeOrigin: true
      }
    }
  }
})
