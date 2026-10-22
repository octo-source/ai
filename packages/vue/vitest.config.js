import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: './vitest.environment.js',
    globals: true,
    include: ['src/**/*.ui.test.ts', 'src/**/*.ui.test.tsx'],
  },
});
