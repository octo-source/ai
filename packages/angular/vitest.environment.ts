import { builtinEnvironments, type Environment } from 'vitest/environments';

export default {
  name: 'jsdom-node-fetch',
  transformMode: 'web',
  async setup(global, options) {
    const { AbortController, AbortSignal } = global;
    const environment = await builtinEnvironments.jsdom.setup(global, options);

    // jsdom supplies the DOM, but fetch and Request come from Node. Keep their
    // matching abort primitives so request cancellation uses the same realm.
    Object.assign(global, { AbortController, AbortSignal });

    return environment;
  },
} satisfies Environment;
