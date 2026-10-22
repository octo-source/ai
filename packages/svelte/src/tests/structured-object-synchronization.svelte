<script lang="ts" generics="SCHEMA extends FlexibleSchema<unknown>">
  import type { FlexibleSchema } from '@ai-sdk/provider-utils';
  import { createAIContext } from '../context-provider.js';
  import {
    StructuredObject,
    type Experimental_StructuredObjectOptions,
  } from '../structured-object.svelte.js';

  let {
    id,
    api,
    schema,
  }: Pick<
    Experimental_StructuredObjectOptions<SCHEMA>,
    'id' | 'api' | 'schema'
  > = $props();

  createAIContext();
  const object1 = new StructuredObject({ id, api, schema });
  const object2 = new StructuredObject({ id, api, schema });

  export { object1, object2 };
</script>
