export const DecoratorSpriteLayout = {
  anchor: { x: 13, y: 24 },
  frameSize: 24,
} as const;

export const TileDecoratorSpriteLayout = {
  anchor: { x: 12, y: 24 },
  frameSize: 24,
  overlap: 3,
} as const;

export const MessageSpriteLayout = {
  anchor: { x: 12, y: 10 },
  frameSize: 24,
} as const;
