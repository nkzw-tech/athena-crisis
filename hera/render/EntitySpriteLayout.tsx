export const UnitSpriteLayout = {
  anchor: { x: 4, y: 8 },
  entitySize: 24,
  frameSize: 32,
  spawnOffset: 2,
} as const;

export const BuildingSpriteLayout = {
  anchor: { x: 0, y: 24 },
  atlasCellSize: 24,
  constructionRise: 4,
  crane: { height: 24, width: 12, x: 12, y: 0 },
  entitySize: 24,
  frameHeight: 48,
  frameWidth: 24,
  shadow: { height: 24, width: 24, x: 0, y: 24 },
} as const;
