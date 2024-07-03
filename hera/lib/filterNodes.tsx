export default function filterNodes<T extends { id: string }>(
  edge:
    | {
        node: T | null | undefined;
      }
    | null
    | undefined,
): edge is { node: T } {
  return !!edge?.node;
}
