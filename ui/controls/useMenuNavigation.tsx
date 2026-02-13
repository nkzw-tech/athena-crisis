import { useCallback, useState } from 'react';
import { InputLayer } from './Input.tsx';
import useAcceptNavigation from './useAcceptNavigation.tsx';
import useDirectionalNavigation from './useDirectionalNavigation.tsx';

const isValid = (count: number, value: number) => value >= 0 && value < count;

export default function useMenuNavigation(
  initialCount: number,
  layer: InputLayer = 'menu',
  nowrap = false,
  initial: 'selected' | number = -1,
): [selected: number, active: number, reset: (currentSelected?: number) => void] {
  const [count, setCount] = useState(initialCount);
  const [selected, setSelected] = useState(
    initial !== 'selected' && isValid(count, initial) ? initial : -1,
  );
  const [active, resetActive] = useAcceptNavigation(count, layer, selected);

  if (count !== initialCount) {
    setCount(initialCount);
    setSelected(initial === 'selected' ? selected : isValid(initialCount, initial) ? initial : -1);
    if (active !== -1) {
      resetActive();
    }
  }

  useDirectionalNavigation(
    useCallback(
      (change: -1 | 0 | 1) => {
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
    count > 0,
    layer,
  );

  return [
    selected,
    active,
    useCallback(
      (selected?: number) => {
        setSelected(
          initial === 'selected'
            ? selected != null
              ? selected
              : -1
            : isValid(count, initial)
              ? initial
              : -1,
        );
        resetActive();
      },
      [count, resetActive, initial],
    ),
  ];
}
