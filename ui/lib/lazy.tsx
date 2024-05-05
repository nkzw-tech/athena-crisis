import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import dateNow from '@deities/hephaestus/dateNow.tsx';
import { css } from '@emotion/css';
import { AnimatePresence } from 'framer-motion';
// eslint-disable-next-line @deities/no-lazy-import
import { lazy as _lazy, ComponentType } from 'react';
import Box from '../Box.tsx';
import PageTransition from '../PageTransition.tsx';
import Portal from '../Portal.tsx';
import Reload from '../Reload.tsx';
import Stack from '../Stack.tsx';

export default (function lazy(factory) {
  return _lazy(() => factory().catch(importErrorHandler));
} as typeof _lazy);

let hasError = false;
export function importErrorHandler(): { default: ComponentType<unknown> } {
  const time = Number(window.location.hash.match(/#s(\d+)/)?.[1]);
  const now = dateNow();
  const isReloading = !time || time + 10_000 < now;
  if (isReloading) {
    window.location.hash = `#s${now}`;
    window.location.reload();
  }

  const module = {
    default: () => {
      if (hasError) {
        return null;
      }
      hasError = true;
      return (
        <Portal>
          <AnimatePresence>
            <PageTransition delay={isReloading ? 1.5 : 0}>
              <Stack alignCenter center className={containerStyle}>
                <Box alignCenter center className={errorStyle}>
                  <p>
                    <fbt desc="Generic error message">
                      Oops, something went wrong.
                    </fbt>{' '}
                    <Reload />
                  </p>
                </Box>
              </Stack>
            </PageTransition>
          </AnimatePresence>
        </Portal>
      );
    },
  };

  return module;
}

const containerStyle = css`
  min-height: calc(100svh - 2.5 * ${DoubleSize}px);
`;

const errorStyle = css`
  transition: color 1200ms ease;
  width: min(400px, 100%);
`;
