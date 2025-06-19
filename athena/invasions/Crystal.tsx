export enum Crystal {
  Power = 0,
  Help = 1,
  Phantom = 2,
  Command = 3,
  Memory = 4,
  Super = 5,
}

export const Crystals = [
  Crystal.Power,
  Crystal.Help,
  Crystal.Phantom,
  Crystal.Command,
  Crystal.Memory,
  Crystal.Super,
] as const;

export type CrystalList = ReadonlyArray<[Crystal, number]>;
export type CrystalMap = Map<Crystal, number>;

export const CrystalAttackEffect = 0.1;

export const CrystalCosts: Record<Crystal, number> = {
  [Crystal.Command]: 7,
  [Crystal.Help]: 3,
  [Crystal.Memory]: -1,
  [Crystal.Phantom]: 5,
  [Crystal.Power]: 2,
  [Crystal.Super]: -1,
};

export const MaxChaosStars: Record<Crystal, number> = {
  [Crystal.Command]: 35,
  [Crystal.Help]: 35,
  [Crystal.Memory]: 0,
  [Crystal.Phantom]: 40,
  [Crystal.Power]: 35,
  [Crystal.Super]: 0,
};
