import { Barracks, BuildingInfo } from '@deities/athena/info/Building.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';

const hqOffset = 9;

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
    x += player >= 6 ? hqOffset + player : player - 1;
  }

  return [x, y];
}
