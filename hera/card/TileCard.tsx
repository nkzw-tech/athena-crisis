import { DecoratorInfo } from '@deities/athena/info/Decorator.tsx';
import { MovementTypes } from '@deities/athena/info/MovementType.tsx';
import {
  getAllTiles,
  Plain,
  TileInfo,
  tilesToTileMap,
} from '@deities/athena/info/Tile.tsx';
import { mapUnitsWithContentRestriction } from '@deities/athena/info/Unit.tsx';
import getAttributeRange, {
  getAttributeRangeValue,
} from '@deities/athena/lib/getAttributeRange.tsx';
import getBiomeUnitRestrictions from '@deities/athena/lib/getBiomeUnitRestrictions.tsx';
import { singleTilesToModifiers } from '@deities/athena/lib/singleTilesToModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  DecoratorsPerSide,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { numberToPlayerID, PlayerID } from '@deities/athena/map/Player.tsx';
import { decodeDecorators } from '@deities/athena/map/Serialization.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData, { ModifierField } from '@deities/athena/MapData.tsx';
import AdaptiveStack from '@deities/ui/AdaptiveStack.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import Hidden from '@iconify-icons/pixelarticons/hidden.js';
import Reply from '@iconify-icons/pixelarticons/reply.js';
import Visible from '@iconify-icons/pixelarticons/visible.js';
import groupBy from '@nkzw/core/groupBy.js';
import isPresent from '@nkzw/core/isPresent.js';
import sortBy from '@nkzw/core/sortBy.js';
import { memo, useMemo } from 'react';
import Decorators from '../Decorators.tsx';
import getAnyUnitTile from '../lib/getAnyUnitTile.tsx';
import getCoverName from '../lib/getCoverName.tsx';
import Tick from '../Tick.tsx';
import { AttributeGridBox } from './AttributeGrid.tsx';
import CardTitle, { CardInfoHeading } from './CardTitle.tsx';
import CoverRange from './lib/CoverRange.tsx';
import tileFieldHasDecorator from './lib/tileFieldHasDecorator.tsx';
import MovementBox from './MovementBox.tsx';
import Range, { LargeRange } from './Range.tsx';
import TilePreview from './TilePreview.tsx';

const tiles = getAllTiles();
const visionRange = getAttributeRange(
  tiles,
  ({ configuration: { vision } }) => vision,
  1,
);

export default memo(function TileCard({
  decorators,
  map,
  modifierField,
  player,
  tile,
}: {
  decorators?: ReadonlyMap<Vector, DecoratorInfo> | null;
  map: MapData;
  modifierField?: ModifierField;
  player: PlayerID;
  tile: TileInfo;
}) {
  const {
    configuration: { cover, vision },
  } = tile;
  const { biome } = map.config;
  const previewMap = useMemo(() => {
    const map = MapData.createMap({
      config: {
        biome,
      },
      decorators: decorators?.size
        ? [...decorators].map(([{ x, y }, { id }]) => [x, y, id])
        : [],
      map: tilesToTileMap([tile]),
      modifiers: [modifierField || 0],
    });
    return modifierField ? map : singleTilesToModifiers(map);
  }, [biome, decorators, modifierField, tile]);
  const coverName = getCoverName(cover);

  return (
    <>
      <Stack alignCenter gap nowrap start>
        <TilePreview
          map={previewMap}
          size={tile.style.decorator ? 'tall' : undefined}
        />
        <Stack gap start vertical>
          <CardTitle>{tile.name}</CardTitle>
        </Stack>
      </Stack>
      <Stack gap={16} vertical>
        <AttributeGridBox>
          {tile.isInaccessible() ? (
            <>
              <Stack nowrap start>
                <Icon horizontalFlip icon={Reply} />
                <fbt desc="Label for movement">Movement</fbt>
              </Stack>
              <div>
                <fbt desc="Label for blocked movement">Blocked</fbt>
              </div>
              <div />
            </>
          ) : null}
          <Stack nowrap start>
            <Icon icon={Hidden} />
            <fbt desc="Label for cover">Cover</fbt>
          </Stack>
          <div>
            <span className={smallCoverStyle}>{cover}</span>
            <span className={largeCoverStyle}>
              {coverName ? `${coverName}: ${cover}` : cover}
            </span>
          </div>
          <LargeRange end value={getAttributeRangeValue(CoverRange, cover)} />

          {vision === -1 ? (
            <>
              <Stack nowrap start>
                <Icon icon={Visible} />
                <fbt desc="Label for vision">Vision</fbt>
              </Stack>
              <div>
                <fbt desc="Label for blocked vision">Blocked</fbt>
              </div>
              <div />
            </>
          ) : (
            <>
              <Stack nowrap start>
                <Icon icon={Visible} />
                <div className={maxWidthStyle}>
                  <fbt desc="Label for vision cost">Vision Cost</fbt>
                </div>
              </Stack>
              <div>{vision}</div>
              <Range
                end
                invert
                value={getAttributeRangeValue(visionRange, vision)}
              />
            </>
          )}
        </AttributeGridBox>
        <Stack gap vertical>
          <CardInfoHeading>
            <fbt desc="About tile headline">About</fbt>
          </CardInfoHeading>
          <p>{tile.description}</p>
        </Stack>
        <TileMovement biome={biome} map={map} player={player} tile={tile} />
        <TileDecorators decoratorMap={decorators} map={previewMap} />
      </Stack>
    </>
  );
});

const TileMovement = memo(function TileMovement({
  biome,
  map,
  player,
  tile,
}: {
  biome: Biome;
  map: MapData;
  player: PlayerID;
  tile: TileInfo;
}) {
  const allSkills = useMemo(
    () => new Set(map.getPlayers().flatMap(({ skills }) => [...skills])),
    [map],
  );

  if (tile.isInaccessible()) {
    return null;
  }

  const biomeUnitRestrictions = getBiomeUnitRestrictions(biome);
  const availableUnits = mapUnitsWithContentRestriction(
    (unit) => unit.create(player),
    allSkills,
  ).filter((unit) => !biomeUnitRestrictions?.has(unit.info.type));
  const movementTypes = sortBy(
    [
      ...groupBy(Object.values(MovementTypes), (movementType) =>
        tile.getMovementCost({ movementType }),
      ),
    ],
    ([cost]) => (cost === -1 ? Number.POSITIVE_INFINITY : cost),
  ).map(([cost, movementTypes]) => [cost, new Set(movementTypes)] as const);

  return (
    <Tick animationConfig={AnimationConfig}>
      <Stack gap vertical>
        <CardInfoHeading>
          <fbt desc="Headline for unit movement information">Unit Movement</fbt>
        </CardInfoHeading>
        <Stack gap start>
          {movementTypes
            .map(([cost, movementTypes]) => {
              const units = [
                ...groupBy(
                  availableUnits.filter((unit) =>
                    movementTypes.has(unit.info.movementType),
                  ),
                  (unit) => unit.info.movementType,
                ).values(),
              ];

              return units.length ? (
                <MovementBox
                  biome={biome}
                  cost={cost}
                  key={cost}
                  size={
                    cost !== -1 && tileFieldHasDecorator(tile.id, biome)
                      ? 'tall'
                      : undefined
                  }
                  tiles={units.map(([unit]) =>
                    cost === -1 ? getAnyUnitTile(unit.info) || Plain : tile,
                  )}
                  unitGroups={units}
                />
              ) : null;
            })
            .filter(isPresent)}
        </Stack>
      </Stack>
    </Tick>
  );
});

const TileDecorators = memo(function TileDecorators({
  decoratorMap,
  map,
}: {
  decoratorMap?: ReadonlyMap<Vector, DecoratorInfo> | null;
  map: MapData;
}) {
  if (!decoratorMap?.size) {
    return null;
  }

  const decorators = [...decoratorMap.values()];
  const decoratorCount = new Map<number, number>();
  for (const decorator of decorators) {
    const count = decoratorCount.get(decorator.id) || 0;
    decoratorCount.set(decorator.id, count + 1);
  }

  return (
    <Stack gap vertical>
      <CardInfoHeading>
        <fbt desc="Decorations headline">Decorations</fbt>
      </CardInfoHeading>
      <AdaptiveStack gap start>
        {[...new Set(decorators)].map((decorator) => {
          const count = decoratorCount.get(decorator.id) || 1;
          const decoratorColor = numberToPlayerID(decorator.id);
          return (
            <Stack
              alignCenter
              className={tagStyle}
              gap
              key={decorator.id}
              start
              style={{
                backgroundColor: getColor(decoratorColor, 0.2),
                color: getColor(decoratorColor),
              }}
            >
              <Decorators
                map={map.copy({
                  decorators: decodeDecorators(map.size, [
                    [DecoratorsPerSide - 2, DecoratorsPerSide, decorator.id],
                  ]),
                })}
                tileSize={TileSize}
              />
              <div className={textStyle}>
                {decorator.name}
                {count > 1 ? ` ${count}x` : ``}
              </div>
            </Stack>
          );
        })}
      </AdaptiveStack>
    </Stack>
  );
});

const tagStyle = css`
  ${clipBorder(2)}

  height: ${TileSize + 8}px;
  image-rendering: pixelated;
  padding: 3px 6px 4px;
  position: relative;
  width: fit-content;
`;

const textStyle = css`
  margin-left: ${TileSize + 4}px;
`;

const smallCoverStyle = css`
  display: block;

  ${Breakpoints.xl} {
    display: none;
  }
`;

const largeCoverStyle = css`
  display: none;

  ${Breakpoints.xl} {
    display: block;
  }
`;

const maxWidthStyle = css`
  max-width: 140px;
  white-space: normal;
`;
