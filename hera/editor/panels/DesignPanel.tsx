import {
  mapBuildings,
  mapBuildingsWithContentRestriction,
} from '@deities/athena/info/Building.tsx';
import {
  getAllTiles,
  getTileInfo,
  Plain,
  TileInfo,
} from '@deities/athena/info/Tile.tsx';
import {
  mapUnits,
  mapUnitsWithContentRestriction,
} from '@deities/athena/info/Unit.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import Building from '@deities/athena/map/Building.tsx';
import {
  AnimationConfig,
  DoubleSize,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
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
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Fill from '@iconify-icons/pixelarticons/fill-half.js';
import { fbt } from 'fbt';
import { useCallback, useMemo } from 'react';
import InlineTileList, { SelectTileFn } from '../../card/InlineTileList.tsx';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import getAnyBuildingTileField from '../../lib/getAnyBuildingTileField.tsx';
import getAnyUnitTile from '../../lib/getAnyUnitTile.tsx';
import Tick from '../../Tick.tsx';
import { StateWithActions } from '../../Types.tsx';
import useColumns from '../hooks/useColumns.tsx';
import canFillTile from '../lib/canFillTile.tsx';
import DeleteTile from '../lib/DeleteTile.tsx';
import navigate from '../lib/navigate.tsx';
import useGridNavigation from '../lib/useGridNavigation.tsx';
import EditorPlayerSelector from '../selectors/EditorPlayerSelector.tsx';
import { EditorState } from '../Types.tsx';

export default function DesignPanel({
  actions,
  editor,
  fillMap,
  hasContentRestrictions,
  setEditorState,
  state,
  user,
}: StateWithActions & {
  editor: EditorState;
  fillMap: () => void;
  hasContentRestrictions: boolean;
  setEditorState: (setEditorState: Partial<EditorState>) => void;
  user: UserWithFactionNameAndSkills;
}) {
  const { map } = state;
  const currentPlayer = map.getCurrentPlayer();
  const { config } = map;
  const { biome, blocklistedBuildings, blocklistedUnits } = config;
  const selected = editor?.selected;
  const tile = selected?.tile ? getTileInfo(selected?.tile) : null;
  const building = selected?.building || null;
  const unit = selected?.unit || null;
  const biomeStyle = getBiomeStyle(biome);
  const { alert } = useAlert();
  const tiles = useMemo(
    () =>
      getAllTiles().filter((tile) => !biomeStyle.tileRestrictions?.has(tile)),
    [biomeStyle.tileRestrictions],
  );
  const skills = useMemo(() => new Set(user.skills), [user.skills]);
  const buildings = useMemo(
    () =>
      (hasContentRestrictions
        ? mapBuildingsWithContentRestriction
        : mapBuildings)((building) => building, skills)
        .filter((building) => currentPlayer.id !== 0 || !building.isHQ())
        .map((building) =>
          blocklistedBuildings.has(building.id)
            ? building.create(currentPlayer).complete()
            : building.create(currentPlayer),
        ),
    [blocklistedBuildings, currentPlayer, hasContentRestrictions, skills],
  );
  const units = useMemo(
    () =>
      (hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
        (unit) =>
          blocklistedUnits.has(unit.id)
            ? unit.create(currentPlayer).complete()
            : unit.create(currentPlayer),
        skills,
      ),
    [blocklistedUnits, currentPlayer, hasContentRestrictions, skills],
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
          (building &&
            buildings.findIndex((entity) => building.id === entity.id)) ??
          (unit && units.findIndex((entity) => unit.id === entity.id)) ??
          (tile && tiles.indexOf(tile)) ??
          (selected?.eraseBuildings ||
          selected?.eraseUnits ||
          selected?.eraseTiles
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
                  const maybeFirstIndex =
                    index + Math.ceil(tiles.length / columns) * columns;
                  const maybeSecondIndex =
                    index + Math.floor(tiles.length / columns) * columns;
                  if (maybeFirstIndex === tiles.length) {
                    setEditorState({ selected: { eraseTiles: true } });
                  } else {
                    selectTile(
                      tiles[maybeFirstIndex] || tiles[maybeSecondIndex],
                    );
                  }
                },
                (index: number) => selectUnit(units[index]),
              ]
            : unit || selected?.eraseUnits
              ? [
                  (index: number) => selectUnit(units[index]),
                  () => setEditorState({ selected: { eraseUnits: true } }),
                  (index: number, columns: number) => {
                    const maybeFirstIndex =
                      index + Math.ceil(buildings.length / columns) * columns;
                    const maybeSecondIndex =
                      index + Math.floor(buildings.length / columns) * columns;
                    if (maybeFirstIndex === buildings.length) {
                      setEditorState({ selected: { eraseBuildings: true } });
                    } else {
                      selectBuilding(
                        buildings[maybeFirstIndex] ||
                          buildings[maybeSecondIndex],
                      );
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
    ({ building, tile, unit }) => {
      actions.showGameInfo({
        building,
        origin,
        tile: unit || building ? null : tile,
        type: 'map-info',
        unit,
        vector: vec(1, 1),
      });
    },
    [actions],
  );

  return (
    <Tick animationConfig={AnimationConfig}>
      <Stack alignNormal gap={24} nowrap>
        <Stack gap={24} vertical verticalPadding>
          <Box gap={32} ref={setRef}>
            <InlineTileList
              biome={biome}
              onLongPress={onLongPress}
              onSelect={({ tile }) => selectTile(tile)}
              selected={
                tile
                  ? tiles.findIndex((currentTile) => currentTile.id === tile.id)
                  : undefined
              }
              tiles={tiles}
            >
              <DeleteTile
                active={selected?.eraseTiles}
                onClick={() =>
                  setEditorState({ selected: { eraseTiles: true } })
                }
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
          <Box gap={32}>
            <InlineTileList
              biome={biome}
              buildings={buildings}
              onLongPress={onLongPress}
              onSelect={({ building }) => selectBuilding(building)}
              selected={
                building
                  ? buildings.findIndex((entity) => entity.id === building.id)
                  : undefined
              }
              size="tall"
              tiles={buildings.map((building) =>
                getTileInfo(getAnyBuildingTileField(building.info)),
              )}
            >
              <DeleteTile
                active={selected?.eraseBuildings}
                onClick={() =>
                  setEditorState({ selected: { eraseBuildings: true } })
                }
                scale={2}
                tall
                tileSize={TileSize}
              />
            </InlineTileList>
          </Box>

          <Box gap={32}>
            <InlineTileList
              biome={biome}
              onLongPress={onLongPress}
              onSelect={({ unit }) => selectUnit(unit)}
              selected={
                unit
                  ? units.findIndex((entity) => entity.id === unit.id)
                  : undefined
              }
              tiles={units.map((unit) => getAnyUnitTile(unit.info) || Plain)}
              units={units}
            >
              <DeleteTile
                active={selected?.eraseUnits}
                onClick={() =>
                  setEditorState({ selected: { eraseUnits: true } })
                }
                scale={2}
                tileSize={TileSize}
              />
            </InlineTileList>
          </Box>
        </Stack>
        <Stack gap={24} vertical>
          <Box className={drawingModeContainerStyle}>
            <Stack gap={16} start vertical>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'regular' });
                }}
                selected={editor.drawingMode === 'regular'}
              >
                <Icon height={32} icon={RegularDrawingMode} width={32} />
              </InlineLink>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'horizontal' });
                }}
                selected={editor.drawingMode === 'horizontal'}
              >
                <Icon height={32} icon={HorizontalDrawingMode} width={32} />
              </InlineLink>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'vertical' });
                }}
                selected={editor.drawingMode === 'vertical'}
              >
                <Icon height={32} icon={VerticalDrawingMode} width={32} />
              </InlineLink>
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'diagonal' });
                }}
                selected={editor.drawingMode === 'diagonal'}
              >
                <Icon height={32} icon={DiagonalDrawingMode} width={32} />
              </InlineLink>{' '}
              <InlineLink
                className={cx(fillStyle, ellipsis)}
                onClick={() => {
                  setEditorState({ drawingMode: 'horizontal-vertical' });
                }}
                selected={editor.drawingMode === 'horizontal-vertical'}
              >
                <Icon
                  height={32}
                  icon={HorizontalVerticalDrawingMode}
                  width={32}
                />
              </InlineLink>
            </Stack>
          </Box>
          <Box center gap={32}>
            <EditorPlayerSelector
              actions={actions}
              editor={editor}
              setEditorState={setEditorState}
              state={state}
              vertical
            />
          </Box>
        </Stack>
      </Stack>
    </Tick>
  );
}

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
