import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./test/integration/setup.ts'],
    include: ['test/integration/**/*.integration.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30_000,
    sequence: { concurrent: false }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.')
    }
  }
});
