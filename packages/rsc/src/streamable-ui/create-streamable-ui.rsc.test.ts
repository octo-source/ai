import { createElement, type ReactNode } from 'react';
import { createStreamableUI } from './create-streamable-ui';

async function flightRender(node: ReactNode) {
  const {
    renderToReadableStream,
  } = require('react-server-dom-webpack/server.edge');
  const stream = renderToReadableStream(node);
  const response = await new Response(stream).text();

  // Assert serialized model behavior instead of implementation-specific chunk IDs.
  return response
    .split('\n')
    .map(line => line.slice(line.indexOf(':') + 1))
    .filter(payload => /^[\[{"]/.test(payload))
    .join('\n');
}

describe('createStreamableUI with the supported React server renderer', () => {
  it('sends bounded text segments instead of repeating accumulated prefixes', async () => {
    const ui = createStreamableUI('hello');
    ui.append(' world');
    ui.append(' and');
    ui.append(' universe');
    ui.done();

    const model = await flightRender(ui.value);
    for (const segment of ['hello', ' world', ' and', ' universe']) {
      // Each segment is sent as a fallback and once as completed content.
      expect(model.split(JSON.stringify(segment))).toHaveLength(3);
    }
    expect(model).not.toContain('hello world');
    expect(model).not.toContain('world and');
  });

  it('deduplicates repeated updates using the same React node', async () => {
    const node = createElement('div', null, '1');
    const ui = createStreamableUI(node);
    for (let i = 0; i < 6; i++) ui.update(node);
    ui.done();

    const model = await flightRender(ui.value);
    expect(model.split('"children":"1"')).toHaveLength(2);
  });

  it('returns itself and serializes each update followed by the final node', async () => {
    const ui = createStreamableUI(createElement('div', null, '1'));
    expect(
      ui
        .update(createElement('div', null, '2'))
        .update(createElement('div', null, '3'))
        .done(createElement('div', null, '4')),
    ).toBe(ui);

    const model = await flightRender(ui.value);
    for (const value of ['1', '2', '3', '4']) {
      expect(model.split(`"children":"${value}"`)).toHaveLength(2);
    }
  });
});
