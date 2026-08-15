import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Single source of truth for the build number teachers can read off the
  // empty state — package.json, not a second hardcoded string.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
