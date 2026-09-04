export default function reduceIterable<T, R>(
  iterable: Iterable<T>,
  fn: (value: R, item: T, index: number) => R,
  value: R,
): R {
  let index = 0;
  for (const item of iterable) {
    value = fn(value, item, index++);
  }
  return value;
}
