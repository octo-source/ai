import { builtinEnvironments } from 'vitest/environments';
import { createJsdomNodeFetchEnvironment } from '../../tools/test/jsdom-node-fetch-environment.js';

export default createJsdomNodeFetchEnvironment(builtinEnvironments.jsdom);
