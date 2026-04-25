import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    },
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './plataforma-virtual-local.duckdns.org+2-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './plataforma-virtual-local.duckdns.org+2.pem')),
    },
  }
})
