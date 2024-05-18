import { Plain } from '@deities/athena/info/Tile.tsx';
import type { Biome } from '@deities/athena/map/Biome.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import { css } from '@emotion/css';
import React, { memo } from 'react';
import Tiles from '../../Tiles.tsx';

const vision = new Vision(1);

export default memo(function BiomeIcons({ biome }: { biome: Biome }) {
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
    <div className={biomeIconStyle}>
      <Tiles
        key={map.config.biome}
        map={map}
        paused
        style="clip"
        tileSize={TileSize}
        vision={vision}
      />
    </div>
  );
});

const biomeIconStyle = css`
  flex-shrink: 0;
  height: ${TileSize}px;
  image-rendering: pixelated;
  position: relative;
  width: ${TileSize}px;
  zoom: 1.5;
`;
