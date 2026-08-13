import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Load .env.local for integration tests that need DB credentials
    env: (() => {
      const result: Record<string, string> = {};
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const dotenv = require('dotenv');
        const parsed = dotenv.config({ path: path.resolve(process.cwd(), '.env.local') }).parsed ?? {};
        Object.assign(result, parsed);
      } catch { /* no .env.local — unit tests only */ }
      return result;
    })(),
    // Longer timeout for DB integration tests
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
