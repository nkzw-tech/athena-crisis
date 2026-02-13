import { Plain } from '@deities/athena/info/Tile.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { TransportedUnit } from '@deities/athena/map/Unit.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { css } from '@emotion/css';
import { useMemo } from 'react';
import Medal from './Medal.tsx';
import { PlayerDetails } from './Types.tsx';
import UnitTile from './Unit.tsx';

export default function TransportedUnitTile({
  animationConfig,
  highlight,
  map,
  playerDetails,
  tileSize,
  unit,
}: {
  animationConfig: AnimationConfig;
  highlight?: boolean;
  map: MapData;
  playerDetails: PlayerDetails;
  tileSize: number;
  unit: TransportedUnit;
}) {
  const deployedUnit = useMemo(() => unit.deploy(), [unit]);
  return (
    <div className={relativeStyle}>
      <UnitTile
        animationConfig={animationConfig}
        biome={map.config.biome}
        customSprite={playerDetails.get(unit.player)?.equippedUnitCustomizations.get(unit.id)}
        firstPlayerID={map.getFirstPlayerID()}
        highlightStyle={highlight ? 'idle' : undefined}
        size={tileSize}
        tile={Plain}
        unit={deployedUnit}
      />
      {unit.isLeader() && (
        <div className={leaderIconStyle}>
          <Medal player={unit.player} zoom={1} />
        </div>
      )}
    </div>
  );
}

const relativeStyle = css`
  position: relative;
`;

const leaderIconStyle = css`
  position: absolute;
  right: 0;
  top: 1px;
`;
