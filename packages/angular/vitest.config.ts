import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: './vitest.environment.ts',
    include: ['src/lib/**/*.test.ts'],
  },
});
