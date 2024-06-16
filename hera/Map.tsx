import { prepareSprites } from '@deities/art/Sprites.tsx';
import { BuildingInfo } from '@deities/athena/info/Building.tsx';
import { DecoratorInfo } from '@deities/athena/info/Decorator.tsx';
import { MovementType } from '@deities/athena/info/MovementType.tsx';
import { TileInfo } from '@deities/athena/info/Tile.tsx';
import { UnitInfo, Weapon } from '@deities/athena/info/Unit.tsx';
import matchesActiveType from '@deities/athena/lib/matchesActiveType.tsx';
import BuildingT from '@deities/athena/map/Building.tsx';
import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import UnitT from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import { css, cx } from '@emotion/css';
import ImmutableMap from '@nkzw/immutable-map';
import Images from 'athena-crisis:images';
// eslint-disable-next-line @deities/no-lazy-import
import React, { lazy } from 'react';
import Building from './Building.tsx';
import Decorators from './Decorators.tsx';
import Fog from './Fog.tsx';
import {
  BuildingDescriptionMap,
  BuildingMap,
  DecoratorMap,
  MovementTypeMap,
  TileDescriptionMap,
  TileMap,
  UnitCharacterDescriptionMap,
  UnitDescriptionMap,
  UnitMap,
  WeaponMap,
} from './i18n/EntityMap.tsx';
import injectTranslation from './i18n/injectTranslation.tsx';
import {
  Animation,
  Animations,
  isBuildingAnimation,
  isUnitAnimation,
} from './MapAnimations.tsx';
import { RadiusInfo, RadiusType } from './Radius.tsx';
import Tick from './Tick.tsx';
import TileDecorators from './TileDecorators.tsx';
import Tiles, { TileStyle } from './Tiles.tsx';
import {
  GetLayerFunction,
  MapBehavior,
  RequestFrameFunction,
  TimerFunction,
} from './Types.tsx';
import ErrorOverlay, { SpriteLoadError } from './ui/ErrorOverlay.tsx';
import Unit from './Unit.tsx';

injectTranslation(BuildingInfo, BuildingMap);
injectTranslation(BuildingInfo, BuildingDescriptionMap, [
  'description',
  'internalDescription',
]);
injectTranslation(DecoratorInfo, DecoratorMap);
injectTranslation(TileInfo, TileMap);
injectTranslation(TileInfo, TileDescriptionMap, [
  'description',
  'internalDescription',
]);
injectTranslation(UnitInfo, UnitMap);
injectTranslation(UnitInfo, UnitDescriptionMap, [
  'description',
  'internalDescription',
]);
injectTranslation(UnitInfo, UnitCharacterDescriptionMap, [
  'characterDescription',
  'internalCharacterDescription',
]);
injectTranslation(Weapon, WeaponMap);
injectTranslation(MovementType, MovementTypeMap);

const MapComponent = ({
  animationConfig,
  animations,
  attackable,
  behavior,
  className,
  extraUnits,
  fogStyle,
  getLayer,
  map,
  onAnimationComplete = () => void 0,
  paused,
  radius,
  renderEntities = true,
  requestFrame = requestAnimationFrame,
  scheduleTimer,
  selectedBuilding,
  selectedPosition,
  selectedUnit,
  style = 'none',
  tileSize,
  vision,
}: {
  animationConfig: AnimationConfig;
  animations?: Animations;
  attackable?: ReadonlyMap<Vector, RadiusItem> | null;
  behavior: MapBehavior | null;
  className?: string;
  extraUnits?: ImmutableMap<Vector, UnitT>;
  fogStyle?: 'soft' | 'hard';
  getLayer: GetLayerFunction;
  map: MapData;
  onAnimationComplete?: (position: Vector, animation: Animation) => void;
  paused?: boolean;
  radius?: RadiusInfo | null;
  renderEntities?: boolean;
  requestFrame?: RequestFrameFunction;
  scheduleTimer?: TimerFunction;
  selectedBuilding?: BuildingT | null;
  selectedPosition?: Vector | null;
  selectedUnit?: UnitT | null;
  style?: TileStyle;
  tileSize: number;
  vision: VisionT;
}) => {
  const { biome } = map.config;
  const activeUnitTypes = map.getActiveUnitTypes();

  const canAttackEntity = (entity: Entity) =>
    selectedUnit?.getAttackWeapon(entity) &&
    map.isOpponent(selectedUnit, entity);

  return (
    <div className={cx(pixelatedStyle, paused && pausedStyle, className)}>
      <Tiles
        map={map}
        paused={paused}
        renderEntities={renderEntities}
        style={style}
        tileSize={tileSize}
        vision={vision}
      />
      <Decorators map={map} paused={paused} tileSize={tileSize} />
      {renderEntities && (
        <Tick animationConfig={animationConfig} paused={paused}>
          {map.reduceEachField<Array<JSX.Element>>((list, vector) => {
            const animation = animations?.get(vector);
            const building = map.buildings.get(vector);
            const unit = map.units.get(vector);
            const extraUnit = extraUnits?.get(vector);
            const vectorKey = String(vector);
            const isVisible = vision.isVisible(map, vector);
            const isSelected = selectedPosition?.equals(vector);
            const hasRadius = radius?.fields.has(vector);
            const outline =
              (unit || building || extraUnit) &&
              !!(
                radius &&
                ((hasRadius &&
                  (radius.type === RadiusType.Attackable ||
                    radius.type === RadiusType.Sabotage ||
                    radius.type === RadiusType.Defense ||
                    radius.type === RadiusType.Rescue ||
                    radius.type === RadiusType.Highlight)) ||
                  (attackable?.has(vector) && !hasRadius))
              );

            if (building) {
              const up = vector.up();
              const hasUnitAbove =
                (building.info.sprite.size === 'medium' ||
                  building.info.sprite.size === 'tall') &&
                vision.isVisible(map, up) &&
                (map.units.has(up) || extraUnits?.has(up));
              list.push(
                <Building
                  absolute
                  animation={
                    isBuildingAnimation(animation) ? animation : undefined
                  }
                  animationConfig={animationConfig}
                  biome={map.config.biome}
                  building={building}
                  fade={
                    hasUnitAbove ||
                    (radius && hasRadius && radius.fields.has(up))
                  }
                  highlight={!!(isSelected && selectedBuilding)}
                  isVisible={isVisible}
                  key={`b${vectorKey}`}
                  maybeOutline={
                    outline ||
                    (hasRadius && radius?.type === RadiusType.Attackable)
                  }
                  outline={
                    !!(
                      outline &&
                      (!radius.focus || radius.focus === 'building') &&
                      (!selectedUnit || canAttackEntity(building))
                    )
                  }
                  position={vector}
                  requestFrame={requestFrame}
                  scheduleTimer={scheduleTimer}
                  size={tileSize}
                  zIndex={getLayer(vector.y, 'building')}
                />,
              );
            }

            list.push(
              <TileDecorators
                getLayer={getLayer}
                isVisible={isVisible}
                key={`d${vectorKey}`}
                map={map}
                radius={radius}
                tileSize={tileSize}
                vector={vector}
                vision={vision}
              />,
            );

            if (extraUnit && isVisible) {
              list.push(
                <Unit
                  absolute
                  animationConfig={animationConfig}
                  biome={biome}
                  dim={unit ? 'flip' : 'dim'}
                  firstPlayerID={map.getFirstPlayerID()}
                  getLayer={getLayer}
                  key={`eu${extraUnit.id}-${vectorKey}`}
                  onAnimationComplete={onAnimationComplete}
                  position={vector}
                  requestFrame={requestFrame}
                  scheduleTimer={scheduleTimer}
                  size={tileSize}
                  tile={map.getTileInfo(vector)}
                  unit={extraUnit}
                />,
              );
            }

            if (
              unit &&
              (isVisible ||
                animation?.type === 'move' ||
                animation?.type === 'unitExplosion')
            ) {
              const outlineUnit =
                outline && (!radius.focus || radius.focus === 'unit');
              const power = matchesActiveType(
                activeUnitTypes.get(unit.player),
                unit,
                vector,
              );
              list.push(
                <Unit
                  absolute
                  animation={isUnitAnimation(animation) ? animation : undefined}
                  animationConfig={animationConfig}
                  animationKey={vector}
                  biome={biome}
                  direction={
                    animation?.type === 'explosion'
                      ? animation.direction
                      : undefined
                  }
                  firstPlayerID={map.getFirstPlayerID()}
                  getLayer={getLayer}
                  highlightStyle={
                    isSelected && selectedUnit
                      ? behavior?.type === 'menu' || behavior?.type === 'null'
                        ? behavior?.type === 'null'
                          ? 'idle-null'
                          : 'idle'
                        : 'move'
                      : outlineUnit && radius.type === RadiusType.Highlight
                        ? 'idle'
                        : undefined
                  }
                  key={`u${unit.id}-${vectorKey}`}
                  maybeOutline={
                    !!(
                      outline ||
                      (hasRadius &&
                        radius &&
                        (radius.type === RadiusType.Defense ||
                          radius.type === RadiusType.Rescue ||
                          radius.type === RadiusType.Attackable ||
                          radius.type === RadiusType.Sabotage))
                    )
                  }
                  onAnimationComplete={onAnimationComplete}
                  outline={
                    outlineUnit
                      ? radius.type === RadiusType.Defense
                        ? 'defense'
                        : radius.type === RadiusType.Rescue
                          ? 'rescue'
                          : radius.type === RadiusType.Sabotage
                            ? 'sabotage'
                            : radius.type !== RadiusType.Highlight
                              ? canAttackEntity(unit)
                                ? 'attack'
                                : undefined
                              : undefined
                      : undefined
                  }
                  position={vector}
                  power={power}
                  requestFrame={requestFrame}
                  scheduleTimer={scheduleTimer}
                  size={tileSize}
                  tile={map.getTileInfo(vector)}
                  unit={unit}
                />,
              );
            }
            return list;
          }, [])}
        </Tick>
      )}
      <Fog
        fogStyle={fogStyle}
        map={map}
        style={style}
        tileSize={tileSize}
        vision={vision}
        zIndex={getLayer(map.size.height, 'top') + 1}
      />
    </div>
  );
};

const pixelatedStyle = css`
  image-rendering: pixelated;
`;

const pausedStyle = css`
  * {
    animation-play-state: paused !important;
  }
`;

// Keep images in memory forever.
const imageCache = [];
let loaderPromise: Promise<{ default: typeof MapComponent }> | null = null;
const load = () => {
  return (
    loaderPromise ||
    (loaderPromise = Promise.all([
      prepareSprites(),
      ...Images.map(
        (path) =>
          new Promise((resolve) => {
            const image = new Image();
            imageCache.push(image);
            image.onload = resolve;
            image.src = path;
          }),
      ),
    ])
      .then(() => ({ default: MapComponent }))
      .catch((error) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error(error);
        }
        const spriteLoadError = new SpriteLoadError(error.message);
        return {
          default: (props) => (
            <>
              <MapComponent {...props} renderEntities={false} />
              <ErrorOverlay error={spriteLoadError} />
            </>
          ),
        };
      }))
  );
};

(window.requestIdleCallback || requestAnimationFrame)(load);

export default lazy(load);
