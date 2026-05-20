import convertBiome from '@deities/athena/lib/convertBiome.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { Fog } from '@deities/athena/map/PlainMap.tsx';
import demo1, { metadata as metadata1 } from '@deities/hermes/map-fixtures/demo-1.tsx';
import demo2, { metadata as metadata2 } from '@deities/hermes/map-fixtures/demo-2.tsx';
import randomEntry from '@nkzw/core/randomEntry.js';
import PlaygroundGame from './PlaygroundGame.tsx';

const biome =
  randomEntry([Biome.Grassland, Biome.Desert, Biome.Snow, Biome.Swamp, Biome.Volcano]) ||
  Biome.Grassland;

const [map, metadata] = randomEntry([
  [demo1, metadata1],
  [demo1, metadata1],
  [demo1, metadata1],
  [demo2, metadata2],
]) || [demo1, metadata1];
const currentDemoMap = convertBiome(
  map.copy({
    config: map.config.copy({
      fog: randomEntry([Fog.Standard, Fog.None, Fog.None, Fog.None, Fog.None]) || Fog.None,
    }),
  }),
  biome,
);

export default function PlaygroundDemoGame() {
  return <PlaygroundGame map={currentDemoMap} metadata={metadata} />;
}
