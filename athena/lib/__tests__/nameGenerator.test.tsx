import { expect, test } from 'vitest';
import nameGenerator from '../nameGenerator.tsx';

test('`nameGenerator` never runs out of names', () => {
  const generator = nameGenerator();
  for (let i = 0; i < 300; i++) {
    expect(generator()).not.toBe(undefined);
  }
});
