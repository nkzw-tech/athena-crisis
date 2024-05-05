export default function groupBy<T, S>(
  iterable: Iterable<T>,
  fn: (item: T) => S,
): Map<S, Array<T>> {
  const map = new Map<S, Array<T>>();
  for (const item of iterable) {
    const key = fn(item);
    if (key != null) {
      const items = map.get(key);
      if (items) {
        items.push(item);
      } else {
        map.set(key, [item]);
      }
    }
  }
  return map;
}
