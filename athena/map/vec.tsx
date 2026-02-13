import Vector, { szudzik } from './Vector.tsx';

const vectors = Array(30_000);

export default function vec(x: number, y: number): Vector {
  if (process.env.NODE_ENV === 'development') {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
      throw new Error(`Vector { x: ${x}, y: ${y} } is invalid. 'x' and 'y' must be integers.`);
    }
    if (x < -2 || y < -2) {
      throw new Error(
        `Vector { x: ${x}, y: ${y} } is invalid. 'x' and 'y' must be positive integers.`,
      );
    }
  }

  // Acceptable vectors may be up to -2 in each dimension, based on `Vector.expandStar`.
  const id = szudzik(x + 2, y + 2);
  // @ts-expect-error
  return vectors[id] || (vectors[id] = new Vector(x, y));
}
