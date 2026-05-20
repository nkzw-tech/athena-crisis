export type PlainBitSet = ReadonlyArray<number>;

const normalize = (value: number) => value >>> 0;

const trim = (words: ReadonlyArray<number>): PlainBitSet => {
  let length = words.length;
  while (length > 0 && !words[length - 1]) {
    length--;
  }
  return Array.from({ length }, (_, index) => normalize(words[index] || 0));
};

const assertValidIndex = (index: number) => {
  if (index < 0 || !Number.isInteger(index)) {
    throw new Error(`BitSet: Invalid index '${index}'.`);
  }
};

export default class BitSet {
  private readonly words: PlainBitSet;

  constructor(words: PlainBitSet = []) {
    this.words = trim(words);
  }

  get size() {
    return this.words.length;
  }

  add(index: number): BitSet {
    assertValidIndex(index);

    const wordIndex = index >>> 5;
    const bit = 1 << index;
    const current = this.words[wordIndex] || 0;
    if (current & bit) {
      return this;
    }

    const next = this.words.slice();
    next[wordIndex] = normalize(current | bit);
    return new BitSet(next);
  }

  addAll(indices: Iterable<number>): BitSet {
    let next: Array<number> | null = null;
    for (const index of indices) {
      assertValidIndex(index);

      const wordIndex = index >>> 5;
      const bit = 1 << index;
      const words = next || this.words;
      const current = words[wordIndex] || 0;
      if (!(current & bit)) {
        next ||= this.words.slice();
        next[wordIndex] = normalize(current | bit);
      }
    }
    return next ? new BitSet(next) : this;
  }

  has(index: number): boolean {
    if (index < 0 || !Number.isInteger(index)) {
      return false;
    }

    return !!((this.words[index >>> 5] || 0) & (1 << index));
  }

  union(bitSet: BitSet): BitSet {
    const length = Math.max(this.words.length, bitSet.words.length);
    let next: Array<number> | null = null;
    for (let i = 0; i < length; i++) {
      const current = this.words[i] || 0;
      const union = normalize(current | (bitSet.words[i] || 0));
      if (union !== current) {
        next ||= this.words.slice();
        next[i] = union;
      } else if (next && i >= next.length) {
        next[i] = current;
      }
    }
    return next ? new BitSet(next) : this;
  }

  toJSON(): PlainBitSet {
    return this.words;
  }

  static fromJSON(words: PlainBitSet | undefined): BitSet {
    return new BitSet(words);
  }
}
