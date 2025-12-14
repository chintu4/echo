import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    // The auth flow test exercises real DB + bcrypt + crypto; 5s is too tight on
    // slower Windows setups. Keep it bounded but practical.
    testTimeout: 15_000,
  },
});
