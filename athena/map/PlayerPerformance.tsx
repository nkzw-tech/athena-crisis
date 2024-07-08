import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import hasBonusObjective, {
  achievedOneBonusObjective,
} from '../lib/hasBonusObjective.tsx';
import MapData from '../MapData.tsx';
import { PlayerID } from './Player.tsx';
import { PlayerStatistics } from './PlayerStatistics.tsx';

enum Comparators {
  '≤' = '≤',
  '≥' = '≥',
}

export enum PerformanceStyleType {
  LostUnits = 0,
  CapturedBuildings = 1,
  OneShots = 2,
}

export const PerformanceStyleTypes = [
  PerformanceStyleType.LostUnits,
  PerformanceStyleType.CapturedBuildings,
  PerformanceStyleType.OneShots,
] as const;

export const PerformanceStyleComparators = {
  [PerformanceStyleType.LostUnits]: Comparators['≤'],
  [PerformanceStyleType.CapturedBuildings]: Comparators['≥'],
  [PerformanceStyleType.OneShots]: Comparators['≥'],
} as const;

export const PerformanceStyleTypeShortName: Record<
  PerformanceStyleType,
  string
> = {
  [PerformanceStyleType.LostUnits]: 'LU',
  [PerformanceStyleType.CapturedBuildings]: 'C',
  [PerformanceStyleType.OneShots]: 'OS',
} as const;

const StatsValues: Record<PerformanceStyleType, keyof PlayerStatistics> = {
  [PerformanceStyleType.LostUnits]: 'lostUnits',
  [PerformanceStyleType.CapturedBuildings]: 'captured',
  [PerformanceStyleType.OneShots]: 'oneShots',
} as const;

export type PerformanceStyle = [PerformanceStyleType, number];

export type PerformanceExpectation = Readonly<{
  pace: number | null;
  power: number | null;
  style: PerformanceStyle | null;
}>;

export type PerformanceType = keyof PerformanceExpectation | 'bonus';

export type PlayerPerformance = Record<PerformanceType, boolean | null>;

export type PlainPlayerPerformance = [
  pace: boolean | null,
  power: boolean | null,
  style: boolean | null,
  bonus: boolean | null,
];

export function getPowerValue({ destroyedUnits, lostUnits }: PlayerStatistics) {
  return destroyedUnits === 0
    ? 0
    : Math.max(0, Math.min(10, destroyedUnits / lostUnits));
}

export const getStyleValue = (
  style: PerformanceStyleType,
  stats: PlayerStatistics,
) => stats[StatsValues[style]];

const achievedStyleMetric = (
  [style, value]: PerformanceStyle,
  stats: PlayerStatistics,
) => {
  const statsValue = stats[StatsValues[style]];
  const comparator = PerformanceStyleComparators[style];
  switch (comparator) {
    case Comparators['≤']:
      return statsValue <= value;
    case Comparators['≥']:
      return statsValue >= value;
    default: {
      comparator satisfies never;
      throw new UnknownTypeError('reachedStyle', comparator);
    }
  }
};

export function evaluatePlayerPerformance(
  map: MapData,
  playerId: PlayerID,
  achievedBonusObjective = achievedOneBonusObjective(map, playerId),
): PlayerPerformance {
  const { performance } = map.config;
  const player = map.getPlayer(playerId);
  const power = getPowerValue(player.stats);
  return {
    bonus: hasBonusObjective(map, playerId) ? achievedBonusObjective : null,
    pace: performance.pace != null ? map.round <= performance.pace : null,
    power: performance.power != null ? power >= performance.power : null,
    style: performance.style
      ? achievedStyleMetric(performance.style, player.stats)
      : null,
  };
}

export function hasPerformanceExpectation(map: MapData) {
  const { performance } = map.config;
  return (
    performance.pace != null ||
    performance.power != null ||
    performance.style != null
  );
}

export function shouldEvaluatePlayerPerformance(
  map: MapData,
  playerId: PlayerID,
) {
  return hasPerformanceExpectation(map) || hasBonusObjective(map, playerId);
}

export function decodePlayerPerformance(
  performance: PlainPlayerPerformance,
): PlayerPerformance {
  return {
    bonus: performance[3],
    pace: performance[0],
    power: performance[1],
    style: performance[2],
  };
}

export function encodePlayerPerformance(
  performance: PlayerPerformance,
): PlainPlayerPerformance {
  return [
    performance.pace,
    performance.power,
    performance.style,
    performance.bonus,
  ];
}

export function maybeDecodePlayerPerformance(result: string | undefined) {
  try {
    return decodePlayerPerformance(JSON.parse(result || '')) || null;
  } catch {
    /* empty */
  }
  return null;
}
