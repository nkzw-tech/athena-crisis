import sortBy from '@nkzw/core/sortBy.js';
import vec from './vec.tsx';

export type VectorLike = Readonly<{
  x: number;
  y: number;
}>;

export const szudzik = (x: number, y: number) => (x >= y ? x * x + x + y : y * y + x);

export default abstract class Vector {
  protected id: string;
  private vectors: readonly [Vector, Vector, Vector, Vector] | null = null;

  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {
    this.id = `${x},${y}`;
  }

  up(n = 1) {
    return vec(this.x, this.y - n);
  }
  right(n = 1) {
    return vec(this.x + n, this.y);
  }
  down(n = 1) {
    return vec(this.x, this.y + n);
  }
  left(n = 1) {
    return vec(this.x - n, this.y);
  }

  // Do not change the order of these expansions.
  expand() {
    return [this, this.up(), this.right(), this.down(), this.left()] as const;
  }

  adjacent() {
    return (
      this.vectors || (this.vectors = [this.up(), this.right(), this.down(), this.left()] as const)
    );
  }

  adjacentWithDiagonals() {
    const { x, y } = this;
    return [
      ...this.adjacent(),
      vec(x - 1, y - 1),
      vec(x + 1, y - 1),
      vec(x - 1, y + 1),
      vec(x + 1, y + 1),
    ] as const;
  }

  adjacentStar() {
    return [
      ...this.adjacentWithDiagonals(),
      this.up(2),
      this.right(2),
      this.down(2),
      this.left(2),
    ] as const;
  }

  expandWithDiagonals() {
    const { x, y } = this;
    return [
      ...this.expand(),
      vec(x - 1, y - 1),
      vec(x + 1, y - 1),
      vec(x - 1, y + 1),
      vec(x + 1, y + 1),
    ] as const;
  }

  expandStar() {
    return [
      ...this.expandWithDiagonals(),
      this.up(2),
      this.right(2),
      this.down(2),
      this.left(2),
    ] as const;
  }

  distance(v: Vector) {
    return Math.abs(this.x - v.x) + Math.abs(this.y - v.y);
  }

  equals(vector: VectorLike | null) {
    return !!vector && this.x == vector.x && this.y == vector.y;
  }

  hashCode(): string | number {
    return szudzik(this.x + 1, this.y + 1);
  }

  valueOf() {
    return this.id;
  }

  toString() {
    return this.id;
  }

  toJSON() {
    return [this.x, this.y] as const;
  }
}

export function isVector(value: unknown): value is Vector {
  // eslint-disable-next-line @nkzw/no-instanceof
  return value instanceof Vector;
}

export function encodeVectorArray(vectors: ReadonlyArray<Vector>) {
  return vectors.flatMap((vector) => [vector.x, vector.y]);
}

export function decodeVectorArray(array: ReadonlyArray<number>): ReadonlyArray<Vector> {
  const result = [];
  for (let i = 0; i < array.length; i += 2) {
    result.push(vec(array[i], array[i + 1]));
  }
  return result;
}

export function sortVectors(vectors: Array<Vector>) {
  return sortBy(vectors, (vector) => szudzik(vector.x + 1, vector.y + 1));
}

export function sortByVectorKey<T>(list: Iterable<[Vector, T]>) {
  return sortBy([...list], (item) => szudzik(item[0].x + 1, item[0].y + 1));
}
