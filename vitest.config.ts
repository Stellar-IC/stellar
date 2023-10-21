import { defineConfig } from 'vitest/config';

import dotenv from 'dotenv';
dotenv.config();

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    // maxThreads: 1,
    // minThreads: 1,
  },
});
