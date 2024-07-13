export default function filterNodes<T, S extends Record<string, unknown>>(
  edge:
    | (S & {
        readonly node: T | null | undefined;
      })
    | null
    | undefined,
): edge is S & { readonly node: T } {
  return edge != null && edge?.node != null;
}
