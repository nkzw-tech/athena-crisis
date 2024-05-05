import maxBy from '@deities/hephaestus/maxBy.tsx';

export type AttributeRange = 1 | 2 | 3 | 4 | 5;
export type AttributeRangeWithZero = 0 | 1 | 2 | 3 | 4 | 5;
export type LargeAttributeRangeWithZero =
  | AttributeRangeWithZero
  | 6
  | 7
  | 8
  | 9
  | 10;

export function validateAttributeRange(
  value?: number | null,
): value is AttributeRange {
  return !!value && value >= 1 && value <= 5;
}

export default function getAttributeRange<T>(
  list: ReadonlyArray<T>,
  extract: (entry: T) => number,
  min: number = 0,
  length: number = 5,
) {
  const entry = maxBy(list, extract);
  if (!entry) {
    return [];
  }

  const step = (extract(entry) - min) / (length - 1);
  return Array.from(
    { length },
    (_, index) => min + index * step - (index > 0 ? step / 2 : 0),
  );
}

export function getAttributeRangeValue(
  range: ReadonlyArray<number>,
  value: number,
) {
  if (value < range[0]) {
    return 0;
  }

  const index = range.findLastIndex((item) => item <= value);
  return (index === -1 ? range.length : index + 1) as AttributeRangeWithZero;
}

export function getLargeAttributeRangeValue(
  range: ReadonlyArray<number>,
  value: number,
) {
  if (value < range[0]) {
    return 0;
  }

  const index = range.findLastIndex((item) => item <= value);
  return (
    index === -1 ? range.length : index + 1
  ) as LargeAttributeRangeWithZero;
}
