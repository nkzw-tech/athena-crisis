import { CounterAttack } from '../map/Configuration.tsx';

export enum RogueRelic {
  GuardiansScope = 1,
  AthenasGateFragment = 2,
  ArvidsPocketCrystal = 3,
  KanesContingency = 4,
  SerasForesight = 5,
}

export type RogueRelicLevel = 1 | 2 | 3 | 4;
export type RogueRelicsMap = ReadonlyMap<RogueRelic, RogueRelicLevel>;
export type PlainRogueRelics = ReadonlyArray<readonly [RogueRelic, RogueRelicLevel]>;

export const RogueRelicLevels = [1, 2, 3, 4] as const satisfies ReadonlyArray<RogueRelicLevel>;

export const RogueRelics = [
  RogueRelic.GuardiansScope,
  RogueRelic.AthenasGateFragment,
  RogueRelic.ArvidsPocketCrystal,
  RogueRelic.KanesContingency,
  RogueRelic.SerasForesight,
] as const;

export const MaxRogueRelics = 3;

export function toRogueRelic(value: number): RogueRelic {
  if (RogueRelics.includes(value as RogueRelic)) {
    return value as RogueRelic;
  }
  throw new Error(`toRogueRelic: Unknown Rogue relic: ${value}`);
}

export function toRogueRelicLevel(value: number): RogueRelicLevel {
  if (RogueRelicLevels.includes(value as RogueRelicLevel)) {
    return value as RogueRelicLevel;
  }
  throw new Error(`toRogueRelicLevel: Invalid Rogue relic level: ${value}`);
}

export function decodeRogueRelics(relics?: PlainRogueRelics): RogueRelicsMap {
  return new Map(
    relics?.map(([relic, level]) => [toRogueRelic(relic), toRogueRelicLevel(level)]) || [],
  );
}

export function encodeRogueRelics(relics: RogueRelicsMap): PlainRogueRelics | undefined {
  return relics.size ? [...relics] : undefined;
}

const CombatEffect: Readonly<Record<RogueRelicLevel, number>> = {
  1: 0.03,
  2: 0.05,
  3: 0.07,
  4: 0.1,
};

export const getRogueAttackEffect = (relics: RogueRelicsMap) => {
  const level = relics.get(RogueRelic.GuardiansScope);
  return level ? CombatEffect[level] : 0;
};

export const getRogueDefenseEffect = (relics: RogueRelicsMap) => {
  const gateFragment = relics.get(RogueRelic.AthenasGateFragment);
  const crystal = relics.get(RogueRelic.ArvidsPocketCrystal);
  return (gateFragment ? CombatEffect[gateFragment] : 0) + (crystal ? -0.25 + crystal * 0.05 : 0);
};

export const getRogueMovementEffect = (relics: RogueRelicsMap) =>
  relics.has(RogueRelic.ArvidsPocketCrystal) ? 1 : 0;

export const getRogueVisionEffect = (relics: RogueRelicsMap) =>
  relics.get(RogueRelic.SerasForesight) || 0;

export const getRogueCounterAttackEffect = (relics: RogueRelicsMap) => {
  const level = relics.get(RogueRelic.KanesContingency);
  return CounterAttack + (level || 0) * 0.02;
};
