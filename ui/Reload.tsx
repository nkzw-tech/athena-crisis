import { css, cx } from '@emotion/css';
import { Fragment, useMemo } from 'react';
import { hasGamepad } from './controls/setupGamePad.tsx';
import { useInlineLink } from './InlineLink.tsx';

const _reload = () => location.reload();

export default function Reload({ reload = _reload }: { reload?: () => void }) {
  const { className, ...linkProps } = useInlineLink();

  return (
    <Fragment>
      {useMemo(hasGamepad, []) ? (
        <fbt desc="Reload description">
          Press A, B, L1 and R1 to reload the game.
        </fbt>
      ) : (
        <fbt desc="Reload description">
          Tap here to{' '}
          <a
            className={cx(className, inlineDisplayStyle)}
            onClick={reload}
            {...linkProps}
          >
            reload the game
          </a>.
        </fbt>
      )}
    </Fragment>
  );
}

const inlineDisplayStyle = css`
  display: inline;
`;
