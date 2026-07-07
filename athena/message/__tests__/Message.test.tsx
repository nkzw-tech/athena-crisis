import { expect, test } from 'vitest';
import { Pioneer } from '../../info/Unit.tsx';
import { MessageTag, MessageVocabulary, toPlainMapMessage } from '../Message.tsx';

test('map messages only expose released faction players', () => {
  expect(MessageVocabulary.get(MessageTag.Faction)?.has(7)).toBe(true);
  expect(MessageVocabulary.get(MessageTag.Faction)?.has(8)).toBe(false);
});

test('map messages reject unreleased message players', () => {
  expect(
    toPlainMapMessage({
      player: 8,
      template: 1,
      value: [MessageTag.Faction, 1],
    }),
  ).toBeNull();
});

test('map messages reject unreleased value players', () => {
  expect(
    toPlainMapMessage({
      player: 1,
      template: 1,
      value: [MessageTag.Unit, Pioneer.id, 8],
    }),
  ).toBeNull();
});
