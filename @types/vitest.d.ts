import 'vitest';

declare module 'vitest' {
  interface Matchers<R, T> {
    toMatchImageSnapshot(): R;
  }
}
