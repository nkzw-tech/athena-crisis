export default function getFirst<T>(iterable: Iterable<T>): T | null {
  for (const item of iterable) {
    return item;
  }
  return null;
}
