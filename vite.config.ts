import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          ui: ['lucide-react', 'clsx'],
        },
      },
      external: [
        // Exclude API files from the main build
        /^api\//,
        /^\.\/api\//,
      ],
    },
  },
  // Exclude API directory from build
  publicDir: 'public',
  // Ensure only src directory is processed
  root: '.',
})