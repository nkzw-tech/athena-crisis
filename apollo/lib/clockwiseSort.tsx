import Vector from '@deities/athena/map/Vector.tsx';

export default function clockwiseSort(list: ReadonlyArray<Vector>) {
  if (list.length < 2) {
    return list;
  }

  const centerX = list.reduce((sum, vector) => sum + vector.x, 0) / list.length;
  const centerY = list.reduce((sum, vector) => sum + vector.y, 0) / list.length;

  return list.slice().sort((vectorA, vectorB) => {
    const angleA = Math.atan2(centerY - vectorA.y, vectorA.x - centerX);
    const angleB = Math.atan2(centerY - vectorB.y, vectorB.x - centerX);
    if (angleA === angleB) {
      const distanceA = (vectorA.x - centerX) ** 2 + (vectorA.y - centerY) ** 2;
      const distanceB = (vectorB.x - centerX) ** 2 + (vectorB.y - centerY) ** 2;
      return distanceA - distanceB;
    }
    return angleA - angleB;
  });
}
