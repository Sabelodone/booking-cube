import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'app/src')
    }
  },
  css: {
    postcss: './postcss.config.js' // or './postcss.config.cjs'
  }
})