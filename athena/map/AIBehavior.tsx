export enum AIBehavior {
  Attack = 0,
  Defense = 1,
  Stay = 2,
  Adaptive = 3,
  Passive = 4,
}

export const AIBehaviors: ReadonlySet<AIBehavior> = new Set([
  AIBehavior.Attack,
  AIBehavior.Defense,
  AIBehavior.Stay,
  AIBehavior.Adaptive,
  AIBehavior.Passive,
]);
