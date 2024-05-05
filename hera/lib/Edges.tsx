export type Edges<T> = Readonly<{
  edges: ReadonlyArray<{ node: T } | null | undefined>;
}>;
