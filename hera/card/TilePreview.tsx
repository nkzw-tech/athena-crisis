import { BuildingHeight } from '@deities/athena/info/Building.tsx';
import { AnimationConfig, DefaultTileSize } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Vision from '@deities/athena/Vision.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { css, cx } from '@emotion/css';
import { ReactNode } from 'react';
import Decorators from '../Decorators.tsx';
import Tick from '../Tick.tsx';
import TileDecorators from '../TileDecorators.tsx';
import Tiles, { getTileSize } from '../Tiles.tsx';

const vector = vec(1, 1);
const vision = new Vision(1);

export default function TilePreview({
  children,
  map,
  size,
}: {
  children?: ReactNode;
  map: MapData;
  size?: BuildingHeight;
}) {
  const tileSize = getTileSize(map.config.biome);
  return (
    <div
      className={cx(
        mapContainerStyle,
        size === 'medium' && mediumContainerStyle,
        size === 'tall' && tallContainerStyle,
      )}
    >
      <Tick animationConfig={AnimationConfig} className={mapStyle}>
        <Tiles map={map} style="clip" tileSize={tileSize} vision={vision} />
        <Decorators map={map} tileSize={tileSize} />
        <TileDecorators
          getLayer={() => 0}
          isVisible
          map={map}
          tileSize={tileSize}
          vector={vector}
          vision={vision}
        />
        {children}
      </Tick>
    </div>
  );
}

const mapContainerStyle = css`
  height: ${DefaultTileSize}px;
  position: relative;
  zoom: 2;
  width: ${DefaultTileSize}px;

  ${Breakpoints.sm} {
    margin: unset;
    position: absolute;
    right: 2px;
    top: 2px;
    transform-origin: right top;
    zoom: 4;
  }

  ${Breakpoints.lg} {
    zoom: 5;
  }

  ${Breakpoints.xl} {
    zoom: 6;
  }
`;

const mapStyle = css`
  height: ${DefaultTileSize}px;
  width: ${DefaultTileSize}px;
`;

const mediumContainerStyle = css`
  margin-top: ${DefaultTileSize / 2}px;

  ${Breakpoints.sm} {
    top: ${DefaultTileSize}px;
  }
`;

const tallContainerStyle = css`
  margin-top: ${DefaultTileSize / 1.25}px;

  ${Breakpoints.sm} {
    top: ${DefaultTileSize * 1.2}px;
  }
`;
