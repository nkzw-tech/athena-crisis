import { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import { SyntheticEvent, TouchEvent } from 'react';

export type ClientCoordinates = {
  clientX: number | string;
  clientY: number | string;
};

const isTouchEvent = <Target extends Element>(
  event: SyntheticEvent<Target> | PointerEvent | ClientCoordinates,
): event is TouchEvent<Target> => 'touches' in event;

export default function toTransformOrigin(
  event: LongPressReactEvents<Element> | PointerEvent | ClientCoordinates,
) {
  const { clientX, clientY } = isTouchEvent(event)
    ? event.changedTouches[0] || event.touches[0]
    : event;
  return `${clientX}px ${clientY}px`;
}
