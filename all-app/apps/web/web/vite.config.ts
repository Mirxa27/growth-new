import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Proxy API requests to the server during development
const serverProxy = {
  '/api': {
    target: 'http://localhost:4000',
    changeOrigin: true,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: serverProxy,
  },
})
