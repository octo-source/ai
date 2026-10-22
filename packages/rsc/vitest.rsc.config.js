import { defineConfig } from 'vite';

// Run through test:rsc so Node loads React's supported react-server entry point.
// Production serialization excludes development-only stack/timing records.
export default defineConfig({
  esbuild: { jsx: 'automatic', jsxDev: false },
  resolve: { conditions: ['react-server'] },
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.rsc.test.ts', 'src/**/*.rsc.test.tsx'],
    pool: 'forks',
    maxWorkers: 2,
    minWorkers: 1,
  },
});
