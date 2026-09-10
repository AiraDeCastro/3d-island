/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // three.js alone is ~500kB minified; the default 500kB warning fires on
    // every build until there's enough app code to justify code-splitting.
    chunkSizeWarningLimit: 700,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
