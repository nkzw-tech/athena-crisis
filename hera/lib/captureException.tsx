let capture = (error: unknown) => {};

export default function captureException(error: unknown) {
  capture(error);
}

export function setExceptionHandler(fn: (error: unknown) => void) {
  capture = fn;
}
