import { expect, test } from 'vitest';
import { CounterAttack } from '../../map/Configuration.tsx';
import {
  decodeRogueRelics,
  getRogueAttackEffect,
  getRogueCounterAttackEffect,
  getRogueDefenseEffect,
  getRogueMovementEffect,
  getRogueVisionEffect,
  RogueRelic,
} from '../RogueRelic.tsx';

test.each([
  [1, 0.03, -0.2, 0.77],
  [2, 0.05, -0.15, 0.79],
  [3, 0.07, -0.1, 0.81],
  [4, 0.1, -0.05, 0.83],
] as const)(
  'applies the level %s Rogue relic values',
  (level, combatEffect, crystalDefenseEffect, counterAttackEffect) => {
    expect(getRogueAttackEffect(new Map([[RogueRelic.GuardiansScope, level]]))).toBeCloseTo(
      combatEffect,
    );
    expect(getRogueDefenseEffect(new Map([[RogueRelic.AthenasGateFragment, level]]))).toBeCloseTo(
      combatEffect,
    );
    expect(getRogueDefenseEffect(new Map([[RogueRelic.ArvidsPocketCrystal, level]]))).toBeCloseTo(
      crystalDefenseEffect,
    );
    expect(getRogueMovementEffect(new Map([[RogueRelic.ArvidsPocketCrystal, level]]))).toBe(1);
    expect(
      getRogueCounterAttackEffect(new Map([[RogueRelic.KanesContingency, level]])),
    ).toBeCloseTo(counterAttackEffect);
    expect(getRogueVisionEffect(new Map([[RogueRelic.SerasForesight, level]]))).toBe(level);
  },
);

test('decodes Rogue relics and applies every modifier by level', () => {
  const relics = decodeRogueRelics([
    [RogueRelic.GuardiansScope, 2],
    [RogueRelic.AthenasGateFragment, 3],
    [RogueRelic.ArvidsPocketCrystal, 1],
    [RogueRelic.KanesContingency, 4],
    [RogueRelic.SerasForesight, 2],
  ]);

  expect(getRogueAttackEffect(relics)).toBe(0.05);
  expect(getRogueDefenseEffect(relics)).toBeCloseTo(-0.13);
  expect(getRogueMovementEffect(relics)).toBe(1);
  expect(getRogueCounterAttackEffect(relics)).toBe(CounterAttack + 0.08);
  expect(getRogueVisionEffect(relics)).toBe(2);
});

test("uses the standard counterattack value without Kane's Contingency", () => {
  expect(getRogueCounterAttackEffect(new Map())).toBe(CounterAttack);
});
