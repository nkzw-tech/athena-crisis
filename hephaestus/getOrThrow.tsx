export default function getOrThrow<T, K>(map: ReadonlyMap<K, T>, key: K) {
  const value = map.get(key);
  if (!value) {
    throw new Error(
      `Could not find entry for key '${JSON.stringify(key, null, 2)}'.`,
    );
  }
  return value;
}
