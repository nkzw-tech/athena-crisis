import type { MouseEvent } from 'react';
import { useCallback, useRef } from 'react';
import type {
  LongPressReactEvents as _LongPressReactEvents,
  LongPressCallbackMeta,
  LongPressOptions,
} from 'use-long-press';
import { useLongPress } from 'use-long-press';

export type LongPressReactEvents<T extends Element> = _LongPressReactEvents<T>;

export default function usePress(
  options: Omit<LongPressOptions, 'onCancel' | 'onStart' | 'threshold'> & {
    onLongPress: NonNullable<Parameters<typeof useLongPress>[0]>;
    onPress: (event: MouseEvent) => void;
  },
) {
  const { onLongPress, onPress, ...actualOptions } = options;
  const hasLongPress = useRef(false);

  const onCancel = useCallback(() => {
    hasLongPress.current = false;
  }, []);

  const bind = useLongPress(
    useCallback(
      (
        event: LongPressReactEvents<Element>,
        meta: LongPressCallbackMeta<unknown>,
      ) => {
        hasLongPress.current = true;
        onLongPress(event, meta);
      },
      [onLongPress],
    ),
    {
      ...actualOptions,
      onCancel,
      onStart: onCancel,
      threshold: 380,
    },
  );

  return useCallback(
    () => ({
      ...bind(),
      onClick: (event: MouseEvent) => {
        if (!hasLongPress.current) {
          onPress(event);
        }
      },
    }),
    [bind, onPress],
  );
}

export type UsePressProps = ReturnType<ReturnType<typeof usePress>>;
