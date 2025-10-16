import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ❌ MAKNI OVO: import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    // ❌ MAKNI OVO: tailwindcss()
  ],
})
