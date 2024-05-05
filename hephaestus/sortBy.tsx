export default function sortBy<T>(array: Array<T>, fn: (a: T) => number) {
  return array.sort((a, b) => fn(a) - fn(b));
}
