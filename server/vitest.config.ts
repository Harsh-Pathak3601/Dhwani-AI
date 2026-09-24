import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    hookTimeout: 180000,
    testTimeout: 30000,
    fileParallelism: false,
  },
});
