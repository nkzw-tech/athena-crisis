import { GameState } from '@deities/apollo/Types.tsx';
import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import { BoxStyle } from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import FastForward from '@deities/ui/icons/FastForward.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Slider from '@deities/ui/Slider.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Back from '@iconify-icons/pixelarticons/chevron-left.js';
import Next from '@iconify-icons/pixelarticons/chevron-right.js';
import parseInteger from '@nkzw/core/parseInteger.js';
import { useCallback, useMemo } from 'react';

export default function ReplayPanel({
  currentIndex,
  gameState,
  hasState,
  max,
  setCurrentIndex,
}: {
  currentIndex: number;
  gameState: GameState;
  hasState: (index: number) => boolean;
  max: number;
  setCurrentIndex: (index: number) => void;
}) {
  const [previousTurn, nextTurn] = useMemo(() => {
    let previousTurn = 0;
    let nextTurn = gameState.length - 1;

    for (let index = currentIndex - 1; index >= 0; index--) {
      if (gameState.at(index)?.[0].type === 'EndTurn') {
        previousTurn = index;
        break;
      }
    }

    for (let index = currentIndex + 1; index < gameState.length; index++) {
      if (gameState.at(index)?.[0].type === 'EndTurn') {
        nextTurn = index;
        break;
      }
    }

    return [previousTurn, nextTurn];
  }, [currentIndex, gameState]);

  useInput(
    'navigate',
    useCallback(
      (event) => {
        event.preventDefault();
        if (event.detail.x > 0 && hasState(currentIndex + 1)) {
          setCurrentIndex(currentIndex + 1);
        } else if (event.detail.x < 0 && hasState(currentIndex - 1)) {
          setCurrentIndex(currentIndex - 1);
        }
      },
      [currentIndex, hasState, setCurrentIndex],
    ),
    'menu',
  );

  useInput(
    'previous',
    useCallback(
      () => setCurrentIndex(previousTurn),
      [previousTurn, setCurrentIndex],
    ),
  );

  useInput(
    'next',
    useCallback(() => setCurrentIndex(nextTurn), [nextTurn, setCurrentIndex]),
  );

  return (
    <Portal>
      <div className={containerStyle}>
        <Stack className={cx(BoxStyle, panelStyle)}>
          <Stack flex1 gap>
            <InlineLink
              disabled={currentIndex === previousTurn}
              onClick={() => setCurrentIndex(previousTurn)}
            >
              <Icon horizontalFlip icon={FastForward} />
            </InlineLink>
            <InlineLink
              disabled={!hasState(currentIndex - 1)}
              onClick={() => setCurrentIndex(currentIndex - 1)}
            >
              <Icon icon={Back} />
            </InlineLink>
            <Slider
              max={max}
              min="0"
              onChange={(event) => {
                setCurrentIndex(parseInteger(event.target.value) || 0);
              }}
              type="range"
              value={currentIndex}
            />
            <InlineLink
              disabled={!hasState(currentIndex + 1)}
              onClick={() => setCurrentIndex(currentIndex + 1)}
            >
              <Icon icon={Next} />
            </InlineLink>
            <InlineLink
              disabled={currentIndex === nextTurn}
              onClick={() => setCurrentIndex(nextTurn)}
            >
              <Icon icon={FastForward} />
            </InlineLink>
          </Stack>
        </Stack>
      </div>
    </Portal>
  );
}

const size = DoubleSize;

const containerStyle = css`
  align-items: start;
  bottom: ${applyVar('safe-area-bottom')};
  display: flex;
  image-rendering: pixelated;
  left: 0;
  right: 0;
  pointer-events: none;
  position: fixed;
  z-index: max(calc(${applyVar('inset-z')} + 2), 20);
`;

const panelStyle = css`
  -webkit-user-drag: none;
  backdrop-filter: blur(4px);
  min-height: ${size}px;
  pointer-events: auto;
  margin: 0 auto;
  padding: 12px;
  width: calc(100vw - ${size * 3}px);
  z-index: max(calc(${applyVar('inset-z')} + 3), 20);

  ${Breakpoints.xs} {
    width: 360px;
  }
`;
