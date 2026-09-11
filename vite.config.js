import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // single-origin dev: Express serves Vite middleware on 3001, no proxy needed
  server: { middlewareMode: false }
})
