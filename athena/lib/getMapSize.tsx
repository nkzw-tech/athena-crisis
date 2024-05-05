type MapSize = 'Micro' | 'Small' | 'Medium' | 'Large';

export default function getMapSize<T>(
  {
    height,
    width,
  }: {
    height: number;
    width: number;
  },
  mapSize: Record<MapSize, T>,
): T {
  const area = width * height;
  return area < 120
    ? mapSize.Micro
    : area < 260
      ? mapSize.Small
      : area < 550
        ? mapSize.Medium
        : mapSize.Large;
}
