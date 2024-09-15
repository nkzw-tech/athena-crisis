export enum Crystal {
  Green = 0,
  Blue = 1,
  Red = 2,
  Purple = 3,
  Gold = 5,
  Gray = 4,
}

export const Crystals = [
  Crystal.Green,
  Crystal.Blue,
  Crystal.Red,
  Crystal.Purple,
  Crystal.Gray,
  Crystal.Gold,
] as const;

export type CrystalList = ReadonlyArray<[Crystal, number]>;
export type CrystalMap = Map<Crystal, number>;

export const PowerCrystal = Crystal.Green;
export const HelpCrystal = Crystal.Blue;
export const ChaosCrystal = Crystal.Red;
export const CommandCrystal = Crystal.Purple;

export const CrystalAttackEffect = 0.1;
export const RedCrystalChaosStars = 3;
export const PurpleCrystalChaosStars = 5;
