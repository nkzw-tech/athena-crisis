import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, cx } from '@emotion/css';
import React, { ReactNode, useEffect, useState } from 'react';
import { StateWithActions } from '../Types.tsx';
import maybeFade from './lib/maybeFade.tsx';

export default function AdminActions({
  children,
  endGame,
  hide,
  invade,
  saveGameState,
  state,
}: StateWithActions & {
  children?: ReactNode;
  endGame?: (type: 'Win' | 'Lose') => Promise<void>;
  hide?: boolean;
  invade?: () => Promise<void>;
  saveGameState?: () => Promise<void>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.code === 'KeyA') {
        setVisible(!visible);
      }
    };
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [visible]);

  return (
    <Portal>
      <Box blur className={cx(maybeFade(hide), style, visible && visibleStyle)}>
        {saveGameState && (
          <InlineLink onClick={() => saveGameState()}>
            <fbt desc="Button to save the map to disk">Save to Disk</fbt>
          </InlineLink>
        )}
        {endGame && (
          <>
            <InlineLink onClick={() => endGame('Win')}>
              <fbt desc="Button to win the game (admin)">Win game</fbt>
            </InlineLink>
            <InlineLink onClick={() => endGame('Lose')}>
              <fbt desc="Button to lose the game (admin)">Lose game</fbt>
            </InlineLink>
          </>
        )}
        {invade && (
          <InlineLink onClick={() => invade()}>
            <fbt desc="Button to invade this game">Invade</fbt>
          </InlineLink>
        )}
        {children}
      </Box>
    </Portal>
  );
}

const style = css`
  bottom: 36px;
  left: 0;
  margin: 0 auto;
  opacity: 0;
  position: fixed;
  right: 0;
  transform: translate3d(0, 100%, 0) scale(0.9);
  transition:
    opacity 150ms ease,
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  width: 60%;
  pointer-events: none;

  & > * {
    padding: 8px 12px;
  }
`;

const visibleStyle = css`
  pointer-events: auto;
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
`;
