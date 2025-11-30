import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@/_core': path.resolve(__dirname, '_core'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
