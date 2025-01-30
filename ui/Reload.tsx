import { useMemo } from 'react';
import { hasGamepad } from './controls/setupGamePad.tsx';
import InlineLink, { useInlineLink } from './InlineLink.tsx';

const _reload = () => location.reload();

export default function Reload({ reload = _reload }: { reload?: () => void }) {
  const { className, ...linkProps } = useInlineLink();

  return (
    <>
      {useMemo(() => hasGamepad(), []) ? (
        <fbt desc="Reload description">
          Press A, B, L1 and R1 to reload the game.
        </fbt>
      ) : (
        <fbt desc="Reload description">
          Tap here to{' '}
          <InlineLink inline onClick={reload} {...linkProps}>
            reload the game
          </InlineLink>.
        </fbt>
      )}
    </>
  );
}
