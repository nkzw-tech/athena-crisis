import { expect, test } from 'vitest';
import BitSet from '../map/BitSet.tsx';

test('stores boolean flags in 32-bit words', () => {
  const bitSet = new BitSet().add(0).add(3).add(4).add(32);

  expect(bitSet.has(0)).toBe(true);
  expect(bitSet.has(1)).toBe(false);
  expect(bitSet.has(3)).toBe(true);
  expect(bitSet.has(4)).toBe(true);
  expect(bitSet.has(31)).toBe(false);
  expect(bitSet.has(32)).toBe(true);
  expect(bitSet.toJSON()).toEqual([25, 1]);
});

test('is immutable', () => {
  const empty = new BitSet();
  const bitSet = empty.add(2);

  expect(empty.has(2)).toBe(false);
  expect(empty.toJSON()).toEqual([]);
  expect(bitSet.has(2)).toBe(true);
});

test('returns the same instance when adding existing bits', () => {
  const bitSet = new BitSet().add(2);

  expect(bitSet.add(2)).toBe(bitSet);
  expect(bitSet.addAll([2, 2])).toBe(bitSet);
});

test('adds many bits with one immutable update', () => {
  const empty = new BitSet();
  const bitSet = empty.addAll([0, 3, 4, 32, 63, 64, 64]);

  expect(empty.toJSON()).toEqual([]);
  expect(bitSet.toJSON()).toEqual([25, 2_147_483_649, 1]);
  expect(bitSet.has(0)).toBe(true);
  expect(bitSet.has(32)).toBe(true);
  expect(bitSet.has(63)).toBe(true);
  expect(bitSet.has(64)).toBe(true);
});

test('unions and trims serialized values', () => {
  const bitSet = BitSet.fromJSON([0, 0, 1, 0]).union(new BitSet().add(1));

  expect(bitSet.has(1)).toBe(true);
  expect(bitSet.has(64)).toBe(true);
  expect(bitSet.toJSON()).toEqual([2, 0, 1]);
});

test('returns the same instance when union does not change anything', () => {
  const bitSet = new BitSet().addAll([1, 64]);
  const subset = new BitSet().add(1);

  expect(bitSet.union(subset)).toBe(bitSet);
});

test('keeps union immutable', () => {
  const bitSetA = new BitSet().add(1);
  const bitSetB = new BitSet().add(64);
  const union = bitSetA.union(bitSetB);

  expect(bitSetA.toJSON()).toEqual([2]);
  expect(bitSetB.toJSON()).toEqual([0, 0, 1]);
  expect(union.toJSON()).toEqual([2, 0, 1]);
});

test('normalizes the signed high bit for JSON', () => {
  const bitSet = new BitSet().add(31);

  expect(bitSet.has(31)).toBe(true);
  expect(bitSet.toJSON()).toEqual([2_147_483_648]);
});

test('rejects invalid mutation indices', () => {
  expect(() => new BitSet().add(-1)).toThrow("BitSet: Invalid index '-1'.");
  expect(() => new BitSet().add(1.5)).toThrow("BitSet: Invalid index '1.5'.");
  expect(() => new BitSet().addAll([0, -1])).toThrow("BitSet: Invalid index '-1'.");
});

test('treats invalid lookup indices as absent', () => {
  const bitSet = new BitSet().add(1);

  expect(bitSet.has(-1)).toBe(false);
  expect(bitSet.has(1.5)).toBe(false);
});
