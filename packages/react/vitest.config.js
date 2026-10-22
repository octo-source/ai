import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: './vitest.environment.js',
    globals: true,
    include: ['src/**/*.ui.test.ts', 'src/**/*.ui.test.tsx'],
  },
});
