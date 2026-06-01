import { Barracks, BuildingInfo } from '@deities/athena/info/Building.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';

const hqSpriteX = new Map<PlayerID, number>([
  [1, 0],
  [2, 1],
  [3, 2],
  [4, 3],
  [5, 4],
  [6, 15],
  [7, 16],
  [8, 22],
]);

export default function getSpritePosition(
  info: BuildingInfo,
  player: PlayerID,
  biome: Biome,
  isVisible?: boolean,
) {
  if (info.isHQ() && !isVisible && biome !== Biome.Spaceship) {
    info = Barracks;
  }
  let { x, y } = info.sprite.position;

  const biomeStyle = info.sprite.biomeStyle?.get(biome);
  if (biomeStyle) {
    x += biomeStyle.x;
    y += biomeStyle.y;
  }

  if (info.isHQ() && player) {
    x += hqSpriteX.get(player) ?? 0;
  }

  return [x, y];
}
