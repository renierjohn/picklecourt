import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Only import variables in the Vite config, not global.scss
const scssAdditionalData = `
  @import "./src/styles/variables.scss";
  // Note: global.scss is imported in main.jsx
`;

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: scssAdditionalData
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: 'assets/index.js',
        chunkFileNames: 'assets/index.js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) return 'assets/index.css';
          return 'assets/[name]-[hash][extname]';
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
});
