export default function pickItem<S, T extends [S, number, ...ReadonlyArray<unknown>]>(
  items: ReadonlyArray<T>,
): T[0] | null {
  const total = items.reduce((sum, [, weight]) => sum + weight, 0);
  const probabilities = [];
  let cumulativeSum = 0;
  for (const [item, weight] of items) {
    cumulativeSum += weight / total;
    probabilities.push([item, cumulativeSum] as const);
  }

  const value = Math.random();
  for (const [item, cumulativeProbability] of probabilities) {
    if (value < cumulativeProbability) {
      return item;
    }
  }

  return items.length ? items[0][0] : null;
}
