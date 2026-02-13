export type NativeTimeout = ReturnType<typeof setTimeout> | null;
export type ThrottleFn = (...args: ReadonlyArray<never>) => void;

export default function throttle<T extends ThrottleFn>(fn: T, interval: number) {
  let timeoutId: NativeTimeout = null;
  return (...args: Parameters<T>) => {
    if (!timeoutId) {
      timeoutId = setTimeout(() => {
        timeoutId = null;
      }, interval);
      // @ts-expect-error
      fn(...args);
    }
  };
}
