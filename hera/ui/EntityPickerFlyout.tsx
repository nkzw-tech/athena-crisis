import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector, { VectorLike } from '@deities/athena/map/Vector.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { useCallback, useState } from 'react';
import BuildingTile from '../Building.tsx';
import Tick from '../Tick.tsx';
import { Actions, PlayerDetails } from '../Types.tsx';
import UnitTile from '../Unit.tsx';
import Flyout, { FlyoutItemWithHighlight, shouldPositionLeft } from './Flyout.tsx';

export default function EntityPickerFlyout({
  animationConfig,
  biome,
  building,
  firstPlayerID,
  onSelectBuilding,
  onSelectUnit,
  playerDetails,
  position,
  resetPosition,
  tileSize,
  unit,
  width,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  biome: Biome;
  building: Building;
  firstPlayerID: PlayerID;
  onSelectBuilding: () => void;
  onSelectUnit: () => void;
  playerDetails: PlayerDetails;
  position: Vector;
  resetPosition: Actions['resetPosition'];
  tileSize: number;
  unit: Unit;
  width: number;
  zIndex: number;
}) {
  const [direction, setDirection] = useState<VectorLike | null>(null);

  useInput(
    'navigate',
    useCallback(
      (event) => {
        event.preventDefault();
        const newDirection = { ...event.detail };
        if ((!direction || direction?.y === 0) && newDirection.y === 0) {
          const isLeft = shouldPositionLeft(position, width);
          if ((isLeft && newDirection.x === -1) || (!isLeft && newDirection.x === 1)) {
            newDirection.y = -1;
          }
        }
        setDirection(newDirection);
      },
      [direction, position, width],
    ),
    'menu',
  );

  const selected = direction?.y === -1 ? 'building' : direction?.y === 1 ? 'unit' : null;

  useInput(
    'accept',
    useCallback(
      (event) => {
        event.preventDefault();
        if (selected === 'building') {
          onSelectBuilding();
        } else if (selected === 'unit') {
          onSelectUnit();
        }
      },
      [onSelectBuilding, onSelectUnit, selected],
    ),
    'menu',
  );

  return (
    <Tick animationConfig={animationConfig}>
      <Flyout
        items={[
          <FlyoutItemWithHighlight
            highlight={selected === 'building'}
            icon={(highlight) => (
              <BuildingTile
                biome={biome}
                building={building}
                highlight={selected === 'building' || highlight}
                position={new SpriteVector(1, 1.5)}
                size={tileSize}
              />
            )}
            key="building"
            onClick={onSelectBuilding}
          >
            {building.info.name}
          </FlyoutItemWithHighlight>,
          <FlyoutItemWithHighlight
            highlight={selected === 'unit'}
            icon={(highlight) => (
              <UnitTile
                animationConfig={animationConfig}
                biome={biome}
                customSprite={playerDetails
                  .get(unit.player)
                  ?.equippedUnitCustomizations.get(unit.id)}
                firstPlayerID={firstPlayerID}
                highlightStyle={
                  selected === 'unit' || highlight ? (unit.canMove() ? 'move' : 'idle') : undefined
                }
                size={tileSize}
                tile={Plain}
                unit={unit}
              />
            )}
            key="unit"
            onClick={onSelectUnit}
          >
            {unit.info.name}
          </FlyoutItemWithHighlight>,
        ]}
        position={position}
        resetPosition={resetPosition}
        tileSize={tileSize}
        width={width}
        zIndex={zIndex}
      />
    </Tick>
  );
}
