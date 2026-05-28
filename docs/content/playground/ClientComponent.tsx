'use client';

import Spinner from '@deities/ui/Spinner.tsx';
import Stack from '@nkzw/stack';
import { lazy, ReactElement, Suspense, useEffect, useState } from 'react';

const modules = {
  entities: lazy(() => import('../examples/entities-example.tsx')),
  mapData: lazy(() => import('../examples/map-data-examples.tsx')),
  mapEditor: lazy(() => import('../examples/map-editor.tsx')),
  playgroundDemoGame: lazy(() => import('./PlaygroundDemoGame.tsx')),
  portraits: lazy(() => import('../examples/portraits-example.tsx')),
};

export default function ClientComponent({ module }: { module: keyof typeof modules }) {
  const [element, setElement] = useState<ReactElement | null>(null);
  const Module = modules[module];

  useEffect(() => {
    import('./ClientScope.tsx').then(({ default: ClientScope }) =>
      setElement(
        <ClientScope>
          <Suspense
            fallback={
              <Stack center wrap>
                <Spinner />
              </Stack>
            }
          >
            <Module />
          </Suspense>
        </ClientScope>,
      ),
    );
  }, [Module]);

  return element;
}
