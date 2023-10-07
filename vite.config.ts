import { defineConfig } from 'vite';
import { fileURLToPath, URL } from 'url';

import * as path from 'path';
import * as dotenv from 'dotenv';
import react from '@vitejs/plugin-react-swc';
const network = process.env.DFX_NETWORK || (process.env.NODE_ENV === 'production' ? 'ic' : 'local');

dotenv.config();

function initCanisterEnv() {
  const canisterEnvVars = Object.entries(process.env).filter(([key, value]) =>
    key.includes('CANISTER_ID')
  );

  const canisterEnv = {};

  for (const envVar of canisterEnvVars) {
    canisterEnv[`process.env.${envVar[0]}`] = `"${envVar[1]}"`;
  }

  return canisterEnv;
}

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    ...initCanisterEnv(),
    'process.env.DFX_NETWORK': `"${process.env.DFX_NETWORK}"`,
    'process.env.DFX_VERSION': `"${process.env.DFX_VERSION}"`,
  },
  plugins: [react()],
  build: {
    outDir: './src/frontend/dist',
  },
  resolve: {
    alias: [
      { find: '@/', replacement: fileURLToPath(new URL('./src/frontend/src/', import.meta.url)) },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:4943',
        changeOrigin: true,
      },
    },
  },
});
