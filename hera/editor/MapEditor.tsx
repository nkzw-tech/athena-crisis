import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import ActionResponseMutator from '@deities/apollo/ActionResponseMutator.tsx';
import {
  decodeEffects,
  Effects,
  encodeEffects,
  Scenario,
} from '@deities/apollo/Effects.tsx';
import { Route } from '@deities/apollo/Routes.tsx';
import getCampaignRoute from '@deities/apollo/routes/getCampaignRoute.tsx';
import {
  generateBuildings,
  generatePlainMap,
  generateRandomMap,
  generateSea,
} from '@deities/athena/generator/MapGenerator.tsx';
import { Bush } from '@deities/athena/info/Decorator.tsx';
import { getTileInfo, Plain } from '@deities/athena/info/Tile.tsx';
import createBotWithName from '@deities/athena/lib/createBotWithName.tsx';
import dropInactivePlayers from '@deities/athena/lib/dropInactivePlayers.tsx';
import resizeMap, { ResizeOrigin } from '@deities/athena/lib/resizeMap.tsx';
import startGame from '@deities/athena/lib/startGame.tsx';
import updateActivePlayers from '@deities/athena/lib/updateActivePlayers.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import validateMap, { ErrorReason } from '@deities/athena/lib/validateMap.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import { DoubleSize, TileSize } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer, PlayerID } from '@deities/athena/map/Player.tsx';
import { toTeamArray } from '@deities/athena/map/Team.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import getFirstOrThrow from '@deities/hephaestus/getFirstOrThrow.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import random from '@deities/hephaestus/random.tsx';
import { ClientGame } from '@deities/hermes/game/toClientGame.tsx';
import { sm } from '@deities/ui/Breakpoints.tsx';
import { isIOS } from '@deities/ui/Browser.tsx';
import isControlElement from '@deities/ui/controls/isControlElement.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar, insetStyle } from '@deities/ui/cssVar.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import ErrorText from '@deities/ui/ErrorText.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import useMedia from '@deities/ui/hooks/useMedia.tsx';
import usePress from '@deities/ui/hooks/usePress.tsx';
import useScale from '@deities/ui/hooks/useScale.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import MenuButton from '@deities/ui/MenuButton.tsx';
import Portal from '@deities/ui/Portal.tsx';
import PrimaryExpandableMenuButton from '@deities/ui/PrimaryExpandableMenuButton.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Storage from '@deities/ui/Storage.tsx';
import { css, cx } from '@emotion/css';
import ChevronLeft from '@iconify-icons/pixelarticons/chevron-left.js';
import { fbt } from 'fbt';
import { AnimatePresence } from 'framer-motion';
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useBiomeMusic, usePlayMusic } from '../audio/Music.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { DrawerPosition, getDrawerPaddingStyle } from '../drawer/Drawer.tsx';
import GameMap from '../GameMap.tsx';
import useAnimationSpeed, {
  AnimationSpeed,
} from '../hooks/useAnimationSpeed.tsx';
import useClientGameAction from '../hooks/useClientGameAction.tsx';
import useHide from '../hooks/useHide.tsx';
import { UserWithFactionNameAndSkills } from '../hooks/useUserMap.tsx';
import { hasNotableAnimation } from '../MapAnimations.tsx';
import { Actions, State, StateLike } from '../Types.tsx';
import CurrentGameCard from '../ui/CurrentGameCard.tsx';
import GameActions from '../ui/GameActions.tsx';
import maybeFade from '../ui/lib/maybeFade.tsx';
import MapDetails from '../ui/MapDetails.tsx';
import MapInfo from '../ui/MapInfo.tsx';
import Notification from '../ui/Notification.tsx';
import DesignBehavior from './behavior/DesignBehavior.tsx';
import EntityBehavior from './behavior/EntityBehavior.tsx';
import VectorBehavior from './behavior/VectorBehavior.tsx';
import useSetTags from './hooks/useSetTags.tsx';
import useZoom from './hooks/useZoom.tsx';
import BiomeIcon from './lib/BiomeIcon.tsx';
import canFillTile from './lib/canFillTile.tsx';
import getMapValidationErrorText from './lib/getMapValidationErrorText.tsx';
import getValidationErrorText from './lib/getMapValidationErrorText.tsx';
import updateUndoStack from './lib/updateUndoStack.tsx';
import ZoomButton from './lib/ZoomButton.tsx';
import MapEditorControlPanel from './panels/MapEditorControlPanel.tsx';
import ResizeHandle from './ResizeHandle.tsx';
import {
  EditorMode,
  EditorState,
  MapCreateFunction,
  MapEditorSaveState,
  MapObject,
  MapPerformanceMetricsEstimationFunction,
  MapUpdateFunction,
  PreviousMapEditorState,
  SaveMapFunction,
  SetMapFunction,
} from './Types.tsx';

const MAP_KEY = 'map-editor-previous-map';
const EFFECTS_KEY = 'map-editor-previous-effects';

const getDefaultScenario = (effects: Effects) =>
  ({
    effect: getFirstOrThrow(effects.get('Start')!),
    trigger: 'Start',
  }) as const;

const getEditorBaseState = (
  map: MapData,
  mapObject: Pick<MapObject, 'effects'> | null = null,
  mode: EditorMode = 'design',
  scenario?: Scenario,
): EditorState => {
  const startScenario = new Set([{ actions: [] }]);
  let effects: Effects = mapObject?.effects
    ? decodeEffects(JSON.parse(mapObject.effects))
    : new Map([['Start', startScenario]]);
  if (!effects.has('Start')) {
    effects = new Map([...effects, ['Start', startScenario]]);
  }
  return {
    drawingMode: 'regular',
    effects,
    isDrawing: false,
    isErasing: false,
    mode,
    scenario:
      scenario && mode === 'effects' ? scenario : getDefaultScenario(effects),
    selected: {
      tile: Plain.id,
    },
    undoStack: [['initial', map]],
    undoStackIndex: null,
  };
};

const prepareEffects = (
  effects: Effects,
  isEffectMode: boolean,
  { effect, trigger }: Scenario,
): { effects: Effects; lastAction: ActionResponse | null } => {
  const startEffect = effects.get('Start');
  if (isEffectMode) {
    return {
      effects:
        trigger !== 'Start'
          ? new Map([
              ...effects,
              [
                'Start',
                new Set([
                  {
                    ...effect,
                    conditions: undefined,
                  },
                ]),
              ],
            ])
          : effects,
      lastAction: null,
    };
  }

  if (startEffect) {
    const newStartEffect = new Set(
      [...startEffect]
        .map((effect) => ({
          ...effect,
          actions: effect.actions.filter(
            (action) => action.type === 'SpawnEffect',
          ),
        }))
        .filter((effect) => effect.actions.length),
    );

    if (newStartEffect.size) {
      return {
        effects: new Map([...effects, ['Start', newStartEffect]]),
        lastAction: null,
      };
    }
  }

  return {
    effects,
    lastAction: {
      type: 'Start',
    } as const,
  };
};

const panelShouldExpand = ({ action, mode, objective }: EditorState) =>
  (mode === 'objectives' && !objective) ||
  (mode === 'effects' && !action) ||
  mode === 'restrictions' ||
  mode === 'settings' ||
  mode === 'setup';

export type BaseMapEditorProps = Readonly<{
  campaignLock?: { id?: string; name: string };
  children?: (props: {
    actions: Actions;
    delay: boolean;
    isPlayTesting: boolean;
    state: State;
  }) => ReactNode;
  inset?: number;
  isValidName?: (name: string, extraCharacters: string) => boolean;
  mode?: EditorMode;
  scenario?: Scenario;
  setHasChanges: (hasChanges: boolean) => void;
}>;

export default function MapEditor({
  animationSpeed,
  campaignLock,
  children,
  confirmActionStyle,
  createMap,
  estimateMapPerformance,
  fogStyle,
  inset = 0,
  isAdmin,
  isValidName = () => true,
  mapObject,
  mode,
  scenario,
  setHasChanges,
  tiltStyle,
  updateMap,
  user,
}: BaseMapEditorProps & {
  animationSpeed: AnimationSpeed | null;
  confirmActionStyle: 'always' | 'touch' | 'never';
  createMap: MapCreateFunction;
  estimateMapPerformance?: MapPerformanceMetricsEstimationFunction;
  fogStyle: 'soft' | 'hard';
  isAdmin?: boolean;
  mapObject?: MapObject | null;
  tiltStyle?: 'on' | 'off';
  updateMap: MapUpdateFunction;
  user: UserWithFactionNameAndSkills;
}) {
  const users = useMemo(() => new Map([[user.id, user]]), [user]);
  const withHumanPlayer = useCallback(
    (map: MapData, playerId: PlayerID = map.active[0]) => {
      const player =
        map.maybeGetPlayer(playerId) || map.getPlayer(map.active[0]);
      return map.copy({
        currentPlayer: player.id,
        teams: updatePlayer(map.teams, HumanPlayer.from(player, user.id)),
      });
    },
    [user.id],
  );

  const getInitialMap = useCallback(
    (size = new SizeVector(random(10, 15), random(10, 15))): MapData => {
      return withHumanPlayer(
        mapObject
          ? MapData.fromJSON(mapObject.state)!
          : withModifiers(
              generateSea(
                generateBuildings(
                  generateRandomMap(size),
                  isAdmin
                    ? Biomes
                    : Biomes.filter(
                        (biome) =>
                          biome !== Biome.Spaceship && biome !== Biome.Luna,
                      ),
                ),
              ),
            ),
      );
    },
    [isAdmin, mapObject, withHumanPlayer],
  );

  const [eventEmitter] = useState(() => new EventTarget());
  const [internalMapID, setInternalMapID] = useState(0);
  const [map, _setMap] = useState<MapData>(getInitialMap);
  const [tags, _setTags] = useState<ReadonlyArray<string>>(
    mapObject?.tags || [],
  );
  useBiomeMusic(map.config.biome, tags);
  usePlayMusic(map.config.biome);

  const [editor, _setEditorState] = useState<EditorState>(() =>
    getEditorBaseState(map, mapObject, mode, scenario),
  );
  const [previousEffects, setPreviousEffects] = useState(editor.effects);

  const setEditorState = useCallback((newState: Partial<EditorState>) => {
    _setEditorState((editor) => {
      const shouldResetCondition =
        'mode' in newState &&
        newState.mode !== 'objectives' &&
        editor.objective &&
        !newState.objective;

      const shouldResetScenario =
        'mode' in newState && newState.mode !== 'effects';

      const mergedState = {
        ...editor,
        ...newState,
      };
      if (
        editor.mode !== 'design' &&
        newState.mode === 'design' &&
        !mergedState.selected?.tile &&
        !mergedState.selected?.eraseTiles &&
        !mergedState.selected?.building &&
        !mergedState.selected?.eraseBuildings &&
        !mergedState.selected?.unit &&
        !mergedState.selected?.eraseUnits
      ) {
        mergedState.selected = {
          tile: Plain.id,
        };
      } else if (
        editor.mode !== 'decorators' &&
        newState.mode === 'decorators' &&
        !mergedState.selected?.decorator &&
        !mergedState.selected?.eraseDecorators
      ) {
        mergedState.selected = {
          decorator: Bush.id,
        };
      }
      if (newState.effects && editor.effects !== newState.effects) {
        setPreviousEffects(editor.effects);
      }

      return {
        ...mergedState,
        ...(shouldResetCondition ? { objective: undefined } : null),
        ...(shouldResetScenario
          ? { action: undefined, scenario: getDefaultScenario(editor.effects) }
          : null),
      };
    });
  }, []);

  useEffect(() => {
    if (previousEffects !== editor.effects || editor.undoStack.length > 1) {
      setHasChanges(true);
    }
  }, [editor.effects, editor.undoStack, previousEffects, setHasChanges]);

  const [isPlayTesting, setIsPlayTesting] = useState(false);
  const [mapName, setMapName] = useState<string>(mapObject?.name || '');
  const setTags = useSetTags(_setTags);
  const maxZoom = useScale() + 1;
  const [zoom, setZoom] = useZoom();
  const stateRef = useRef<State | null>(null);
  const actionsRef = useRef<Actions | null>(null);
  const [game, setGame] = useState<ClientGame | null>(null);
  const [saveState, setSaveState] = useState<MapEditorSaveState | null>(null);
  const [tilted, setIsTilted] = useState(true);
  const [menuIsExpanded, setMenuIsExpanded] = useState(false);
  const [actAsEveryPlayer, setActAsEveryPlayer] = useState(false);
  const animationConfig = useAnimationSpeed(animationSpeed);
  const [previousState, setPreviousState] =
    useState<PreviousMapEditorState | null>(() => {
      try {
        return {
          effects: Storage.get(EFFECTS_KEY) || '',
          map: MapData.fromJSON(Storage.get(MAP_KEY) || ''),
        };
        // eslint-disable-next-line no-empty
      } catch {}
      return null;
    });

  const setMap: SetMapFunction = useCallback(
    (type, map) => {
      _setMap(map);
      if (type !== 'cleanup') {
        updateUndoStack({ setEditorState }, editor, [
          type === 'resize'
            ? `resize-${map.size.height}-${map.size.width}`
            : type === 'biome'
              ? `biome-${map.config.biome}`
              : 'checkpoint',
          map,
        ]);
      }
      setInternalMapID(internalMapID + 1);
    },
    [editor, internalMapID, setEditorState],
  );

  const updatePreviousMap = useCallback(
    (map?: MapData, editorEffects?: Effects) => {
      const effects = JSON.stringify(
        editorEffects ? encodeEffects(editorEffects) : '',
      );
      Storage.set(MAP_KEY, JSON.stringify(map));
      setPreviousState(map ? { effects, map } : null);
    },
    [],
  );

  const togglePlaytest = useCallback(
    (map: MapData, retainMap = false, actAsEveryPlayer = false) => {
      const playTest = !isPlayTesting;
      const [currentMap, error] = playTest
        ? validateMap(map, toTeamArray(dropInactivePlayers(map).teams))
        : [map];
      if (!currentMap) {
        setSaveState({ message: getMapValidationErrorText(error) });
        return;
      }

      setActAsEveryPlayer(actAsEveryPlayer);
      const mapWithActivePlayers = updateActivePlayers(
        currentMap,
        createBotWithName,
        editor.mode === 'effects' ? undefined : map.currentPlayer,
        user.id,
      );
      const newMap = playTest
        ? startGame(mapWithActivePlayers)
        : mapWithActivePlayers;

      updatePreviousMap(mapWithActivePlayers, editor.effects);
      const mapToSave = playTest || retainMap ? newMap : previousState?.map;
      if (mapToSave) {
        setMap('cleanup', mapToSave);
      }
      setIsPlayTesting(playTest);
      setMenuIsExpanded(false);
      setSaveState(null);
      setGame(
        playTest
          ? {
              ended: false,
              state: newMap,
              turnState: null,
              ...prepareEffects(
                editor.effects,
                editor.mode === 'effects',
                editor.scenario,
              ),
            }
          : null,
      );
    },
    [
      editor.effects,
      editor.mode,
      editor.scenario,
      isPlayTesting,
      previousState?.map,
      setMap,
      updatePreviousMap,
      user.id,
    ],
  );

  const saveMap: SaveMapFunction = useCallback(
    (currentMap, type = 'Update') => {
      if (!mapName || !isValidName(mapName, "_ -!?'")) {
        setSaveState({
          message: fbt(
            'Please enter a valid map name.',
            'Error dialog when saving a map',
          ),
        });
        return;
      }

      const [map, error] = validateMap(
        currentMap,
        toTeamArray(dropInactivePlayers(currentMap).teams),
      );
      if (!map || error) {
        setSaveState({ message: getMapValidationErrorText(error) });
        return;
      }

      const actualMap = withHumanPlayer(
        map,
        currentMap.getCurrentPlayer().id || currentMap.active[0],
      );
      setMap('cleanup', actualMap);

      const isNew = type === 'New' || !mapObject?.id;
      setSaveState(null);
      if (isNew) {
        createMap(
          {
            effects: editor.effects,
            map,
            mapName,
            tags: mapObject?.id
              ? tags.filter((tag) => tag !== 'published')
              : tags,
          },
          setSaveState,
        );
      } else {
        updateMap(
          {
            effects: editor.effects,
            id: mapObject.id,
            map,
            mapName,
            tags,
          },
          type,
          setSaveState,
        );
      }
    },
    [
      createMap,
      editor.effects,
      isValidName,
      mapName,
      mapObject?.id,
      setMap,
      tags,
      updateMap,
      withHumanPlayer,
    ],
  );

  const toggleDeleteEntity = useCallback(
    (isErasing: boolean) => {
      if (editor.isErasing !== isErasing) {
        setEditorState({ isErasing });
      }
    },
    [editor.isErasing, setEditorState],
  );

  const { alert } = useAlert();
  const maybeKeepPlaytestMap = useCallback(() => {
    alert({
      onAccept: () => {
        if (game?.state) {
          togglePlaytest(game.state, true);
        }
      },
      onCancel: () => togglePlaytest(map),
      text: fbt(
        'Would you like to keep the map in its current playtest state?',
        'Explanation for keeping the play test map in the editor',
      ),
    });
  }, [alert, game?.state, map, togglePlaytest]);

  const togglePlaytestProps = usePress({
    onLongPress: maybeKeepPlaytestMap,
    onPress: useCallback(() => togglePlaytest(map), [map, togglePlaytest]),
  });

  useInput(
    'save',
    useCallback(
      (event) => {
        const state = stateRef.current;
        if (state) {
          event.preventDefault();
          saveMap(state.map);
        }
      },
      [saveMap],
    ),
    // This needs to be one layer above the campaign editor's save behavior.
    'menu',
  );

  useEffect(() => {
    const keydownListener = (event: KeyboardEvent) => {
      const state = stateRef.current;
      if (!state) {
        return;
      }

      const metaKey = event.metaKey || event.ctrlKey;
      const isSave = metaKey && event.code === 'KeyS';
      if (!isSave && isControlElement()) {
        return;
      }

      let newState: StateLike | null = null;
      if (metaKey) {
        if (event.code === 'KeyE') {
          setIsTilted(!tilted);
          // Use `event.key` to ensure consistency on qwertz keyboards.
        } else if (event.key === 'z') {
          event.preventDefault();

          const { undoStack, undoStackIndex } = editor;
          if (undoStack.length) {
            const direction = event.shiftKey ? 1 : -1;
            const index = Math.max(
              -1,
              Math.min(
                undoStackIndex != null
                  ? undoStackIndex + direction
                  : undoStack.length - 2,
                undoStack.length,
              ),
            );
            if (index > -1 && index < undoStack.length) {
              const [, newMap] = undoStack.at(index) || [];
              if (newMap) {
                setEditorState({
                  undoStackIndex: index,
                });

                const position = state.selectedPosition;
                const selectedBuilding =
                  state.selectedBuilding && position
                    ? newMap.buildings.get(position)
                    : null;
                const selectedUnit =
                  state.selectedUnit && position
                    ? newMap.units.get(position)
                    : null;
                if (!newMap.size.equals(state.map.size)) {
                  setMap('cleanup', newMap);
                }
                newState = {
                  map: newMap,
                  selectedBuilding,
                  selectedUnit,
                };
              }
            }
          }
        }
      } else {
        if (event.code === 'KeyS') {
          setEditorState({
            mode: 'settings',
          });
        } else if (event.code === 'KeyT') {
          setEditorState({
            mode: 'setup',
          });
        } else if (event.code === 'KeyD') {
          setEditorState({
            mode: 'design',
          });
        } else if (event.code === 'KeyF') {
          setEditorState({
            mode: 'effects',
          });
        } else if (event.code === 'KeyO') {
          setEditorState({
            mode: 'objectives',
          });
        } else if (event.code === 'KeyR') {
          setEditorState({
            mode: 'restrictions',
          });
        } else if (event.code === 'KeyE') {
          setEditorState({
            mode: 'entity',
          });
        } else if (event.code === 'KeyC') {
          setEditorState({
            mode: 'decorators',
          });
        } else if (event.code === 'KeyV') {
          setEditorState({
            mode: 'evaluation',
          });
        } else if (event.code === 'Backspace') {
          toggleDeleteEntity(true);
        }
      }

      if (newState) {
        actionsRef.current?.update(newState);
      }
    };
    const keyupListener = (event: KeyboardEvent) => {
      if (event.code === 'Backspace') {
        toggleDeleteEntity(false);
      }
    };
    document.addEventListener('keydown', keydownListener);
    document.addEventListener('keyup', keyupListener);
    return () => {
      document.removeEventListener('keydown', keydownListener);
      document.removeEventListener('keyup', keyupListener);
    };
  }, [editor, saveMap, setEditorState, setMap, tilted, toggleDeleteEntity]);

  useInput(
    'select',
    useCallback(
      (event) => {
        if (isPlayTesting) {
          if (event.detail.modifier) {
            maybeKeepPlaytestMap();
          } else {
            togglePlaytest(map, event.detail.modifier);
          }
        } else if (stateRef.current) {
          togglePlaytest(stateRef.current.map);
        }
      },
      [isPlayTesting, map, maybeKeepPlaytestMap, togglePlaytest],
    ),
  );

  const resetMap = useCallback(() => {
    const newMap = getInitialMap();
    setMap('reset', newMap);
    _setEditorState(getEditorBaseState(newMap, mapObject, mode, scenario));
    updatePreviousMap();
  }, [getInitialMap, mapObject, mode, scenario, setMap, updatePreviousMap]);

  const fillMap = useCallback(() => {
    const fillTile = editor?.selected?.tile
      ? getTileInfo(editor.selected.tile)
      : null;
    const newMap = withModifiers(
      generatePlainMap(
        map.size,
        map.config.biome,
        canFillTile(fillTile) ? fillTile : undefined,
      ),
    );
    setMap(
      'reset',
      newMap.copy({
        config: newMap.config.copy({
          blocklistedBuildings: map.config.blocklistedBuildings,
          blocklistedUnits: map.config.blocklistedUnits,
          objectives: map.config.objectives,
        }),
      }),
    );
    updatePreviousMap();
  }, [editor.selected?.tile, map.config, map.size, setMap, updatePreviousMap]);

  const restorePreviousState = useCallback(() => {
    if (previousState) {
      setMap('reset', previousState.map);
      setPreviousState(null);
      _setEditorState(
        getEditorBaseState(
          previousState.map,
          {
            effects: previousState.effects,
          },
          editor.mode,
          editor.scenario,
        ),
      );
    }
  }, [editor.mode, editor.scenario, previousState, setMap]);

  const resize = useCallback(
    (size: SizeVector, origin: Set<ResizeOrigin>) => {
      const map = stateRef.current?.map;
      if (map && !size.equals(map.size)) {
        const [newMap, newEffects] = resizeMap(
          map,
          editor.effects,
          size,
          origin,
          editor?.selected?.tile,
        );
        setMap('resize', newMap);
        setEditorState({
          action: undefined,
          effects: newEffects,
          objective: undefined,
          scenario: getDefaultScenario(newEffects),
        });
      }
    },
    [editor.effects, editor?.selected?.tile, setEditorState, setMap],
  );

  const onAction = useClientGameAction(
    game,
    setGame,
    null,
    actAsEveryPlayer ? 'actAsEveryPlayer' : null,
  );

  useEffect(() => {
    if (saveState) {
      const timer = setTimeout(() => setSaveState(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveState]);

  // Disabling the context menu is handled globally in production,
  // so this is only needed for the Map Editor in development.
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useEffect(() => {
      const listener = (event: Event) => event.preventDefault();
      document.addEventListener('contextmenu', listener);
      return () => document.removeEventListener('contextmenu', listener);
    }, []);
  }

  const factionNames = useMemo(() => {
    const player = map.getPlayerByUserId(user.id);
    return new Map(player ? [[player.id, user.factionName]] : undefined);
  }, [map, user.factionName, user.id]);

  const isMedium = useMedia(`(min-width: ${sm}px)`);
  const [drawerPosition, _setDrawerPosition] = useState<DrawerPosition>(() =>
    Storage.get('map-editor-position') === 'left' && isMedium
      ? 'left'
      : 'bottom',
  );
  const setDrawerPosition = useCallback((position: DrawerPosition) => {
    _setDrawerPosition(position);
    Storage.set('map-editor-position', position);
  }, []);

  if (!isMedium && drawerPosition === 'left') {
    _setDrawerPosition('bottom');
  }

  const delay = internalMapID === 0;
  const hidden = useHide();
  if (isPlayTesting) {
    return (
      <GameMap
        animationConfig={animationConfig}
        confirmActionStyle={confirmActionStyle}
        currentUserId={user.id}
        dangerouslyApplyExternalState={
          actAsEveryPlayer &&
          map.config.fog &&
          game?.lastAction?.type === 'EndTurn'
        }
        events={eventEmitter}
        factionNames={factionNames}
        fogStyle={fogStyle}
        inset={inset}
        key="play-test-map"
        lastActionResponse={game?.lastAction || undefined}
        map={game?.state || map}
        mutateAction={
          actAsEveryPlayer ? ActionResponseMutator.actAsEveryPlayer : undefined
        }
        onAction={onAction}
        pan
        scale={zoom}
        scroll={false}
        showCursor={!hidden}
        style="floating"
        tilted={tiltStyle === 'on'}
        userDisplayName={user.displayName}
      >
        {(props, actions) => {
          const hide = hidden || props.lastActionResponse?.type === 'GameEnd';
          return (
            <>
              <MapInfo hide={hide} inset={inset} leftOffset {...props} />
              <CurrentGameCard
                actions={actions}
                animatePlayer={hasNotableAnimation(props.animations)}
                currentViewer={props.currentViewer}
                hide={hidden}
                inlineUI={props.inlineUI}
                inset={inset}
                map={props.map}
                users={users}
                vision={props.vision}
                zIndex={props.zIndex}
              />
              <Portal>
                <MenuButton
                  // Use `hidden` instead of `hide` as this button should be visible
                  // even if the game ended.
                  className={cx(togglePlaytestButtonStyle, maybeFade(hidden))}
                  style={insetStyle(inset)}
                  {...togglePlaytestProps()}
                >
                  <Icon button className={iconStyle} icon={ChevronLeft} />
                </MenuButton>
              </Portal>
              <GameActions
                actions={actions}
                hide={hide}
                inset={inset}
                setZoom={setZoom}
                state={props}
                zoom={zoom}
              />
              {children?.({ actions, delay, isPlayTesting, state: props })}
            </>
          );
        }}
      </GameMap>
    );
  }

  const hasSaved = saveState && 'id' in saveState && saveState.id === 'saved';
  const expand = panelShouldExpand(editor);
  return (
    <>
      <Portal>
        <PrimaryExpandableMenuButton
          className={menuButtonStyle}
          delay={hidden ? false : delay}
          hide={hidden}
          inset={inset}
          isExpanded={menuIsExpanded}
          toggleExpanded={() => setMenuIsExpanded((isExpanded) => !isExpanded)}
        >
          <Stack nowrap start>
            <BiomeIcon biome={map.config.biome} />{' '}
            <div className={cx(mapNameStyle, ellipsis)}>
              {mapName || (
                <span className={lightColorStyle}>
                  <fbt desc="Fallback name for untitled map">Untitled Map</fbt>
                </span>
              )}
            </div>
          </Stack>
          {menuIsExpanded && (
            <Stack className={campaignListStyle} gap={16} nowrap vertical>
              <h2>
                <fbt desc="Details label for maps">Map Details</fbt>
              </h2>
              <MapDetails
                creator={mapObject?.creator || null}
                map={map}
                tags={tags}
                teamPlay={map.getPlayers().length !== map.teams.size}
              />
              {campaignLock ? (
                <>
                  <h2>
                    <fbt desc="Title for current campaign">
                      Current Campaign
                    </fbt>
                  </h2>
                  <span className={ellipsis}>
                    {campaignLock.name === '' ? (
                      <fbt desc="Fallback name for untitled campaign">
                        Untitled Campaign
                      </fbt>
                    ) : (
                      campaignLock.name
                    )}
                  </span>
                </>
              ) : mapObject?.id ? (
                <>
                  <h2>
                    <fbt desc="Title for campaigns">Campaigns</fbt>
                  </h2>
                  {mapObject?.campaigns.edges
                    .filter(isPresent)
                    .map(({ node: { name, slug } }) => (
                      <InlineLink
                        className={ellipsis}
                        key={slug}
                        to={getCampaignRoute(slug, 'edit')}
                      >
                        {name}
                      </InlineLink>
                    ))}
                  <InlineLink
                    className={ellipsis}
                    to={`/campagin-editor-new/${mapObject.slug}` as Route}
                  >
                    <fbt desc="Link to create a new campaign">
                      Create a new campaign from this map
                    </fbt>
                  </InlineLink>
                </>
              ) : (
                <div className={ellipsis}>
                  <ErrorText>
                    <fbt desc="Hint to save the map to create a new campaign based on it.">
                      Save map to create a campaign.
                    </fbt>
                  </ErrorText>
                </div>
              )}
            </Stack>
          )}
        </PrimaryExpandableMenuButton>
        <ZoomButton hide={hidden} max={maxZoom} setZoom={setZoom} zoom={zoom} />
      </Portal>
      <div className={getDrawerPaddingStyle(drawerPosition, expand)}>
        <GameMap
          animatedChildren={({ map, position, showCursor, zIndex }) => (
            <ResizeHandle
              isVisible={!!(showCursor && position)}
              onResize={resize}
              size={map.size}
              zIndex={zIndex}
            />
          )}
          behavior={
            editor.mode === 'design' || editor.mode === 'decorators'
              ? DesignBehavior
              : editor.mode === 'entity'
                ? EntityBehavior
                : (editor.mode === 'objectives' && editor.objective) ||
                    (editor.mode === 'effects' && editor.action)
                  ? VectorBehavior
                  : NullBehavior
          }
          confirmActionStyle={confirmActionStyle}
          currentUserId={user.id}
          editor={editor}
          effects={editor.effects}
          factionNames={factionNames}
          fogStyle={fogStyle}
          inset={inset}
          key={`editor-map-${internalMapID}`}
          map={map}
          scale={zoom}
          scroll={internalMapID === 0}
          setEditorState={setEditorState}
          style="floating"
          tilted={tiltStyle === 'on' && tilted}
          userDisplayName={user.displayName}
        >
          {(props, actions) => {
            stateRef.current = props;
            actionsRef.current = actions;
            return (
              <>
                <MapEditorControlPanel
                  actions={actions}
                  drawerPosition={drawerPosition}
                  editor={editor}
                  estimateMapPerformance={estimateMapPerformance}
                  expand={expand}
                  fillMap={fillMap}
                  inset={inset}
                  isAdmin={isAdmin}
                  mapName={mapName}
                  mapObject={mapObject}
                  previousState={previousState}
                  resetMap={resetMap}
                  resize={resize}
                  restorePreviousState={restorePreviousState}
                  saveMap={saveMap}
                  setDrawerPosition={setDrawerPosition}
                  setEditorState={setEditorState}
                  setMap={setMap}
                  setMapName={setMapName}
                  setTags={setTags}
                  state={props}
                  tags={tags}
                  togglePlaytest={togglePlaytest}
                  user={user}
                  visible={internalMapID !== 0}
                />
                {children?.({ actions, delay, isPlayTesting, state: props })}
              </>
            );
          }}
        </GameMap>
      </div>
      <Portal>
        <AnimatePresence mode="sync">
          {saveState && (
            <Notification
              center={hasSaved || undefined}
              inset={inset}
              key={'id' in saveState ? saveState.id : saveState.message}
            >
              {hasSaved ? (
                <fbt desc="Text after saving a map">
                  Map &quot;<fbt:param name="mapName">{mapName}</fbt:param>&quot;
                  was saved.
                </fbt>
              ) : (
                <ErrorText>
                  {'id' in saveState ? (
                    saveState.id === 'invalid-name' ? (
                      <fbt desc="Map save error with invalid map name">
                        Invalid map name. Please choose a different map name.
                      </fbt>
                    ) : saveState.id === 'invalid-permission' ? (
                      <fbt desc="Map save error">
                        You do not have permission to change this map.
                      </fbt>
                    ) : saveState.id === 'name-exists' ? (
                      <fbt desc="A map with the same name already exists">
                        A map with this name already exists.
                      </fbt>
                    ) : (
                      getValidationErrorText(saveState.id as ErrorReason)
                    )
                  ) : (
                    saveState.message
                  )}
                </ErrorText>
              )}
            </Notification>
          )}
        </AnimatePresence>
      </Portal>
    </>
  );
}

const size = DoubleSize;
const menuButtonStyle = css`
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  display: -webkit-box;
`;

const mapNameStyle = css`
  margin: 6px 0 0 8px;
`;

const campaignListStyle = css`
  margin-top: ${TileSize}px;
`;

const lightColorStyle = css`
  color: ${applyVar('text-color-light')};
`;

const togglePlaytestButtonStyle = css`
  bottom: calc(${isIOS ? TileSize : 0}px + ${applyVar('inset')});
  color: transparent;
  left: ${applyVar('inset')};
  overflow: hidden;
  transition:
    width 300ms ease,
    color 75ms ease 0ms;
  z-index: ${applyVar('inset-z')};
`;

const iconStyle = css`
  box-sizing: content-box;
  color: ${applyVar('text-color')};
  height: ${size}px;
  position: absolute;
  right: 0;
  top: 0;
`;
