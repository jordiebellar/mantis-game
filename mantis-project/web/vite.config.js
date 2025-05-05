import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './', // <-- This is the key fix
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
})
