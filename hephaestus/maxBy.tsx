export default function maxBy<T>(
  array: ReadonlyArray<T>,
  fn: (a: T) => number,
) {
  return array.length
    ? array.reduce((acc, val) => (fn(val) > fn(acc) ? val : acc))
    : undefined;
}
