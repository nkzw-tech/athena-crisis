import safeParse from './safeParse.tsx';

export default function safeParseArray<T>(
  data: string | null | undefined,
): ReadonlyArray<T> | null {
  try {
    const maybeArray = safeParse(data);
    return Array.isArray(maybeArray) ? maybeArray : null;
  } catch {
    return null;
  }
}
