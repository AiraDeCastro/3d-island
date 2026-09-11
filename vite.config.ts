/// <reference types="vitest/config" />
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    // three.js + its postprocessing/loader addons make up most of this;
    // real code-splitting (e.g. lazy-loading SSAOPass only on the high
    // quality tier) is tracked in TASKS.md under Milestone 3's profiling
    // pass rather than guessed at here.
    chunkSizeWarningLimit: 800,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
