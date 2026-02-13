import isVisibleActionResponse from '@deities/apollo/lib/isVisibleActionResponse.tsx';
import { DoubleSize } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { BoxStyle } from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import NumberInput from '@deities/ui/form/NumberInput.tsx';
import Icon from '@deities/ui/Icon.tsx';
import FastForward from '@deities/ui/icons/FastForward.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Slider from '@deities/ui/Slider.tsx';
import { css, cx } from '@emotion/css';
import Back from '@iconify-icons/pixelarticons/chevron-left.js';
import Next from '@iconify-icons/pixelarticons/chevron-right.js';
import Pause from '@iconify-icons/pixelarticons/pause.js';
import Play from '@iconify-icons/pixelarticons/play.js';
import parseInteger from '@nkzw/core/parseInteger.js';
import Stack from '@nkzw/stack';
import { useCallback, useMemo } from 'react';
import MiniPlayerIcon from '../ui/MiniPlayerIcon.tsx';
import { GameStateWithGameActionResponseEntry } from './hooks/useReplayGameState.tsx';
import { PlayState } from './ReplayMap.tsx';

const isNewPlayer = (previousMap: MapData | undefined, activeMap: MapData | undefined) =>
  previousMap &&
  activeMap &&
  (previousMap.currentPlayer !== activeMap.currentPlayer || previousMap.round !== activeMap.round);

export default function ReplayPanel({
  currentIndex,
  gameState,
  hasState,
  max,
  playState,
  setCurrentIndex,
  setPlayState,
}: {
  currentIndex: number;
  gameState: GameStateWithGameActionResponseEntry;
  hasState: (index: number) => boolean;
  max: number;
  playState: PlayState;
  setCurrentIndex: (index: number) => void;
  setPlayState: (state: PlayState) => void;
}) {
  const [previous, next] = useMemo(() => {
    let previous = currentIndex - 1;
    let next = currentIndex + 1;

    for (let index = previous; index >= 0; index--) {
      const actionResponse = gameState.at(index)?.[0];
      if (actionResponse && isVisibleActionResponse(actionResponse)) {
        previous = index;
        break;
      }
    }

    for (let index = next; index < gameState.length; index++) {
      const actionResponse = gameState.at(index)?.[0];
      if (actionResponse && isVisibleActionResponse(actionResponse)) {
        next = index;
        break;
      }
    }

    return [previous, next];
  }, [currentIndex, gameState]);

  const [previousTurn, nextTurn] = useMemo(() => {
    let previousTurn = 0;
    let nextTurn = gameState.length - 1;

    for (let index = currentIndex - 1; index >= 0; index--) {
      if (isNewPlayer(gameState.at(index + 1)?.[1], gameState.at(index)?.[1])) {
        previousTurn = index;
        break;
      }
    }

    for (let index = currentIndex + 1; index < gameState.length; index++) {
      if (isNewPlayer(gameState.at(index - 1)?.[1], gameState.at(index)?.[1])) {
        nextTurn = index;
        break;
      }
    }

    return [previousTurn, nextTurn];
  }, [currentIndex, gameState]);

  const setRound = useCallback(
    (round: number) => {
      for (let index = 0; index <= gameState.length; index++) {
        const map = gameState.at(index)?.[1];
        if (map && map.round === round) {
          setCurrentIndex(index);
          break;
        }
      }
    },
    [gameState, setCurrentIndex],
  );
  const currentMap = gameState.at(currentIndex)?.[1];
  const maxRound = useMemo(() => gameState.at(-1)?.[1].round || 1, [gameState]);

  useInput(
    'navigate',
    useCallback(
      (event) => {
        event.preventDefault();
        if (event.detail.x > 0 && hasState(next)) {
          setCurrentIndex(next);
        } else if (event.detail.x < 0 && hasState(previous)) {
          setCurrentIndex(previous);
        }
      },
      [hasState, next, previous, setCurrentIndex],
    ),
    'menu',
  );

  useInput(
    'previous',
    useCallback(() => setCurrentIndex(previousTurn), [previousTurn, setCurrentIndex]),
  );

  useInput(
    'next',
    useCallback(() => setCurrentIndex(nextTurn), [nextTurn, setCurrentIndex]),
  );

  return (
    <Portal>
      <div className={containerStyle}>
        <Stack between className={cx(BoxStyle, panelStyle)} wrap>
          <Stack alignCenter between flex1 gap wrap>
            <InlineLink
              disabled={currentIndex === previousTurn}
              onClick={() => setCurrentIndex(previousTurn)}
            >
              <Icon horizontalFlip icon={FastForward} />
            </InlineLink>
            <InlineLink disabled={!hasState(previous)} onClick={() => setCurrentIndex(previous)}>
              <Icon icon={Back} />
            </InlineLink>
            <Slider
              max={max}
              min="0"
              onChange={({ target: { value } }) => {
                setCurrentIndex(parseInteger(value) || 0);
              }}
              type="range"
              value={currentIndex}
            />
            <NumberInput
              className={inputStyle}
              max={maxRound}
              min={1}
              onChange={({ target: { value } }) => {
                setRound(parseInteger(value) || 1);
              }}
              value={String(currentMap?.round || 1)}
            />
            {currentMap && <MiniPlayerIcon id={currentMap.currentPlayer} />}
            <InlineLink onClick={() => setPlayState(playState === 'paused' ? 'playing' : 'paused')}>
              <Icon icon={playState === 'paused' ? Play : Pause} />
            </InlineLink>
            <InlineLink disabled={!hasState(next)} onClick={() => setCurrentIndex(next)}>
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
    width: 384px;
  }
`;

const inputStyle = css`
  margin: 0;
  padding: 0 4px;
  width: 48px;
`;
