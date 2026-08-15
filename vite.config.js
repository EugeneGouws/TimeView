import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Plain fs read, no import attribute and no import.meta: wrangler's autoconfig
// scans this file with esprima, which understands neither.
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Single source of truth for the build number teachers can read off the
  // empty state — package.json, not a second hardcoded string.
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})