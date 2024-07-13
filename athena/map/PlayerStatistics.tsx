export type PlayerStatistics = Readonly<{
  captured: number;
  createdBuildings: number;
  createdUnits: number;
  damage: number;
  destroyedBuildings: number;
  destroyedUnits: number;
  lostBuildings: number;
  lostUnits: number;
  oneShots: number;
  rescuedUnits: number;
}>;

export type PlainPlayerStatistics = [
  captured: number,
  createdBuildings: number,
  createdUnits: number,
  damage: number,
  destroyedBuildings: number,
  destroyedUnits: number,
  lostBuildings: number,
  rescuedUnits: number,
  lostUnits: number,
  oneShots: number,
];

export const InitialPlayerStatistics = {
  captured: 0,
  createdBuildings: 0,
  createdUnits: 0,
  damage: 0,
  destroyedBuildings: 0,
  destroyedUnits: 0,
  lostBuildings: 0,
  lostUnits: 0,
  oneShots: 0,
  rescuedUnits: 0,
} as const;

export const PlayerStatisticsEntries = [
  'captured',
  'createdBuildings',
  'createdUnits',
  'damage',
  'destroyedBuildings',
  'destroyedUnits',
  'lostBuildings',
  'lostUnits',
  'rescuedUnits',
  'oneShots',
] as const;

export function decodePlayerStatistics(
  stats: PlainPlayerStatistics | null,
): PlayerStatistics {
  return {
    captured: stats?.[0] ?? InitialPlayerStatistics.captured,
    createdBuildings: stats?.[1] ?? InitialPlayerStatistics.createdBuildings,
    createdUnits: stats?.[2] ?? InitialPlayerStatistics.createdUnits,
    damage: stats?.[3] ?? InitialPlayerStatistics.damage,
    destroyedBuildings:
      stats?.[4] ?? InitialPlayerStatistics.destroyedBuildings,
    destroyedUnits: stats?.[5] ?? InitialPlayerStatistics.destroyedUnits,
    lostBuildings: stats?.[6] ?? InitialPlayerStatistics.lostBuildings,
    lostUnits: stats?.[7] ?? InitialPlayerStatistics.lostUnits,
    oneShots: stats?.[9] ?? InitialPlayerStatistics.oneShots,
    rescuedUnits: stats?.[8] ?? InitialPlayerStatistics.rescuedUnits,
  };
}

export function encodePlayerStatistics(
  stats: PlayerStatistics | null,
): PlainPlayerStatistics | null {
  return stats
    ? [
        stats.captured,
        stats.createdBuildings,
        stats.createdUnits,
        stats.damage,
        stats.destroyedBuildings,
        stats.destroyedUnits,
        stats.lostBuildings,
        stats.lostUnits,
        stats.rescuedUnits,
        stats.oneShots,
      ]
    : null;
}
