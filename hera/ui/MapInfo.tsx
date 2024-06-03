import {
  getTileInfo,
  TileField,
  TileInfo,
} from '@deities/athena/info/Tile.tsx';
import { getLargeAttributeRangeValue } from '@deities/athena/lib/getAttributeRange.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Building from '@deities/athena/map/Building.tsx';
import {
  AnimationConfig,
  DoubleSize,
  MaxHealth,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData, {
  ModifierField,
  SizeVector,
} from '@deities/athena/MapData.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints, { lg } from '@deities/ui/Breakpoints.tsx';
import cssVar, {
  applyVar,
  CSSVariables,
  insetStyle,
} from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Ammo from '@deities/ui/icons/Ammo.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Supply from '@deities/ui/icons/Supply.tsx';
import Portal from '@deities/ui/Portal.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import React, { useEffect, useMemo, useRef } from 'react';
import BuildingTile from '../Building.tsx';
import CoverRange from '../card/lib/CoverRange.tsx';
import { LargeRange } from '../card/Range.tsx';
import Map from '../Map.tsx';
import Tick from '../Tick.tsx';
import { State } from '../Types.tsx';
import UnitTile from '../Unit.tsx';
import maybeFade from './lib/maybeFade.tsx';

const Tile = ({
  biome,
  field,
  modifier,
  tileSize,
  vector,
  vision,
}: {
  biome: Biome;
  field: TileField;
  modifier: ModifierField;
  tileSize: number;
  vector: Vector;
  vision: VisionT;
}) => {
  const tile = typeof field === 'number' ? field : field[1];
  const [map] = useMemo<[MapData, Vector]>(
    () => [
      MapData.createMap({
        config: { biome },
        map: [field],
        modifiers: [modifier],
        size: new SizeVector(1, 1),
      }),
      // Vector is required to force a re-render on a different field.
      vector,
    ],
    [biome, field, modifier, vector],
  );
  if (tile != null && modifier != null) {
    const info = getTileInfo(tile);
    const {
      configuration: { cover },
    } = info;
    return (
      <Box blur className={boxStyle}>
        <div
          style={{
            height: `${tileSize * 1.5}px`,
            width: `${tileSize * 1.5}px`,
          }}
        >
          <div className={mapStyle}>
            <Map
              animationConfig={AnimationConfig}
              behavior={null}
              getLayer={() => 1}
              map={map}
              style="clip"
              tileSize={tileSize}
              vision={vision}
            />
          </div>
        </div>
        <div className={textStyle}>
          <div>{info.name}</div>
          <Stack gap nowrap start>
            <fbt desc="Tile cover">Cover: </fbt>
            <div className={rangeStyle}>
              <LargeRange
                end
                value={getLargeAttributeRangeValue(CoverRange, cover)}
              />
            </div>
          </Stack>
        </div>
      </Box>
    );
  }
  return null;
};

const renderUnit = (
  unit: Unit | undefined,
  tile: TileInfo,
  biome: Biome,
  firstPlayerID: PlayerID,
  tileSize: number,
  animationConfig: AnimationConfig,
) => {
  if (unit) {
    const { info } = unit;
    const ammo =
      info.attack.weapons &&
      [...info.attack.weapons.values()].map((weapon) =>
        weapon.supply
          ? String(unit.ammo?.get(weapon.id) || 0) + '/' + weapon.supply
          : '∞',
      );
    return (
      <Box blur className={cx(boxStyle, unitStyle)}>
        <UnitTile
          animationConfig={animationConfig}
          biome={biome}
          firstPlayerID={firstPlayerID}
          size={tileSize}
          tile={tile}
          unit={unit}
        />
        <div className={textStyle}>
          <div>{info.name}</div>
          <Stack gap>
            <Stack start>
              <Icon className={iconStyle} icon={Supply} />
              {unit.fuel}/{info.configuration.fuel}
            </Stack>
            {ammo && (
              <Stack start>
                <Icon className={iconStyle} icon={Ammo} />
                {ammo.join(', ')}
              </Stack>
            )}
          </Stack>
        </div>
      </Box>
    );
  }
};

const renderBuilding = (
  building: Building | undefined,
  biome: Biome,
  tileSize: number,
  isVisible: boolean,
) => {
  if (building) {
    return (
      <Box
        blur
        className={cx(
          boxStyle,
          buildingStyle,
          building.label != null && buildingWithLabelStyle,
        )}
      >
        <BuildingTile
          biome={biome}
          building={building}
          isVisible={isVisible}
          position={vec(1, 2)}
          size={tileSize}
        />
        <div className={textStyle}>
          <div>{building.info.name}</div>
          <Stack start>
            <Icon className={iconStyle} icon={Heart} />
            {building.health}/{MaxHealth}
          </Stack>
        </div>
      </Box>
    );
  }
};

export default function MapInfo({
  animationConfig,
  hide,
  inlineUI,
  inset = 0,
  leftOffset,
  map,
  position,
  replayState,
  showCursor,
  tileSize,
  vision,
}: State & { hide?: boolean; inset?: number; leftOffset?: true }) {
  const isLeft = useRef(true);
  useEffect(() => {
    const listener = (event: MouseEvent) => {
      const left =
        window.innerWidth >= lg || event.clientX > window.innerWidth / 2.5;
      if (left !== isLeft.current) {
        isLeft.current = left;
        document.documentElement.style.setProperty(
          cssVar('mouse-position-left'),
          left ? '0px' : 'auto',
        );
        document.documentElement.style.setProperty(
          cssVar('mouse-position-right'),
          left ? 'auto' : DoubleSize + 20 + 'px',
        );
      }
    };
    document.addEventListener('mousemove', listener);
    return () => {
      document.removeEventListener('mousemove', listener);
    };
  }, []);

  if (!position || !showCursor || replayState.isReplaying) {
    return null;
  }

  const isVisible = vision.isVisible(map, position);
  const index = map.getTileIndex(position);

  const content = (
    <Tick animationConfig={animationConfig}>
      <div
        className={cx(maybeFade(hide), style)}
        style={
          inlineUI
            ? undefined
            : {
                ...insetStyle(inset),
                [vars.set('left-offset')]: leftOffset
                  ? DoubleSize + 20 + 'px '
                  : 'env(safe-area-inset-left)',
              }
        }
      >
        <Tile
          biome={map.config.biome}
          field={map.map[index]}
          modifier={map.modifiers[index]}
          tileSize={tileSize}
          vector={position}
          vision={vision}
        />
        {renderBuilding(
          map.buildings.get(position),
          map.config.biome,
          tileSize,
          isVisible,
        )}
        {isVisible &&
          renderUnit(
            map.units.get(position),
            map.getTileInfo(position),
            map.config.biome,
            map.getFirstPlayerID(),
            tileSize,
            animationConfig,
          )}
      </div>
    </Tick>
  );

  return inlineUI ? (
    <div className={inlineStyle}>{content}</div>
  ) : (
    <Portal>{content}</Portal>
  );
}

const vars = new CSSVariables<'left-offset' | 'width'>('mi');
const left = `calc(
  ${applyVar('inset')} + ${applyVar('mouse-position-left')} +
    ${vars.apply('left-offset')}
);`;
const textPosition = DoubleSize + 4;

const inlineStyle = css`
  inset: 0;
  pointer-events: none;
  position: absolute;
  transform: translate3d(0, 96px, 0);
  zoom: 0.333334;
`;

const style = css`
  ${vars.set('left-offset', '0px')}
  bottom: ${applyVar('inset')};
  display: flex;
  pointer-events: none;
  position: fixed;
  z-index: calc(${applyVar('inset-z')} + 1);
  gap: 14px;

  flex-direction: column;
  left: calc(${applyVar('inset')} + ${vars.apply('left-offset')});

  ${Breakpoints.sm} {
    gap: 24px;
    left: ${left};
    right: calc(
      ${applyVar('inset')} + ${applyVar('mouse-position-right')} +
        env(safe-area-inset-right)
    );
    flex-direction: row;
  }
`;

const boxStyle = css`
  ${vars.set('width', '240px')}

  font-size: 0.9em;
  height: ${DoubleSize}px;
  line-height: 1.1em;
  padding: 0 4px;
  position: relative;
  width: ${vars.apply('width')};

  > div:nth-child(1) {
    align-self: center;
    zoom: 1.5;
  }

  ${Breakpoints.sm} {
    align-self: flex-end;
  }
`;

const unitStyle = css`
  ${vars.set('width', '260px')}
`;

const buildingStyle = css`
  > div:nth-child(1) {
    margin-top: -${TileSize - 3}px;
  }
`;

const buildingWithLabelStyle = css`
  > div:nth-child(1),
  > div:nth-child(2) {
    margin-top: -${TileSize - 3}px;
  }

  > div:nth-child(2) {
    zoom: 1.5;
  }
`;

const mapStyle = css`
  margin-top: 3px;
`;

const textStyle = css`
  left: ${textPosition}px;
  position: absolute;
  top: 3px;

  > div {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    width: calc(${vars.apply('width')} - ${textPosition}px);
  }
`;

const iconStyle = css`
  margin: 3px 4px 0 0;
`;

const rangeStyle = css`
  margin-top: 2px;
`;
