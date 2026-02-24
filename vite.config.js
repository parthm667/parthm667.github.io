import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// base: '/' works for username.github.io repos (root domain)
export default defineConfig({
  plugins: [react()],
  base: '/',
})
