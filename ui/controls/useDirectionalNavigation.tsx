import { useCallback } from 'react';
import AudioPlayer from '../AudioPlayer.tsx';
import { InputLayer } from './Input.tsx';
import { useOptionalInput } from './useInput.tsx';

export default function useDirectionalNavigation(
  select: (change: 1 | -1) => boolean,
  condition: boolean,
  layer: InputLayer = 'menu',
) {
  useOptionalInput(
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
    condition,
    layer,
  );

  useOptionalInput(
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
    condition,
    layer,
  );

  useOptionalInput(
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
    condition,
    layer,
  );
}
