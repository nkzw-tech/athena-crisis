import { Fragment, useMemo } from 'react';
import { hasGamePad } from './controls/setupGamePad.tsx';
import { useInlineLink } from './InlineLink.tsx';

const reload = () => location.reload();

export default function Reload() {
  const linkProps = useInlineLink();

  return (
    <Fragment>
      {useMemo(hasGamePad, []) ? (
        <fbt desc="Reload description">
          Press A, B, L1 and R1 to reload the game.
        </fbt>
      ) : (
        <fbt desc="Reload description">
          Tap here to{' '}
          <a onClick={reload} {...linkProps}>
            reload the game
          </a>.
        </fbt>
      )}
    </Fragment>
  );
}
