import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  },
  // Ensure assets are properly processed and copied
  build: {
    assetsInlineLimit: 0, // Don't inline SVGs
    assetsDir: 'assets',
    outDir: 'dist',
    // Copy src/assets to dist/src/assets to maintain same paths
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // Keep the original file structure for assets
          if (assetInfo.name.includes('src/assets')) {
            return assetInfo.name;
          }
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  // Make sure the public directory is copied as-is
  publicDir: 'public'
});