import { NativeTimeout, ThrottleFn } from './throttle.tsx';

export default function dynamicThrottle<T extends ThrottleFn>(
  fn: T,
  intervalRange: ReadonlyArray<number>,
) {
  let calls = 0;
  let next = 0;
  let interval = intervalRange[next];
  let timeoutId: NativeTimeout = null;
  const wrapper = (...args: Parameters<T>) => {
    calls += 1;
    if (calls > 24 && intervalRange[next + 1]) {
      calls = 0;
      next += 1;
      interval = intervalRange[next];
    }

    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, interval);
      // @ts-expect-error
      fn(...args);
    }
  };
  wrapper.reset = () => {
    calls = 0;
    next = 0;
    interval = intervalRange[next];
  };
  return wrapper;
}
