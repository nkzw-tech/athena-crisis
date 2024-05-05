import { useCallback } from 'react';
import AudioPlayer from '../AudioPlayer.tsx';
import { InputLayer } from './Input.tsx';
import useInput from './useInput.tsx';

export default function useHorizontalNavigation(
  select: (change: -1 | 1) => boolean,
  layer: InputLayer = 'menu',
) {
  useInput(
    'navigate',
    useCallback(
      (event) => {
        const { detail } = event;
        if (detail.x !== 0 && select(detail.x)) {
          AudioPlayer.playSound(detail.x === 1 ? 'UI/Next' : 'UI/Previous');
        }
      },
      [select],
    ),
    layer,
  );
}
