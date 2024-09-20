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
export const PhantomCrystal = Crystal.Red;
export const CommandCrystal = Crystal.Purple;

export const CrystalAttackEffect = 0.1;

export const CrystalCosts: Record<Crystal, number> = {
  [CommandCrystal]: 7,
  [HelpCrystal]: 3,
  [PhantomCrystal]: 5,
  [PowerCrystal]: 2,
  [Crystal.Gold]: -1,
  [Crystal.Gray]: -1,
};

export const CrystalChaosStars: Record<Crystal, number> = {
  [CommandCrystal]: 10,
  [HelpCrystal]: 2,
  [PhantomCrystal]: 15,
  [PowerCrystal]: 1,
  [Crystal.Gold]: 0,
  [Crystal.Gray]: 0,
};
