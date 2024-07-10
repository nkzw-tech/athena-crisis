declare module 'athena-crisis:images' {
  export const AttackSprites: Record<AttackSprite, string>;
  export const Tiles0: HTMLImageElement;
  export const Tiles1: HTMLImageElement;
  export const Tiles2: HTMLImageElement;
  export const Tiles3: HTMLImageElement;
  export const Tiles4: HTMLImageElement;
  export const Tiles5: HTMLImageElement;
  export const Tiles6: HTMLImageElement;
  export const Sprites: {
    Crane: string;
    Cursor: string;
    Delete: string;
    Explosion: string;
    Fireworks: string;
    Gamepad: string;
    Heal: string;
    Noise: string;
    Sabotage: string;
    Structures: string;
    TileDecorators: string;
    UnitIcons: string;
    Upgrade: string;
  };
  export const ShadowImages: ReadonlyMap<string, string>;

  const Images: ReadonlyArray<string>;
  export default Images;
}
