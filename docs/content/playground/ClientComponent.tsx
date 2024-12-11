import Spinner from '@deities/ui/Spinner.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { ReactElement, Suspense, useEffect, useState } from 'react';

export default function ClientComponent({
  module: Module,
}: {
  module: () => ReactElement;
}) {
  const [element, setElement] = useState<ReactElement | null>(null);

  useEffect(() => {
    import('./ClientScope.tsx').then(({ default: ClientScope }) =>
      setElement(
        <ClientScope>
          <Suspense
            fallback={
              <Stack center>
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
