export default function safeParse<T>(
  data: string | null | undefined,
): T | null {
  try {
    return JSON.parse(data || '') || null;
  } catch {
    return null;
  }
}
