import { Decorator } from '@deities/athena/info/Decorator.tsx';
import {
  CrossOverTiles,
  DeepSea,
  getTileInfo,
  Pier,
  Plain,
  reduceTiles,
  River,
  Sea,
  ShipyardConstructionSite,
  TileInfo,
  TileTypes,
  Trench,
} from '@deities/athena/info/Tile.tsx';
import canBuild from '@deities/athena/lib/canBuild.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import canPlaceDecorator from '@deities/athena/lib/canPlaceDecorator.tsx';
import canPlaceTile from '@deities/athena/lib/canPlaceTile.tsx';
import getActivePlayers from '@deities/athena/lib/getActivePlayers.tsx';
import getDecoratorIndex from '@deities/athena/lib/getDecoratorIndex.tsx';
import maybeCreatePlayers from '@deities/athena/lib/maybeCreatePlayers.tsx';
import mergeTeams from '@deities/athena/lib/mergeTeams.tsx';
import verifyTiles from '@deities/athena/lib/verifyTiles.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { getDecoratorLimit } from '@deities/athena/map/Configuration.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import { PlayerID, PlayerIDs } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import writeTile from '@deities/athena/mutation/writeTile.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import getFirstOrThrow from '@deities/hephaestus/getFirstOrThrow.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import throttle from '@deities/ui/controls/throttle.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { fbt } from 'fbt';
import addExplosionAnimation from '../../animations/addExplosionAnimation.tsx';
import Decorators from '../../Decorators.tsx';
import addFlashAnimation from '../../lib/addFlashAnimation.tsx';
import explodeUnits from '../../lib/explodeUnits.tsx';
import spawn from '../../lib/spawn.tsx';
import { RadiusType } from '../../Radius.tsx';
import {
  Actions,
  MapBehavior,
  State,
  StateLike,
  StateWithActions,
} from '../../Types.tsx';
import FlashFlyout from '../../ui/FlashFlyout.tsx';
import { FlyoutItem } from '../../ui/Flyout.tsx';
import changePlayer from '../lib/changePlayer.tsx';
import getSymmetricPositions from '../lib/getSymmetricPositions.ts';
import updateUndoStack from '../lib/updateUndoStack.tsx';
import { EditorState } from '../Types.tsx';

const playPutSound = throttle(() => AudioPlayer.playSound('UI/Put'), 300);

const shouldPlaceDecorator = (editor: EditorState | undefined) =>
  !!(
    editor?.selected?.eraseDecorators ||
    editor?.selected?.decorator ||
    (editor?.selected?.decorator && editor?.isErasing)
  );

const encodeEntities = (entities: ImmutableMap<Vector, Entity>) =>
  entities
    .sortBy((_, vector) => String(vector))
    .map(({ id }, vector) => `${id}:${vector}`)
    .join(',');

const isDesignBehavior = (
  behavior?: MapBehavior | null,
): behavior is DesignBehavior => {
  return behavior?.type === 'design';
};

const canPlaceMapEditorTile = (map: MapData, vector: Vector, info: TileInfo) =>
  canPlaceTile(map, vector, info === ShipyardConstructionSite ? Pier : info) ||
  (info === DeepSea &&
    vector
      .expandWithDiagonals()
      .every((vector) => canPlaceTile(map, vector, Sea)));

const getTemporaryMapForBuilding = (
  map: MapData,
  vector: Vector,
  building: Building,
) => {
  const { editorPlaceOn, placeOn } = building.info.configuration;
  const tiles = new Set([...(placeOn || []), ...editorPlaceOn]);
  const tile = getFirstOrThrow(tiles);
  if (!tiles.has(map.getTileInfo(vector))) {
    const tileToCheck = tile === ShipyardConstructionSite ? Pier : tile;
    if (canPlaceTile(map, vector, tileToCheck)) {
      const tileMap = map.map.slice();
      writeTile(tileMap, map.modifiers.slice(), map.getTileIndex(vector), tile);
      return map.copy({
        map: tileMap,
      });
    }
  }

  return map;
};

const getDecorator = (
  state: State,
  editor: EditorState,
  subVector: Vector,
  isErasingDecorators: boolean,
) => {
  const { map } = state;
  const decoratorMapSize = map.size.toDecoratorSizeVector();
  return (
    (isErasingDecorators
      ? subVector
          .expandStar()
          .filter((vector) => decoratorMapSize.contains(vector))
          .map((vector) => {
            const index = getDecoratorIndex(vector, decoratorMapSize);
            return [index, map.decorators[index]];
          })
          .find(([, decorator]) => decorator) || []
      : null) || [
      getDecoratorIndex(subVector, decoratorMapSize),
      editor.selected?.decorator,
    ]
  );
};

export default class DesignBehavior {
  public readonly type = 'design' as const;

  previous: {
    position: Vector;
    tile: TileInfo;
  } | null = null;
  subVector: Vector | null | undefined = null;

  select(
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: EditorState,
    subVector?: Vector,
  ): StateLike | null {
    return editor && subVector && shouldPlaceDecorator(editor)
      ? this.putDecorator(
          editor?.isErasing ? 0 : editor?.selected?.decorator || 0,
          vector,
          subVector,
          state,
          actions,
          editor,
        )
      : null;
  }

  enter(
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: EditorState,
    subVector?: Vector,
  ): StateLike | null {
    if (editor?.isDrawing && editor.selected) {
      const vectors = [
        vector,
        ...getSymmetricPositions(vector, editor.drawingMode, state.map.size),
      ];
      return this.draw(vectors, state, actions, editor);
    }

    const { animations, map } = state;
    const hasUnit = map.units.has(vector);
    const hasBuilding = map.buildings.has(vector);
    const isErasingUnit =
      hasUnit && (editor?.isErasing || editor?.selected?.eraseUnits);
    const isErasingBuilding =
      hasBuilding && (editor?.isErasing || editor?.selected?.eraseBuildings);

    if (
      !editor?.selected?.decorator &&
      (isErasingUnit || isErasingBuilding) &&
      !animations.has(vector)
    ) {
      return {
        radius: {
          fields: new Map([[vector, RadiusItem(vector)]]),
          focus: isErasingUnit ? 'unit' : 'building',
          path: [],
          type: RadiusType.Attackable,
        },
      };
    }

    if (shouldPlaceDecorator(editor)) {
      this.subVector = subVector;
    }

    return state.radius
      ? {
          radius: null,
        }
      : null;
  }

  enterAlternative(
    vector: Vector,
    state: State,
    { setEditorState }: Actions,
    editor: EditorState,
  ): StateLike | null {
    const { map } = state;
    const unit = map.units.get(vector);
    const building = map.buildings.get(vector);
    const maybeEntity = unit || building;

    setEditorState({
      ...editor,
      selected: unit
        ? {
            eraseUnits: false,
            unit: unit.withName(null),
          }
        : building
          ? {
              building,
              eraseBuildings: false,
            }
          : {
              tile: map.getTileInfo(vector).id,
            },
    });

    return maybeEntity &&
      !map.matchesPlayer(map.getCurrentPlayer(), maybeEntity)
      ? changePlayer(state.map, maybeEntity.player)
      : null;
  }

  private draw(
    vectors: Array<Vector>,
    state: State,
    actions: Actions,
    editor: EditorState,
  ): StateLike | null {
    let newState: StateLike | null = null;
    const players = PlayerIDs.filter((id) => id !== 0);
    const currentPlayerId = state.map.getCurrentPlayer().id;
    vectors.forEach((vector, index) => {
      const playerIndex =
        currentPlayerId != 0 ? players.indexOf(currentPlayerId) : -1;
      const playerId =
        playerIndex === -1
          ? 0
          : players[(playerIndex + index) % players.length];
      newState = {
        ...newState,
        ...this.put(
          vector,
          { ...state, ...newState },
          actions,
          editor,
          playerId,
        ),
      };
    });
    return newState;
  }

  private put(
    vector: Vector,
    state: State,
    actions: Actions,
    editor: EditorState,
    playerId: PlayerID,
  ): StateLike | null {
    if (shouldPlaceDecorator(editor)) {
      return null;
    }

    const { animations, map } = state;
    const currentAnimation = animations.get(vector);
    if (currentAnimation) {
      return null;
    }

    const { isErasing, selected = {} } = editor;
    const unit = map.units.get(vector);
    const building = map.buildings.get(vector);

    if ((isErasing || selected.eraseUnits) && unit) {
      return {
        ...explodeUnits(actions, state, [vector], (state) => {
          return {
            ...state,
            map: state.map.copy({
              active: getActivePlayers(state.map),
            }),
          };
        }),
        radius: null,
      };
    } else if ((isErasing || selected.eraseBuildings) && building) {
      return {
        animations: addExplosionAnimation(
          state,
          building,
          vector,
          undefined,
          (state) => state,
          (state) => {
            const { buildings, units } = state.map;
            const unit = units.get(vector);
            const newMap = state.map.copy({
              buildings: buildings.delete(vector),
              units: unit ? units.set(vector, unit.stopCapture()) : units,
            });
            return {
              ...state,
              map: newMap.copy({
                active: getActivePlayers(newMap),
              }),
            };
          },
        ),
        radius: null,
      };
    } else if (isErasing || selected.eraseTiles || selected.tile) {
      return this.putTile(
        selected.tile
          ? getTileInfo(selected.tile)
          : map.getTile(vector, 1)
            ? null
            : Plain,
        vector,
        state,
        actions,
        editor,
      );
    } else if (selected.unit) {
      this.previous = null;
      return this.putUnit(
        selected.unit,
        vector,
        state,
        actions,
        editor,
        playerId,
      );
    } else if (selected.building) {
      this.previous = null;
      return this.putBuilding(
        selected.building,
        vector,
        state,
        actions,
        editor,
        playerId,
      );
    }
    return null;
  }

  private putTile(
    info: TileInfo | null,
    vector: Vector,
    state: State,
    actions: Actions,
    editor: EditorState,
    skipMutations = false,
  ): StateLike | null {
    let { map } = state;
    const { animations } = state;
    const { buildings, units } = map;
    const newMap = map.map.slice();
    const newModifiers = map.modifiers.slice();

    if (info && !canPlaceMapEditorTile(map, vector, info)) {
      return null;
    }

    const { previous } = this;

    const tileToPlace = reduceTiles(
      (info, tile) =>
        info === tile.style.connectsWith && canPlaceTile(map, vector, tile)
          ? tile
          : info,
      info,
    );

    if (tileToPlace === DeepSea) {
      vector.adjacentWithDiagonals().forEach((vector) => {
        if (
          map.contains(vector) &&
          !(map.getTileInfo(vector, 0).type & TileTypes.Sea)
        ) {
          writeTile(newMap, newModifiers, map.getTileIndex(vector), Sea);
        }
      });
    }

    writeTile(newMap, newModifiers, map.getTileIndex(vector), tileToPlace);

    if (!skipMutations && tileToPlace) {
      this.previous = {
        position: vector,
        tile: tileToPlace,
      };
    }

    if (
      previous?.position.distance(vector) === 1 &&
      CrossOverTiles.has(previous.tile)
    ) {
      for (const tile of [River, Trench]) {
        const temporaryMap = newMap.slice();
        const index = map.getTileIndex(previous.position);
        temporaryMap[index] = tile.id;
        const bridgeTile = CrossOverTiles.get(previous.tile);

        if (
          bridgeTile &&
          canPlaceTile(
            map.copy({
              map: temporaryMap.slice(),
            }),
            previous.position,
            bridgeTile,
          )
        ) {
          writeTile(newMap, newModifiers, index, tile);
          writeTile(newMap, newModifiers, index, bridgeTile);
          break;
        }
      }
    }

    map = map.copy({
      map: newMap.slice(),
      modifiers: newModifiers.slice(),
    });

    // Tiles up to three spaces away might be affected by a change to the current position.
    // All modifiers have to be recomputed and fallback tiles might need to be applied.
    const vectors = new Set(
      vector
        .expandStar()
        .flatMap((vector) => vector.expandWithDiagonals())
        .filter((p) => map.contains(p)),
    );
    const finalMap = verifyTiles(map, vectors);

    const config = map.config.copy({
      blocklistedBuildings: new Set(),
      blocklistedUnits: new Set(),
    });
    for (const vector of vectors) {
      const unit = map.units.get(vector);
      if (
        unit &&
        !canDeploy(
          finalMap.copy({
            units: units.delete(vector),
          }),
          unit.info,
          vector,
          true,
        )
      ) {
        return {
          animations: addFlashAnimation(animations, {
            children: fbt('Remove unit first!', 'Error message'),
            color: 'error',
            position: vector,
          }),
        };
      }

      const building = map.buildings.get(vector);
      if (
        building &&
        !canBuild(
          finalMap.copy({
            buildings: buildings.delete(vector),
            config,
          }),
          building.info,
          building.player,
          vector,
          true,
        )
      ) {
        return {
          animations: addFlashAnimation(animations, {
            children: building.info.isStructure()
              ? fbt('Remove structure first!', 'Error message')
              : fbt('Remove building first!', 'Error message'),
            color: 'error',
            position: vector,
          }),
        };
      }
    }

    if (!skipMutations) {
      updateUndoStack(actions, editor, [
        `design-tile-${finalMap.map.join(',')}`,
        finalMap,
      ]);
      playPutSound();
    }

    return {
      map: finalMap,
    };
  }

  private putDecorator(
    decorator: Decorator | 0,
    vector: Vector,
    subVector: Vector,
    state: State,
    actions: Actions,
    editor: EditorState,
  ): StateLike | null {
    if (decorator === 0 || canPlaceDecorator(state.map, vector, decorator)) {
      const decorators = state.map.decorators.slice();
      const [index] = getDecorator(state, editor, subVector, decorator === 0);
      if (index) {
        decorators[index] = decorator;
        const map = state.map.copy({
          decorators,
        });
        updateUndoStack(actions, editor, [
          `design-decorator-${map.decorators.join(',')}`,
          map,
        ]);
        AudioPlayer.playSound('UI/Put');
        return {
          map,
        };
      }
    }
    return null;
  }

  private putUnit(
    unit: Unit,
    vector: Vector,
    state: State,
    actions: Actions,
    editor: EditorState,
    playerId: PlayerID,
  ): StateLike | null {
    const { map } = state;
    const { units } = map;
    if (unit.isCapturing()) {
      const building = map.buildings.get(vector);
      unit =
        building && map.isOpponent(building, unit) ? unit : unit.stopCapture();
    }
    const newUnits = ImmutableMap([
      [vector, unit.removeLeader().setPlayer(playerId)],
    ]);

    return canDeploy(
      map.copy({ units: units.delete(vector) }),
      unit.info,
      vector,
      true,
    )
      ? {
          ...spawn(
            actions,
            state,
            newUnits.toArray(),
            maybeCreatePlayers(map, undefined, newUnits),
            'slow',
            ({ map }) => {
              updateUndoStack(actions, editor, [
                `design-unit-${encodeEntities(map.units)}`,
                map,
              ]);
              return {
                map: map.copy({
                  active: getActivePlayers(map),
                }),
              };
            },
            true,
          ),
          map: map.copy({ units: map.units.delete(vector) }),
        }
      : null;
  }

  private putBuilding(
    building: Building,
    vector: Vector,
    state: State,
    actions: Actions,
    editor: EditorState,
    playerId: PlayerID,
  ): StateLike | null {
    const { animations, map } = state;
    const { buildings, units } = map;
    const unit = units.get(vector);
    if (unit && !building.info.isAccessibleBy(unit.info)) {
      return {
        animations: addFlashAnimation(animations, {
          children: 'Remove unit first!',
          color: 'error',
          position: vector,
        }),
      };
    }

    const config = map.config.copy({
      blocklistedBuildings: new Set(),
    });
    const isAlwaysNeutral = building.info.isStructure();

    const tryToPlaceBuilding = (state: State): StateLike | null => {
      let { map } = state;
      const newBuilding = building.setPlayer(playerId);
      map = map.copy({
        active: getActivePlayers(map),
        buildings: map.buildings.set(vector, newBuilding),
      });

      const { editorPlaceOn, placeOn } = building.info.configuration;
      const tiles = new Set([...(placeOn || []), ...editorPlaceOn]);
      if (!tiles.has(map.getTileInfo(vector))) {
        const newState = this.putTile(
          getFirstOrThrow(tiles),
          vector,
          state,
          actions,
          editor,
          true,
        );

        if (!newState?.map) {
          return newState;
        }

        if (!map.maybeGetPlayer(playerId)) {
          map = mergeTeams(
            map,
            maybeCreatePlayers(
              map,
              undefined,
              ImmutableMap([[vector, newBuilding]]),
            ),
          );
        }

        map = map.copy({
          map: newState.map.map,
          modifiers: newState.map.modifiers,
        });
      }

      return { map };
    };

    const temporaryMap = map.copy({
      buildings: buildings.delete(vector),
      config,
    });
    const maybeNewState = tryToPlaceBuilding({
      ...state,
      map: temporaryMap,
    });
    if (!maybeNewState?.map) {
      return maybeNewState;
    }

    return canBuild(
      getTemporaryMapForBuilding(temporaryMap, vector, building),
      building.info,
      isAlwaysNeutral ? 0 : playerId,
      vector,
      true,
    ) && !(building.info.isHQ() && map.currentPlayer === 0)
      ? {
          animations: animations.set(vector, {
            onComplete: () => null,
            onCreate: (state) => {
              const newState = tryToPlaceBuilding(state);
              if (newState?.map) {
                updateUndoStack(actions, editor, [
                  `design-building-${encodeEntities(newState.map.buildings)}`,
                  newState.map,
                ]);
              }
              return newState;
            },
            type: 'createBuilding',
            variant: isAlwaysNeutral ? 0 : playerId,
          }),
          map: state.map.copy({ buildings: buildings.delete(vector) }),
        }
      : null;
  }

  component({ editor, state }: StateWithActions) {
    const { animationConfig, behavior, map, position, tileSize, zIndex } =
      state;

    if (!editor || !position) {
      return null;
    }

    const {
      isErasing,
      selected: {
        building = null,
        decorator = null,
        eraseDecorators = false,
        tile = null,
        unit = null,
      } = {},
    } = editor;

    const decoratorCanBePlaced =
      decorator && canPlaceDecorator(state.map, position, decorator);
    const isErasingDecorators = !!(eraseDecorators || (decorator && isErasing));
    if (
      (decoratorCanBePlaced || isErasingDecorators) &&
      isDesignBehavior(behavior) &&
      behavior.subVector
    ) {
      const { subVector } = behavior;
      const decorators = map.decorators.slice().fill(0);
      const [index, decoratorId] = getDecorator(
        state,
        editor,
        subVector,
        isErasingDecorators,
      );
      if (index && decoratorId) {
        decorators[index] = decoratorId;
        return (
          <Decorators
            aboveFog
            dim={!isErasingDecorators}
            map={map.copy({ decorators })}
            outline={isErasingDecorators}
            tileSize={tileSize}
          />
        );
      }
    }

    const config = map.config.copy({
      blocklistedBuildings: new Set(),
      blocklistedUnits: new Set(),
    });
    const currentUnit = map.units.get(position);
    const tileInfo = tile && getTileInfo(tile);

    if (
      (unit &&
        !canDeploy(
          map.copy({ units: map.units.delete(position) }),
          unit.info,
          position,
          true,
        )) ||
      (building &&
        (!canBuild(
          getTemporaryMapForBuilding(
            map.copy({
              buildings: map.buildings.delete(position),
              config,
            }),
            position,
            building,
          ),
          building.info,
          building.info.isStructure() ? 0 : map.getCurrentPlayer(),
          position,
          true,
        ) ||
          (currentUnit && !building.info.isAccessibleBy(currentUnit.info)) ||
          (building.info.isHQ() && map.currentPlayer === 0))) ||
      (tileInfo && !canPlaceMapEditorTile(map, position, tileInfo)) ||
      (decorator && !decoratorCanBePlaced)
    ) {
      const decoratorLimit = getDecoratorLimit(map.size);
      const limitReached =
        (building &&
          building.info.configuration.limit > 0 &&
          map.buildings.filter(
            (b) =>
              b.id == building.id &&
              map.matchesPlayer(
                building.info.isStructure() ? 0 : map.getCurrentPlayer(),
                b,
              ),
          ).size >= building.info.configuration.limit) ||
        (decorator &&
          !decoratorCanBePlaced &&
          map.reduceEachDecorator((sum) => sum + 1, 0) >= decoratorLimit);
      const limit = building
        ? building.info.configuration.limit
        : decoratorLimit;

      return (
        <FlashFlyout
          animationConfig={animationConfig}
          items={
            <FlyoutItem color="error">
              {limitReached ? `Reached limit of ${limit}!` : 'X'}
            </FlyoutItem>
          }
          position={position}
          tileSize={tileSize}
          width={map.size.width}
          zIndex={zIndex}
        />
      );
    }
    return null;
  }
}
