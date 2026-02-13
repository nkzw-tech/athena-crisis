import { PlayerID } from '@deities/athena/map/Player.tsx';

export type ChaosStars = Map<PlayerID, number>;

export type PlainChaosStars = ReadonlyArray<readonly [PlayerID, number]>;

export function encodeChaosStars(chaosStars: ChaosStars): PlainChaosStars | null {
  return [...chaosStars].filter(([, stars]) => stars > 0);
}

export function decodeChaosStars(plainChaosStars: PlainChaosStars): ChaosStars {
  return new Map(plainChaosStars);
}

export function formatChaosStars(chaosStars: ChaosStars): string {
  return [...chaosStars].map(([playerID, stars]) => `${playerID}: ${stars}`).join(', ');
}
