import { useEffect } from 'react';
import Input, { EventName, Events, InputLayer } from './Input.tsx';

export default function useInput<T extends EventName>(
  type: T,
  fn: (event: CustomEvent<Events[T]>) => void,
  layer: InputLayer = 'base',
) {
  useEffect(() => Input.register(type, fn, layer), [type, fn, layer]);
}

export function useOptionalInput<T extends EventName>(
  type: T,
  fn: (event: CustomEvent<Events[T]>) => void,
  condition: boolean,
  layer: InputLayer = 'base',
) {
  useEffect(() => {
    if (condition) {
      return Input.register(type, fn, layer);
    }
  }, [type, fn, layer, condition]);
}
