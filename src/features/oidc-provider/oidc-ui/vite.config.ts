import legacy from '@vitejs/plugin-legacy'
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: __dirname,
  base: '/oidc/',
  plugins: [
    legacy({
      // Match (or better) the previous browser support:
      // - IE11 (`Trident/7.0; rv:11.0`)
      // - Old WebView on Chrome 70
      targets: ['defaults', 'ie >= 11', 'Chrome >= 70'],
      additionalLegacyPolyfills: ['whatwg-fetch'],
      renderLegacyChunks: false,
      modernPolyfills: true,
    }),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        login: resolve(__dirname, 'login.html'),
      },
    },
  },
})
