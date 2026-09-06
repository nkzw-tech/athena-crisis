import { Plain } from '@deities/athena/info/Tile.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import { css } from '@emotion/css';
import { memo } from 'react';
import Tiles, { getTileSize } from '../../Tiles.tsx';

const vision = new Vision(1);

export default memo(function BiomeIcons({ biome }: { biome: Biome }) {
  const tileSize = getTileSize(biome);
  const map = MapData.createMap({
    config: { biome },
    map: [Plain.id],
    modifiers: [0],
    size: {
      height: 1,
      width: 1,
    },
  });
  return (
    <div className={biomeIconStyle} style={{ height: tileSize, width: tileSize }}>
      <Tiles
        key={map.config.biome}
        map={map}
        paused
        style="clip"
        tileSize={tileSize}
        vision={vision}
      />
    </div>
  );
});

const biomeIconStyle = css`
  flex-shrink: 0;
  image-rendering: pixelated;
  position: relative;
  zoom: 1.5;
`;
