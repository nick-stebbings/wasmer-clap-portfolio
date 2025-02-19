import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    headers: {
      'Cross-Origin-Embedder-Policy': 'cross-site',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Resource-Policy': 'cross-origin'
    },

    host: '0.0.0.0',
    port: 5175,
    cors: {
        origin: 'http://localhost',
        credentials: true,
    },
    hmr: {
        host: 'localhost',
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: './index.html',
      },
      output: {
        entryFileNames: 'assets/[name].mjs',
        chunkFileNames: 'assets/[name].mjs',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
    manifest: true,
  },
  optimizeDeps: {
    exclude: ['@wasmer/sdk']
  },
  assetsInclude: ['**/*.wasm'],
})
