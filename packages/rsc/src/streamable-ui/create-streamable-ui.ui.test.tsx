import { delay } from '@ai-sdk/provider-utils';
import { renderToStaticMarkup } from 'react-dom/server';
import { createStreamableUI } from './create-streamable-ui';

async function recursiveResolve(val: any): Promise<any> {
  if (val && typeof val === 'object' && typeof val.then === 'function') {
    return await recursiveResolve(await val);
  }

  if (Array.isArray(val)) {
    return await Promise.all(val.map(recursiveResolve));
  }

  if (val && typeof val === 'object') {
    const result: any = {};
    for (const key in val) {
      result[key] = await recursiveResolve(val[key]);
    }
    return result;
  }

  return val;
}

async function simulateFlightServerRender(node: React.ReactNode) {
  async function traverse(node: any): Promise<any> {
    if (!node) return {};

    // Let's only do one level of promise resolution here. As it's only for testing purposes.
    const props = await recursiveResolve({ ...node.props });

    const { type } = node;
    const { children, ...otherProps } = props;
    const typeName = typeof type === 'function' ? type.name : String(type);

    return {
      type: typeName,
      props: otherProps,
      children:
        typeof children === 'string'
          ? children
          : Array.isArray(children)
            ? children.map(traverse)
            : await traverse(children),
    };
  }

  return traverse(node);
}

function getFinalValueFromResolved(node: any) {
  if (!node) return node;
  if (node.type === 'Symbol(react.suspense)') {
    return getFinalValueFromResolved(node.children);
  } else if (node.type === '') {
    let wrapper;
    let value = node.props.value;
    let next = node.props.n;
    let current = node.props.c;

    while (next) {
      if (next.append) {
        if (wrapper === undefined) {
          wrapper = current;
        } else if (typeof current === 'string' && typeof wrapper === 'string') {
          wrapper = wrapper + current;
        } else {
          wrapper = (
            <>
              {wrapper}
              {current}
            </>
          );
        }
      }

      value = next.value;
      next = next.next;
      current = value;
    }

    return getFinalValueFromResolved(
      wrapper === undefined ? (
        value
      ) : typeof value === 'string' && typeof wrapper === 'string' ? (
        wrapper + value
      ) : (
        <>
          {wrapper}
          {value}
        </>
      ),
    );
  }
  return node;
}

describe('rsc - createStreamableUI()', () => {
  it('should emit React Nodes that can be updated', async () => {
    const ui = createStreamableUI(<div>1</div>);
    ui.update(<div>2</div>);
    ui.update(<div>3</div>);
    ui.done();

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(renderToStaticMarkup(final)).toBe('<div>3</div>');
  });

  it('should emit React Nodes that can be updated with .done()', async () => {
    const ui = createStreamableUI(<div>1</div>);
    ui.update(<div>2</div>);
    ui.update(<div>3</div>);
    ui.done(<div>4</div>);

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(renderToStaticMarkup(final)).toBe('<div>4</div>');
  });

  it('should support .append()', async () => {
    const ui = createStreamableUI(<div>1</div>);
    ui.update(<div>2</div>);
    ui.append(<div>3</div>);
    ui.append(<div>4</div>);
    ui.done();

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(renderToStaticMarkup(final)).toBe(
      '<div>2</div><div>3</div><div>4</div>',
    );
  });

  it('should support streaming .append() result before .done()', async () => {
    const ui = createStreamableUI(<div>1</div>);
    ui.append(<div>2</div>);
    ui.append(<div>3</div>);

    const currentResolved = (ui.value as React.ReactElement).props.children
      .props.n;
    const tryResolve1 = await Promise.race([currentResolved, delay()]);
    expect(tryResolve1).toBeDefined();
    const tryResolve2 = await Promise.race([tryResolve1.next, delay()]);
    expect(tryResolve2).toBeDefined();
    expect(
      renderToStaticMarkup(getFinalValueFromResolved(tryResolve2.value)),
    ).toBe('<div>3</div>');

    ui.append(<div>4</div>);
    ui.done();

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(renderToStaticMarkup(final)).toBe(
      '<div>1</div><div>2</div><div>3</div><div>4</div>',
    );
  });

  it('should support updating the appended ui', async () => {
    const ui = createStreamableUI(<div>1</div>);
    ui.update(<div>2</div>);
    ui.append(<div>3</div>);
    ui.done(<div>4</div>);

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(renderToStaticMarkup(final)).toBe('<div>2</div><div>4</div>');
  });

  it('should re-use the text node when appending strings', async () => {
    const ui = createStreamableUI('hello');
    ui.append(' world');
    ui.append('!');
    ui.done();

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(final).toMatchInlineSnapshot('"hello world!"');
  });

  it('should send minimal incremental diffs when appending strings', async () => {
    const ui = createStreamableUI('hello');
    ui.append(' world');
    ui.append(' and');
    ui.append(' universe');
    ui.done();

    const final = getFinalValueFromResolved(
      await simulateFlightServerRender(ui.value),
    );
    expect(final).toStrictEqual('hello world and universe');
  });

  it('should error when updating a closed streamable', async () => {
    const ui = createStreamableUI(<div>1</div>);
    ui.done(<div>2</div>);

    expect(() => {
      ui.update(<div>3</div>);
    }).toThrowErrorMatchingInlineSnapshot(
      '[Error: .update(): UI stream is already closed.]',
    );
  });
});
