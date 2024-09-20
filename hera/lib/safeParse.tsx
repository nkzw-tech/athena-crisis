export default function safeParseArray<T>(
  data: string | null | undefined,
): ReadonlyArray<T> | null {
  try {
    const maybeArray = JSON.parse(data || '');
    return Array.isArray(maybeArray) ? maybeArray : null;
  } catch {
    return null;
  }
}
