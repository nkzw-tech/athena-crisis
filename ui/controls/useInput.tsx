import { useEffect } from 'react';
import type { EventName, Events, InputLayer } from './Input.tsx';
import Input from './Input.tsx';

export default function useInput<T extends EventName>(
  type: T,
  fn: (event: CustomEvent<Events[T]>) => void,
  layer: InputLayer = 'base',
) {
  useEffect(() => Input.register(type, fn, layer), [type, fn, layer]);
}
