import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// In development the API is proxied same-origin (no CORS, cookies just work).
// In production VITE_API_URL points at https://api.verifynumber.in.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/v1': { target: process.env.API_PROXY ?? 'http://127.0.0.1:8080', changeOrigin: true },
    },
  },
})
