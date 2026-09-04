import { expect, test } from 'vitest';
import reduceIterable from '../reduceIterable.tsx';

test('reduces iterables', () => {
  expect(reduceIterable(new Set([1, 2, 3]), (sum, value) => sum + value, 0)).toBe(6);
});

test('provides the current index', () => {
  expect(
    reduceIterable(['a', 'b', 'c'], (result, value, index) => result + value + index, ''),
  ).toBe('a0b1c2');
});

test('returns the initial value for empty iterables', () => {
  expect(reduceIterable([], (sum, value: number) => sum + value, 10)).toBe(10);
});
