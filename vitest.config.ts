import { defineConfig } from 'vitest/config';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // maxThreads: 1,
    // minThreads: 1,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/frontend/src'),
    },
  },
});
