// Each caller supplies its own Vitest/jsdom implementation so packages using
// different test-runner versions keep their existing DOM environment.
export function createJsdomNodeFetchEnvironment(jsdomEnvironment) {
  return {
    name: 'jsdom-node-fetch',
    transformMode: 'web',
    async setup(global, options) {
      const { AbortController, AbortSignal } = global;
      const environment = await jsdomEnvironment.setup(global, options);

      // jsdom supplies the DOM, but fetch and Request come from Node. Keep their
      // matching abort primitives so request cancellation uses the same realm.
      Object.assign(global, { AbortController, AbortSignal });

      return environment;
    },
  };
}
