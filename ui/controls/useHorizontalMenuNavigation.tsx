import { useCallback, useState } from 'react';
import { InputLayer } from './Input.tsx';
import useAcceptNavigation from './useAcceptNavigation.tsx';
import useHorizontalNavigation from './useHorizontalNavigation.tsx';

const isValid = (count: number, value: number) => value >= 0 && value < count;

export default function useHorizontalMenuNavigation(
  initialCount: number,
  layer: InputLayer = 'menu',
  nowrap = false,
  initial = -1,
): [selected: number, active: number, reset: () => void] {
  const [count, setCount] = useState(initialCount);
  const [selected, setSelected] = useState(
    isValid(count, initial) ? initial : -1,
  );
  const [active, resetActive] = useAcceptNavigation(count, layer, selected);

  if (count !== initialCount) {
    setCount(initialCount);
    setSelected(isValid(initialCount, initial) ? initial : -1);
    if (active !== -1) {
      resetActive();
    }
  }

  useHorizontalNavigation(
    useCallback(
      (change: -1 | 1) => {
        if (count === 0) {
          return false;
        }

        let index = selected === -1 ? 0 : selected + change;
        if (!nowrap) {
          if (index < 0) {
            index = count - 1;
          } else if (index === count) {
            index = 0;
          }
        }

        if (isValid(count, index)) {
          setSelected(index);
          return true;
        }
        return false;
      },
      [count, selected, nowrap],
    ),
    layer,
  );

  return [
    selected,
    active,
    useCallback(() => {
      setSelected(isValid(count, initial) ? initial : -1);
      resetActive();
    }, [count, initial, resetActive]),
  ];
}
