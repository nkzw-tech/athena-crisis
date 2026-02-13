import {
  mapBuildings,
  mapBuildingsWithContentRestriction,
} from '@deities/athena/info/Building.tsx';
import { getAllTiles, getTileInfo, Plain, TileInfo } from '@deities/athena/info/Tile.tsx';
import { mapUnits, mapUnitsWithContentRestriction } from '@deities/athena/info/Unit.tsx';
import getBiomeBuildingRestrictions from '@deities/athena/lib/getBiomeBuildingRestrictions.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import getBiomeUnitRestrictions from '@deities/athena/lib/getBiomeUnitRestrictions.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { AnimationConfig, DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import Player from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import { MapConfig } from '@deities/athena/MapData.tsx';
import Box from '@deities/ui/Box.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import {
  DiagonalDrawingMode,
  HorizontalDrawingMode,
  HorizontalVerticalDrawingMode,
  RegularDrawingMode,
  VerticalDrawingMode,
} from '@deities/ui/icons/DrawingMode.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import { css, cx } from '@emotion/css';
import Fill from '@iconify-icons/pixelarticons/fill-half.js';
import Stack, { VStack } from '@nkzw/stack';
import { fbt } from 'fbtee';
import { memo, useCallback, useMemo } from 'react';
import InlineTileList, { SelectTileFn } from '../../card/InlineTileList.tsx';
import useGridNavigation from '../../hooks/useGridNavigation.tsx';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import getAnyBuildingTileField from '../../lib/getAnyBuildingTileField.tsx';
import getAnyUnitTile from '../../lib/getAnyUnitTile.tsx';
import navigate from '../../lib/navigate.tsx';
import toTransformOrigin from '../../lib/toTransformOrigin.tsx';
import Tick from '../../Tick.tsx';
import { Actions } from '../../Types.tsx';
import useColumns from '../hooks/useColumns.tsx';
import canFillTile from '../lib/canFillTile.tsx';
import DeleteTile from '../lib/DeleteTile.tsx';
import EditorPlayerSelector from '../selectors/EditorPlayerSelector.tsx';
import { DrawingMode, EditorSelection, EditorState } from '../Types.tsx';

export default memo(function DesignPanel({
  actions,
  config,
  currentPlayer,
  drawingMode,
  fillMap,
  hasContentRestrictions,
  selected,
  setEditorState,
  user,
}: {
  actions: Actions;
  config: MapConfig;
  currentPlayer: Player;
  drawingMode: DrawingMode;
  fillMap: () => void;
  hasContentRestrictions: boolean;
  selected: EditorSelection | undefined;
  setEditorState: (setEditorState: Partial<EditorState>) => void;
  user: UserWithUnlocks;
}) {
  const { biome, blocklistedBuildings, blocklistedUnits } = config;
  const tile = selected?.tile ? getTileInfo(selected?.tile) : null;
  const building = selected?.building || null;
  const unit = selected?.unit || null;
  const biomeStyle = getBiomeStyle(biome);
  const biomeBuildingRestrictions = getBiomeBuildingRestrictions(biome);
  const biomeUnitRestrictions = getBiomeUnitRestrictions(biome);
  const { alert } = useAlert();
  const tiles = useMemo(
    () => getAllTiles().filter((tile) => !biomeStyle.tileRestrictions?.has(tile)),
    [biomeStyle.tileRestrictions],
  );

  const skills = useMemo(() => new Set(user.skills), [user.skills]);
  const buildings = useMemo(
    () =>
      (hasContentRestrictions ? mapBuildingsWithContentRestriction : mapBuildings)(
        (building) => building,
        skills,
      )
        .filter((building) => currentPlayer.id !== 0 || !building.isHQ())
        .map((building) =>
          blocklistedBuildings.has(building.id)
            ? building.create(currentPlayer).complete()
            : building.create(currentPlayer),
        )
        .filter((building) => !biomeBuildingRestrictions?.has(building.info)),
    [
      biomeBuildingRestrictions,
      blocklistedBuildings,
      currentPlayer,
      hasContentRestrictions,
      skills,
    ],
  );
  const units = useMemo(
    () =>
      (hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
        (unit) =>
          blocklistedUnits.has(unit.id)
            ? unit.create(currentPlayer).complete()
            : unit.create(currentPlayer),
        skills,
      ).filter((unit) => !biomeUnitRestrictions?.has(unit.info.type)),
    [biomeUnitRestrictions, blocklistedUnits, currentPlayer, hasContentRestrictions, skills],
  );

  const [setRef, getColumns] = useColumns();

  const selectTile = useCallback(
    (tile: TileInfo | undefined) => {
      if (tile) {
        setEditorState({
          selected: {
            tile: tile.id,
          },
        });
      }
    },
    [setEditorState],
  );

  const selectBuilding = useCallback(
    (building: Building | undefined) => {
      if (building) {
        setEditorState({
          selected: {
            building: building.recover(),
          },
        });
      }
    },
    [setEditorState],
  );

  const selectUnit = useCallback(
    (unit: Unit | undefined) => {
      if (unit) {
        setEditorState({
          selected: {
            unit: unit.recover(),
          },
        });
      }
    },
    [setEditorState],
  );

  useGridNavigation(
    'navigateSecondary',
    useCallback(
      (direction) => {
        const columns = getColumns();
        if (columns == null) {
          return;
        }

        const list =
          ((building || selected?.eraseBuildings) && buildings) ||
          ((unit || selected?.eraseUnits) && units) ||
          tiles;

        const index =
          (building && buildings.findIndex((entity) => building.id === entity.id)) ??
          (unit && units.findIndex((entity) => unit.id === entity.id)) ??
          (tile && tiles.indexOf(tile)) ??
          (selected?.eraseBuildings || selected?.eraseUnits || selected?.eraseTiles
            ? list.length
            : null);

        navigate(
          direction,
          columns,
          index,
          list,
          building || selected?.eraseBuildings
            ? [
                (index: number) => selectBuilding(buildings[index]),
                () => setEditorState({ selected: { eraseBuildings: true } }),
                (index: number, columns: number) => {
                  const maybeFirstIndex = index + Math.ceil(tiles.length / columns) * columns;
                  const maybeSecondIndex = index + Math.floor(tiles.length / columns) * columns;
                  if (maybeFirstIndex === tiles.length) {
                    setEditorState({ selected: { eraseTiles: true } });
                  } else {
                    selectTile(tiles[maybeFirstIndex] || tiles[maybeSecondIndex]);
                  }
                },
                (index: number) => selectUnit(units[index]),
              ]
            : unit || selected?.eraseUnits
              ? [
                  (index: number) => selectUnit(units[index]),
                  () => setEditorState({ selected: { eraseUnits: true } }),
                  (index: number, columns: number) => {
                    const maybeFirstIndex = index + Math.ceil(buildings.length / columns) * columns;
                    const maybeSecondIndex =
                      index + Math.floor(buildings.length / columns) * columns;
                    if (maybeFirstIndex === buildings.length) {
                      setEditorState({ selected: { eraseBuildings: true } });
                    } else {
                      selectBuilding(buildings[maybeFirstIndex] || buildings[maybeSecondIndex]);
                    }
                  },
                  () => {},
                ]
              : [
                  (index: number) => selectTile(tiles[index]),
                  () => setEditorState({ selected: { eraseTiles: true } }),
                  () => {},
                  (index: number) => selectBuilding(buildings[index]),
                ],
        );
      },
      [
        building,
        buildings,
        getColumns,
        selectBuilding,
        selectTile,
        selectUnit,
        selected?.eraseBuildings,
        selected?.eraseTiles,
        selected?.eraseUnits,
        setEditorState,
        tile,
        tiles,
        unit,
        units,
      ],
    ),
  );

  const onLongPress: SelectTileFn = useCallback(
    (event, { building, tile, unit }) => {
      actions.showGameInfo({
        building,
        origin: toTransformOrigin(event),
        tile: unit || building ? null : tile,
        type: 'map-info',
        unit,
        vector: vec(1, 1),
      });
    },
    [actions],
  );

  const panelContent = useMemo(
    () => (
      <VStack between gap={24} verticalPadding wrap>
        <Box between gap={32} ref={setRef} wrap>
          <InlineTileList
            biome={biome}
            onLongPress={onLongPress}
            onSelect={(_, { tile }) => selectTile(tile)}
            selected={
              tile ? tiles.findIndex((currentTile) => currentTile.id === tile.id) : undefined
            }
            tiles={tiles}
          >
            <DeleteTile
              active={selected?.eraseTiles}
              onClick={() => setEditorState({ selected: { eraseTiles: true } })}
              scale={2}
              tileSize={TileSize}
            />
            <InlineLink
              className={cx(fillStyle, ellipsis)}
              onClick={() =>
                alert({
                  onAccept: fillMap,
                  text: fbt(
                    `Fill the map with tile "${fbt.param(
                      'tile name',
                      (canFillTile(tile) ? tile : Plain).name,
                    )}"?`,
                    'Confirmation dialog to fill the map in the editor',
                  ),
                })
              }
            >
              <Icon height={32} icon={Fill} width={32} />
            </InlineLink>
          </InlineTileList>
        </Box>
        <Box between gap={32} wrap>
          <InlineTileList
            biome={biome}
            buildings={buildings}
            onLongPress={onLongPress}
            onSelect={(_, { building }) => selectBuilding(building)}
            selected={
              building ? buildings.findIndex((entity) => entity.id === building.id) : undefined
            }
            size="tall"
            tiles={buildings.map((building) => getTileInfo(getAnyBuildingTileField(building.info)))}
          >
            <DeleteTile
              active={selected?.eraseBuildings}
              onClick={() => setEditorState({ selected: { eraseBuildings: true } })}
              scale={2}
              tall
              tileSize={TileSize}
            />
          </InlineTileList>
        </Box>
        <Box between gap={32} wrap>
          <InlineTileList
            biome={biome}
            onLongPress={onLongPress}
            onSelect={(_, { unit }) => selectUnit(unit)}
            selected={unit ? units.findIndex((entity) => entity.id === unit.id) : undefined}
            tiles={units.map((unit) => getAnyUnitTile(unit.info) || Plain)}
            units={units}
          >
            <DeleteTile
              active={selected?.eraseUnits}
              onClick={() => setEditorState({ selected: { eraseUnits: true } })}
              scale={2}
              tileSize={TileSize}
            />
          </InlineTileList>
        </Box>
      </VStack>
    ),
    [
      alert,
      biome,
      building,
      buildings,
      fillMap,
      onLongPress,
      selectBuilding,
      selectTile,
      selectUnit,
      selected?.eraseBuildings,
      selected?.eraseTiles,
      selected?.eraseUnits,
      setEditorState,
      setRef,
      tile,
      tiles,
      unit,
      units,
    ],
  );

  return (
    <Tick animationConfig={AnimationConfig}>
      <Stack alignStart between gap={24}>
        {panelContent}
        <VStack between gap={24} wrap>
          <Box between className={drawingModeContainerStyle} wrap>
            <VStack gap={16} wrap>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'regular' });
                }}
                selected={drawingMode === 'regular'}
              >
                <Icon height={32} icon={RegularDrawingMode} width={32} />
              </InlineLink>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'horizontal' });
                }}
                selected={drawingMode === 'horizontal'}
              >
                <Icon height={32} icon={HorizontalDrawingMode} width={32} />
              </InlineLink>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'vertical' });
                }}
                selected={drawingMode === 'vertical'}
              >
                <Icon height={32} icon={VerticalDrawingMode} width={32} />
              </InlineLink>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'diagonal' });
                }}
                selected={drawingMode === 'diagonal'}
              >
                <Icon height={32} icon={DiagonalDrawingMode} width={32} />
              </InlineLink>{' '}
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'horizontal-vertical' });
                }}
                selected={drawingMode === 'horizontal-vertical'}
              >
                <Icon height={32} icon={HorizontalVerticalDrawingMode} width={32} />
              </InlineLink>
            </VStack>
          </Box>
          <Box center gap={32} wrap>
            <EditorPlayerSelector
              actions={actions}
              currentPlayer={currentPlayer}
              setEditorState={setEditorState}
              vertical
            />
          </Box>
        </VStack>
      </Stack>
    </Tick>
  );
});

const fillStyle = css`
  align-items: center;
  display: inline-flex;
  height: ${DoubleSize - 4}px;
  justify-content: center;
  margin: 2px;
  width: ${DoubleSize - 4}px;
`;

const drawingModeContainerStyle = css`
  margin-top: ${TileSize}px;
`;
