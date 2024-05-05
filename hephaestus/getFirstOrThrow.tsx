import getFirst from './getFirst.tsx';

export default function getFirstOrThrow<T>(iterable: Iterable<T>): T {
  const entry = getFirst(iterable);
  if (entry == null) {
    throw new Error(`getFirstOrThrow: Expected at least one entry.`);
  }
  return entry;
}
