export type Edges<T> = Readonly<{
  readonly edges:
    | ReadonlyArray<{ readonly node: T | null | undefined } | null | undefined>
    | null
    | undefined;
}>;
