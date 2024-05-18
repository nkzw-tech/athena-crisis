import { useCallback } from 'react';
import AudioPlayer from '../AudioPlayer.tsx';
import type { InputLayer } from './Input.tsx';
import useInput from './useInput.tsx';

export default function useDirectionalNavigation(
  select: (change: 1 | -1) => boolean,
  layer: InputLayer = 'menu',
) {
  useInput(
    'navigate',
    useCallback(
      (event) => {
        event.preventDefault();

        const directionChange = event.detail;
        const change =
          directionChange.y < 0 ? -1 : directionChange.y > 0 ? 1 : null;
        if (change && select(change)) {
          AudioPlayer.playSound(change === -1 ? 'UI/Previous' : 'UI/Next');
        }
      },
      [select],
    ),
    layer,
  );

  useInput(
    'next',
    useCallback(
      (event) => {
        event.preventDefault();
        if (select(1)) {
          AudioPlayer.playSound('UI/Next');
        }
      },
      [select],
    ),
    layer,
  );

  useInput(
    'previous',
    useCallback(
      (event) => {
        event.preventDefault();
        if (select(-1)) {
          AudioPlayer.playSound('UI/Previous');
        }
      },
      [select],
    ),
    layer,
  );
}
