import { expect, test } from 'vitest';
import getCampaignLevelDepths from '../getCampaignLevelDepths.tsx';
import { Campaign, Level } from '../Types.tsx';

const campaign = (next: Level<string>): Campaign<string> => ({
  description: '',
  name: '',
  next,
});

test('calculates depths for a linear campaign', () => {
  const third = { mapId: 'third' };
  const second = { mapId: 'second', next: [third] };
  const first = { mapId: 'first', next: [second] };

  expect(getCampaignLevelDepths(campaign(first))).toEqual(
    new Map([
      ['first', 1],
      ['second', 2],
      ['third', 3],
    ]),
  );
});

test('keeps the deepest depth for diamond-shaped campaign graphs', () => {
  const c = { mapId: 'C' };
  const b = { mapId: 'B', next: [c] };
  const a = { mapId: 'A', next: [b] };
  const s = { mapId: 'S', next: [a, c] };

  expect(getCampaignLevelDepths(campaign(s)).get('C')).toBe(4);
});

test('updates descendants when a shared level is reached through a deeper path', () => {
  const e = { mapId: 'E' };
  const d = { mapId: 'D', next: [e] };
  const c = { mapId: 'C', next: [d] };
  const b = { mapId: 'B', next: [c] };
  const a = { mapId: 'A', next: [b] };
  const s = { mapId: 'S', next: [d, a] };

  expect(getCampaignLevelDepths(campaign(s))).toEqual(
    new Map([
      ['S', 1],
      ['D', 5],
      ['E', 6],
      ['A', 2],
      ['B', 3],
      ['C', 4],
    ]),
  );
});
