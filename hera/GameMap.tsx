import { Action, execute } from '@deities/apollo/Action.tsx';
import { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import getActionResponseVectors from '@deities/apollo/lib/getActionResponseVectors.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import {
  GameActionResponse,
  GameActionResponses,
} from '@deities/apollo/Types.tsx';
import dropLabels from '@deities/athena/lib/dropLabels.tsx';
import getAverageVector from '@deities/athena/lib/getAverageVector.tsx';
import getDecoratorsAtField from '@deities/athena/lib/getDecoratorsAtField.tsx';
import getFirstHumanPlayer from '@deities/athena/lib/getFirstHumanPlayer.tsx';
import isPvP from '@deities/athena/lib/isPvP.tsx';
import updatePlayers from '@deities/athena/lib/updatePlayers.tsx';
import {
  AnimationConfig,
  DoubleSize,
  FastAnimationConfig,
  MaxSize,
  SlowAnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import {
  PlayerID,
  resolveDynamicPlayerID,
  toPlayerID,
} from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector, { VectorLike } from '@deities/athena/map/Vector.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import { objectiveHasVectors } from '@deities/athena/Objectives.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import dateNow from '@deities/hephaestus/dateNow.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { isIOS } from '@deities/ui/Browser.tsx';
import Input, { NavigationDirection } from '@deities/ui/controls/Input.tsx';
import { rumbleEffect } from '@deities/ui/controls/setupGamePad.tsx';
import throttle from '@deities/ui/controls/throttle.tsx';
import cssVar, { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import { ScrollRestore } from '@deities/ui/hooks/useScrollRestore.tsx';
import scrollToCenter from '@deities/ui/lib/scrollToCenter.tsx';
import { ScrollContainerClassName } from '@deities/ui/ScrollContainer.tsx';
import { css, cx, keyframes } from '@emotion/css';
import ImmutableMap from '@nkzw/immutable-map';
import { AnimatePresence } from 'framer-motion';
import React, {
  Component,
  createRef,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
} from 'react';
import processActionResponses from './action-response/processActionResponse.tsx';
import BaseBehavior from './behavior/Base.tsx';
import { resetBehavior, setBaseClass } from './behavior/Behavior.tsx';
import MenuBehavior from './behavior/Menu.tsx';
import NullBehavior from './behavior/NullBehavior.tsx';
import Cursor from './Cursor.tsx';
import MapEditorExtraCursors from './editor/MapEditorMirrorCursors.tsx';
import { EditorState } from './editor/Types.tsx';
import ActionError from './lib/ActionError.tsx';
import addEndTurnAnimations from './lib/addEndTurnAnimations.tsx';
import isInView from './lib/isInView.tsx';
import maskClassName, { MaskPointerClassName } from './lib/maskClassName.tsx';
import sleep from './lib/sleep.tsx';
import MapComponent from './Map.tsx';
import { Animation, Animations, MapAnimations } from './MapAnimations.tsx';
import Mask from './Mask.tsx';
import MaskWithSubtiles from './MaskWithSubtiles.tsx';
import Radius, { RadiusInfo, RadiusType } from './Radius.tsx';
import {
  Actions,
  ActionsProcessedEventDetail,
  AnimationConfigs,
  GameInfoState,
  GetLayerFunction,
  MapBehavior,
  MapEnterType,
  Props,
  State,
  StateLike,
  TimerID,
  TimerState,
} from './Types.tsx';
import GameDialog from './ui/GameDialog.tsx';
import MapPerformanceMetrics from './ui/MapPerformanceMetrics.tsx';
import NamedPosition from './ui/NamedPosition.tsx';

setBaseClass(BaseBehavior);

const baseZIndex = 20;
const liveInterval = 15_000;
const waitingInterval = 60_000;

const layerOffset = 6;
const layerOffsets = {
  /* eslint-disable sort-keys-fix/sort-keys-fix */
  building: 0,
  radius: 1,
  decorator: 2,
  unit: 3,
  animation: 4,
  top: 5,
  /* eslint-enable sort-keys-fix/sort-keys-fix */
} as const;

const getLayer: GetLayerFunction = (y, type) =>
  baseZIndex + y * layerOffset + layerOffsets[type];

const hasShake = (animations: Animations) =>
  animations.some(({ type }) => type === 'shake');

const spectatorCodeToPlayerID = (spectatorCode: string) => {
  const maybePlayerID = parseInteger(spectatorCode.split('-')[0]);
  return maybePlayerID ? toPlayerID(maybePlayerID) : null;
};

const getVision = (
  map: MapData,
  currentViewer: PlayerID | null,
  spectatorCodes: ReadonlyArray<string> | undefined,
) =>
  map.createVisionObject(
    currentViewer ||
      (spectatorCodes?.length && spectatorCodeToPlayerID(spectatorCodes[0])) ||
      (!isPvP(map) && getFirstHumanPlayer(map)?.id) ||
      0,
  );

const showNamedPositionsForBehavior = new Set([
  'base',
  'design',
  'entity',
  'move',
  'null',
  'vector',
]);

const effectTypes = [
  RadiusType.Effect1,
  RadiusType.Effect2,
  RadiusType.Effect3,
];
const escortTypes = [
  RadiusType.Escort1,
  RadiusType.Escort2,
  RadiusType.Escort3,
];
const toRadiusInfo = (vectors: ReadonlyArray<Vector>, type: RadiusType) => ({
  fields: new Map(vectors.map((vector) => [vector, RadiusItem(vector)])),
  path: [],
  type,
});

const getEffectState = (map: MapData, effects: Effects | undefined) => {
  if (!effects) {
    return null;
  }

  let extraUnits = ImmutableMap<Vector, Unit>();
  const radius: Array<RadiusInfo> = [];
  let id = 0;
  for (const [, effectList] of effects) {
    for (const effect of effectList) {
      for (const action of effect.actions) {
        if (action.type === 'SpawnEffect') {
          const { player: dynamicPlayer, units } = action;
          const player =
            dynamicPlayer != null
              ? resolveDynamicPlayerID(map, dynamicPlayer)
              : null;
          extraUnits = extraUnits.merge(
            units.map((unit) =>
              player != null ? unit.setPlayer(player) : unit,
            ),
          );
          radius.push(toRadiusInfo([...units.keys()], effectTypes[id]));
          id = (id + 1) % 3;
        }
      }
    }
  }
  return radius.length ? { extraUnits, radius } : null;
};
const getObjectiveRadius = (
  { config: { objectives } }: MapData,
  currentViewer: PlayerID | null,
  isEditor: boolean,
) => {
  const radiusItems: Array<RadiusInfo> = [];
  let id = 0;
  for (const [, ojective] of objectives) {
    if (
      (!isEditor && ojective.hidden) ||
      !objectiveHasVectors(ojective) ||
      (currentViewer != null && ojective.completed?.has(currentViewer))
    ) {
      continue;
    }

    radiusItems.push(toRadiusInfo([...ojective.vectors], escortTypes[id]));
    id = (id + 1) % 3;
  }
  return radiusItems;
};

const getInlineUIState = (map: MapData, tileSize: number, scale: number) =>
  !isIOS &&
  window.innerWidth > scale * (map.size.width + 2) * tileSize &&
  window.innerHeight > scale * (map.size.height + 4) * tileSize;

const getInitialState = (props: Props) => {
  const {
    behavior: baseBehavior,
    buildingSize,
    currentUserId,
    editor,
    effects,
    lastActionResponse,
    lastActionTime,
    map,
    mapName,
    paused,
    scale,
    spectatorCodes,
    tileSize,
    timeout,
    unitSize,
    userDisplayName,
  } = props;
  const isEditor = !!editor;
  const currentViewer = map.getPlayerByUserId(currentUserId)?.id || null;
  const behavior: MapBehavior | null =
    lastActionResponse?.type === 'GameEnd'
      ? new NullBehavior()
      : baseBehavior === null
        ? null
        : baseBehavior
          ? new baseBehavior()
          : new BaseBehavior();

  const vision = getVision(map, currentViewer, spectatorCodes);
  const newState = {
    additionalRadius: null,
    animationConfig:
      (Array.isArray(props.animationConfig)
        ? props.animationConfig[map.getCurrentPlayer().isHumanPlayer() ? 1 : 0]
        : props.animationConfig) || AnimationConfig,
    animations: ImmutableMap() as Animations,
    attackable: null,
    behavior,
    buildingSize,
    confirmAction: null,
    currentUserId,
    currentViewer,
    effectState: getEffectState(map, effects),
    factionNames: props.factionNames,
    gameInfoState: null,
    initialBehaviorClass: baseBehavior,
    inlineUI: getInlineUIState(map, tileSize, scale),
    lastActionResponse: lastActionResponse || null,
    lastActionTime: lastActionTime || undefined,
    map: isEditor ? map : vision.apply(dropLabels(map)),
    mapName,
    namedPositions: null,
    navigationDirection: null,
    objectiveRadius: getObjectiveRadius(map, currentViewer, isEditor),
    paused: paused || false,
    position: null,
    preventRemoteActions: false,
    previousPosition: null,
    radius: null,
    replayState: {
      isLive: false,
      isPaused: false,
      isReplaying: false,
      isWaiting: false,
      pauseStart: null,
    },
    selectedAttackable: null,
    selectedBuilding: null,
    selectedPosition: null,
    selectedUnit: null,
    showCursor: props.showCursor,
    tileSize,
    timeout: timeout || null,
    unitSize,
    userDisplayName,
    vision,
    zIndex: getLayer(map.size.height + 1, 'top') + 10,
  };
  return {
    ...newState,
    ...behavior?.activate?.(newState),
  };
};

const getScale = (scale: number | undefined, element: HTMLElement) =>
  scale ||
  parseInteger(getComputedStyle(element).getPropertyValue(cssVar('scale'))) ||
  2;

type NativeTimeout = ReturnType<typeof setTimeout> | null;

export default class GameMap extends Component<Props, State> {
  static defaultProps = {
    buildingSize: TileSize,
    confirmActionStyle: 'touch',
    scroll: true,
    showCursor: true,
    tileSize: TileSize,
    unitSize: TileSize,
  };

  private _actionQueue: Promise<void> | null = null;
  private _actions: Actions;
  private _animationConfigs: AnimationConfigs;
  private _controlListeners: Array<() => void> = [];
  private _isFastForward = { current: false };
  private _isTouch = { current: false };
  private _lastEnteredPosition: Vector | null = null;
  private _liveTimer: NativeTimeout = null;
  private _maskRef = createRef<HTMLDivElement>();
  private _pointerEnabled = true;
  private _pointerLock = { current: false };
  private _pointerPosition: {
    clientX: number;
    clientY: number;
    distance: number;
    initial: boolean;
  } | null = null;
  private _releasePointerLock: NativeTimeout = null;
  private _resolvers: Array<() => void>;
  private _timers: Set<TimerState>;
  private _waitingTimer: NativeTimeout = null;
  private _wrapperRef = createRef<HTMLDivElement>();

  constructor(props: Props) {
    super(props);

    this.state = getInitialState(props);
    const animationConfig = props.animationConfig as AnimationConfig;
    this._animationConfigs = Array.isArray(props.animationConfig)
      ? (props.animationConfig as AnimationConfigs)
      : [
          animationConfig || AnimationConfig,
          animationConfig || AnimationConfig,
          animationConfig || FastAnimationConfig,
          animationConfig || FastAnimationConfig,
        ];
    this._timers = new Set();
    this._resolvers = [];
    this._actions = {
      action: this._action,
      clearTimer: this._clearTimer,
      fastForward: this._fastForward,
      optimisticAction: this._optimisticAction,
      pauseReplay: this._pauseReplay,
      processGameActionResponse: this.processGameActionResponse,
      requestFrame: this._requestFrame,
      resetPosition: this._resetPosition,
      resumeReplay: this._resumeReplay,
      scheduleTimer: this._scheduleTimer,
      scrollIntoView: this._scrollIntoView,
      setEditorState: this._updateEditorState,
      showGameInfo: this._showGameInfo,
      throwError: this._throwError,
      update: this._update,
    };
  }

  static getDerivedStateFromProps(props: Props, state: State) {
    let newState: State | null = null;
    if ('behavior' in props && props.behavior !== state.initialBehaviorClass) {
      const BehaviorClass = props.behavior;
      const behavior = BehaviorClass ? new BehaviorClass() : null;
      newState = {
        ...(newState || state),
        behavior,
        initialBehaviorClass: BehaviorClass,
        ...state.behavior?.deactivate?.(),
      };
      newState = {
        ...newState,
        ...behavior?.activate?.(newState as State),
      };
    }

    if ('scale' in props) {
      newState = {
        ...(newState || state),
        inlineUI: getInlineUIState(state.map, state.tileSize, props.scale),
      };
    }

    if ('paused' in props && props.paused !== state.paused) {
      newState = {
        ...(newState || state),
        paused: !!props.paused,
      };
    }

    if ('effects' in props) {
      newState = {
        ...(newState || state),
        effectState: getEffectState((newState || state).map, props.effects),
      };
    }

    if (props.dangerouslyApplyExternalState) {
      newState = {
        ...(newState || state),
        map: props.editor ? props.map : dropLabels(props.map),
        vision: getVision(
          props.map,
          (newState || state).currentViewer,
          props.spectatorCodes,
        ),
      };
    }

    return newState;
  }

  override componentDidMount() {
    const {
      props: { editor, events, inset, onAction, scroll },
      state: { animationConfig, behavior, lastActionResponse, map, paused },
    } = this;

    if (scroll) {
      const container =
        (inset &&
          this._maskRef.current?.closest(`.${ScrollContainerClassName}`)) ||
        window;
      if (container === window) {
        (this.context as MutableRefObject<boolean>).current = true;
      }
      scrollToCenter(container);
    }

    this._actionQueue = Promise.resolve().then(async () => {
      if (!paused && !editor && onAction && behavior?.type === 'base') {
        if (!lastActionResponse) {
          await this._update(resetBehavior(NullBehavior));
          await this.processGameActionResponse(
            await onAction({ type: 'Start' }),
          );
        } else if (lastActionResponse.type === 'EndTurn') {
          await sleep(this._scheduleTimer, animationConfig, 'long');
          const { funds, id: player } = map.getCurrentPlayer();
          await new Promise<void>((resolve) =>
            this._update({
              ...addEndTurnAnimations(
                this._actions,
                {
                  current: { funds, player },
                  next: { funds, player },
                  round: map.round,
                  type: 'EndTurn',
                },
                this.state,
                null,
                (state) => {
                  resolve();
                  return {
                    ...state,
                    ...resetBehavior(this.props.behavior),
                  };
                },
              ),
            }),
          );
        }
      }
    });

    this._controlListeners = [
      Input.register('navigate', this._disablePointer, 'menu'),
      Input.register('navigate', this._navigate),
      Input.register('point', this._enablePointer),
      Input.register('accept', async () => {
        const { editor } = this.props;
        const { position, selectedPosition } = this.state;
        const vector = position || selectedPosition;
        if (!vector) {
          return;
        }

        if (editor) {
          this._updateEditorState({ isDrawing: true });
          await this._update((actualState) => {
            const { behavior, position } = actualState;
            return position && behavior?.enter
              ? behavior.enter(position, actualState, this._actions, {
                  ...editor,
                  isDrawing: true,
                })
              : null;
          });
          this._updateEditorState({ isDrawing: false });
        } else {
          this._select(vector);
        }
      }),
      Input.register(
        'cancel',
        (event) =>
          this._cancel(
            this.state.position,
            undefined,
            event.detail?.isEscape || false,
          ),
        'dialog',
      ),
    ];

    if (!this.props.editor) {
      this._controlListeners.push(
        Input.register('tertiary', this._fastForward),
        Input.register('tertiary:released', this._releaseFastForward),
        Input.register('slow', () => {
          if (this.state.animationConfig !== SlowAnimationConfig) {
            this.setState({
              animationConfig: SlowAnimationConfig,
            });
          }
        }),
        Input.register('slow:released', () => {
          if (this.state.animationConfig === SlowAnimationConfig) {
            const isHumanPlayer = this.state.map
              .getCurrentPlayer()
              .isHumanPlayer();
            this.setState({
              animationConfig: this._animationConfigs[isHumanPlayer ? 1 : 0],
            });
          }
        }),
      );
    }

    document.addEventListener('pointermove', this._pointerMove);
    document.addEventListener('mousedown', this._mouseDown);
    document.addEventListener('mouseup', this._mouseUp);
    window.addEventListener('resize', this._resize);
    events?.addEventListener('action', this._processRemoteActionResponse);
  }

  override componentDidUpdate(previousProps: Props) {
    const {
      props: { events },
    } = this;

    if (previousProps.events !== events) {
      if (previousProps.events) {
        previousProps.events.removeEventListener(
          'action',
          this._processRemoteActionResponse,
        );
      }
      events?.addEventListener('action', this._processRemoteActionResponse);
    }
  }

  override componentWillUnmount() {
    const {
      props: { events },
      state: { behavior },
    } = this;

    for (const remove of this._controlListeners) {
      remove();
    }

    document.removeEventListener('pointermove', this._pointerMove);
    document.removeEventListener('mousedown', this._mouseDown);
    document.removeEventListener('mouseup', this._mouseUp);
    window.removeEventListener('resize', this._resize);
    events?.removeEventListener('action', this._processRemoteActionResponse);

    behavior?.deactivate?.();
  }

  // eslint-disable-next-line unicorn/consistent-function-scoping
  private _resize = throttle(() => {
    this.setState({
      inlineUI: getInlineUIState(this.state.map, this.state.tileSize, 0),
    });
  }, 100);

  private _reset = () => {
    const { behavior, position, radius } = this.state;
    if (position && behavior?.type !== 'attackRadius' && !radius?.locked) {
      behavior?.clearTimers?.();
      this.setState({
        position: null,
        radius: !radius || radius.type === RadiusType.Attack ? null : radius,
      });
    }
  };

  private _endGame = async () => {
    const { endGame } = this.props;
    if (endGame) {
      endGame('Lose');
      this._update(resetBehavior(NullBehavior));
    }
  };

  private _disablePointer = () => {
    if (this._pointerEnabled) {
      this._pointerEnabled = false;
      this._maskRef.current?.classList.remove(MaskPointerClassName);
      this._wrapperRef.current?.classList.add('pointerNone');
    }
  };

  private _enablePointer = () => {
    if (!this._pointerEnabled) {
      this._pointerEnabled = true;
      this._maskRef.current?.classList.add(MaskPointerClassName);
      this._wrapperRef.current?.classList.remove('pointerNone');
    }
  };

  private _navigate = ({
    detail: direction,
  }: CustomEvent<NavigationDirection>) => {
    const {
      behavior,
      lastActionResponse,
      map,
      navigationDirection,
      position,
      previousPosition,
      selectedPosition,
    } = this.state;

    if (behavior?.navigate) {
      this.setState({
        navigationDirection: {
          ...direction,
          previousX: navigationDirection?.x,
          previousY: navigationDirection?.y,
        },
      });
    } else if (direction) {
      const origin =
        position ||
        selectedPosition ||
        previousPosition ||
        (lastActionResponse &&
          lastActionResponse.type !== 'EndTurn' &&
          getActionResponseVectors(map, lastActionResponse).at(-1)) ||
        vec(Math.floor(map.size.width / 2), Math.floor(map.size.height / 2));
      const vector = vec(origin.x + direction.x, origin.y + direction.y);
      this._enter(vector);
      this._scrollIntoView([vector], direction);
    }
  };

  private _enter = (
    vector: Vector,
    subVector?: Vector,
    type: MapEnterType = 'synthetic',
  ) => {
    if (
      type === 'pointer' &&
      (!this._pointerEnabled || this._pointerLock.current)
    ) {
      this._lastEnteredPosition = vector;
      return;
    }

    const { map, position, radius } = this.state;
    if (!map.contains(vector) || radius?.locked) {
      return;
    }

    if (!vector.equals(position)) {
      this.setState({
        position: vector,
        previousPosition: position,
      });
    }

    this._update((actualState) => {
      const { behavior, replayState } = actualState;
      if (!replayState.isReplaying) {
        const newState = behavior?.enter
          ? behavior.enter(
              vector,
              actualState,
              this._actions,
              this.props.editor,
              subVector,
            )
          : null;
        if (newState) {
          return newState;
        }
      }
      return null;
    });
  };

  private _shouldConfirmAction() {
    const { confirmActionStyle } = this.props;
    return (
      confirmActionStyle === 'always' ||
      (confirmActionStyle === 'touch' && !!this._isTouch.current)
    );
  }

  private _select = (vector: Vector, subVector?: Vector) => {
    if (this._pointerLock.current) {
      this._pointerLock.current = false;
      this._isTouch.current = false;
      return;
    }

    this._update((actualState) => {
      const { behavior, replayState } = actualState;
      if (!replayState.isReplaying) {
        const newState = behavior?.select
          ? behavior.select(
              vector,
              actualState,
              this._actions,
              this.props.editor,
              subVector,
              this._shouldConfirmAction(),
            )
          : null;
        if (newState) {
          const { selectedPosition } = newState;
          const hasBehaviorChange =
            newState.behavior?.type !== actualState.behavior?.type;
          if (
            (newState.selectedUnit || newState.selectedBuilding) &&
            (hasBehaviorChange ||
              (selectedPosition &&
                !actualState.selectedPosition?.equals(selectedPosition)))
          ) {
            AudioPlayer.playSound('UI/Accept');
            rumbleEffect('accept');
          } else if (
            hasBehaviorChange &&
            !selectedPosition &&
            actualState.selectedPosition
          ) {
            AudioPlayer.playSound('UI/Cancel');
          }

          return newState;
        }
      }
      this._isTouch.current = false;
      return null;
    });
  };

  private _cancel = (
    vector: Vector | null,
    transformOrigin: string | undefined,
    isEscape: boolean,
  ) => {
    if (this.state.behavior?.type === 'null') {
      return;
    }

    this._update((state) => {
      const newState = {
        ...state.behavior?.deactivate?.(),
        ...resetBehavior(
          state.lastActionResponse?.type === 'GameEnd'
            ? NullBehavior
            : this.props.behavior,
        ),
      };

      if (
        state.gameInfoState ||
        newState.behavior?.type !== state.behavior?.type
      ) {
        AudioPlayer.playSound('UI/Cancel');
      }

      if (state.gameInfoState) {
        return this._resetGameInfoState();
      }

      if (
        !isEscape &&
        !this.props.editor &&
        newState.behavior?.type === state.behavior?.type &&
        vector
      ) {
        requestAnimationFrame(() =>
          this._showFieldInfo(vector, transformOrigin || 'center center'),
        );
        return null;
      }

      return newState;
    });
  };

  private _update = (
    newState: StateLike | null | ((state: State) => StateLike | null),
  ): Promise<State> => {
    return new Promise((resolve) => {
      if (!newState) {
        resolve(this.state);
        return;
      }
      this.setState(
        (actualState: State) => {
          if (typeof newState === 'function') {
            newState = newState(actualState);
          }
          if (!newState) {
            return actualState;
          }

          const newBehavior = newState.behavior;
          const oldBehavior = this.state.behavior;
          if (newBehavior && newBehavior !== oldBehavior) {
            newState = {
              ...this.state,
              ...oldBehavior?.deactivate?.(),
              ...newState,
            };
            if (newBehavior.activate) {
              Object.assign(
                newState,
                newBehavior.activate(
                  newState as State,
                  this._actions,
                  this._shouldConfirmAction(),
                ),
              );
            }
          }
          if (
            newState.position &&
            !(newState.map || actualState.map).contains(newState.position)
          ) {
            newState = {
              ...newState,
              position: null,
            };
          }
          if (
            (newState.currentViewer &&
              newState.currentViewer !== this.state.currentViewer) ||
            (newState.map &&
              newState.map.config.fog !== this.state.map.config.fog)
          ) {
            newState = {
              ...newState,
              vision: getVision(
                newState.map || this.state.map,
                newState.currentViewer || this.state.currentViewer,
                this.props.spectatorCodes,
              ),
            };
          }
          if (
            (newState.map && newState.map !== this.state.map) ||
            (newState.currentUserId &&
              newState.currentUserId !== this.state.currentUserId)
          ) {
            newState = {
              ...newState,
              currentViewer: (newState.map || this.state.map).getPlayerByUserId(
                newState.currentUserId || this.state.currentUserId,
              )?.id,
            };
          }

          if (
            newState.map &&
            newState.map !== this.state.map &&
            newState.map.config.objectives !== this.state.map.config.objectives
          ) {
            newState = {
              ...newState,
              objectiveRadius: getObjectiveRadius(
                newState.map,
                newState.currentViewer ?? this.state.currentViewer,
                !!this.props.editor,
              ),
            };
          }

          if (this.state.position && !newState.position) {
            newState = {
              ...newState,
              previousPosition: this.state.position,
            };
          }

          return newState as State;
        },
        () => resolve(this.state),
      );
    });
  };

  private _action = (
    state: State,
    action: Action,
  ): [Promise<GameActionResponse>, MapData, ActionResponse] => {
    try {
      const { onAction } = this.props;
      const { lastActionResponse, map, preventRemoteActions, vision } = state;
      if (lastActionResponse?.type === 'GameEnd') {
        throw new Error(
          `Action: Cannot issue actions for a game that has ended.\nAction: '${JSON.stringify(action)}'`,
        );
      }

      if (preventRemoteActions) {
        const { currentViewer } = state;
        const player = map.getCurrentPlayer();
        throw new Error(
          `Action: Cannot issue actions while processing remote actions. Current Viewer: '${currentViewer}'\nCurrent Player: '${player.id} (${player.isHumanPlayer() ? 'human' : 'bot'})'\nAction: '${JSON.stringify(action)}'`,
        );
      }

      const actionResult = execute(
        map,
        vision,
        action,
        this.props.mutateAction,
      );
      if (!actionResult) {
        throw new ActionError(action, map);
      }

      const [actionResponse, newMap] = actionResult;
      const remoteAction =
        onAction?.(action).catch((error) => {
          this._throwError(error);
          return { self: null };
        }) || Promise.resolve({ self: { actionResponse } });
      return [remoteAction, newMap, actionResponse];
    } catch (error) {
      this._throwError(error as Error);
    }

    throw new Error(
      `Action: Unhandled error when executing action '${action.type}'.`,
    );
  };

  private _optimisticAction = (
    state: State,
    action: Action,
  ): ActionResponse => {
    const [remoteAction, , actionResponse] = this._action(state, action);
    remoteAction.then(this.processGameActionResponse);
    return actionResponse;
  };

  private processGameActionResponse = async (
    gameActionResponse: GameActionResponse,
  ): Promise<State> => {
    let { state } = this;
    const { others, self, timeout: newTimeout } = gameActionResponse;
    if (!self && !others?.length && newTimeout === undefined) {
      return state;
    }

    const timeout = newTimeout !== undefined ? newTimeout : state.timeout;
    if (self) {
      const { actionResponse } = self;
      if (actionResponse.type === 'Start') {
        state = await this._processActionResponses([self]);
        if (others?.length) {
          // Keep the map disabled until other actions are executed.
          state = await this._update(resetBehavior(NullBehavior));
        }
      } else if (actionResponse.type === 'EndTurn') {
        const { map } = this.state;
        const { current, next } = actionResponse;

        // The turn was likely ended through a turn timeout.
        if (map.getCurrentPlayer().id !== next.player) {
          state = await this._processActionResponses([self]);
        } else {
          const currentPlayer = map.getPlayer(current.player);
          const nextPlayer = map.getPlayer(next.player);
          if (
            currentPlayer.funds !== current.funds ||
            nextPlayer.funds !== next.funds ||
            map.getCurrentPlayer().id !== next.player
          ) {
            state = await this._update({
              lastActionResponse: actionResponse,
              lastActionTime: dateNow(),
              map: map.copy({
                currentPlayer: next.player,
                teams: updatePlayers(map.teams, [
                  currentPlayer.setFunds(current.funds),
                  nextPlayer.setFunds(next.funds),
                ]),
              }),
            });
          }
        }
      }

      if (state.map.config.fog && (self.buildings || self.units)) {
        state = await this._update((state) => ({
          // Ensure that attack action buttons are shown if attackable units
          // are now in range.
          ...(state.behavior?.type === 'menu'
            ? { behavior: new MenuBehavior() }
            : null),
          map: updateVisibleEntities(state.map, state.vision, self),
        }));
      }

      // No need to keep processing if there are no other action responses.
      if (!others) {
        return new Promise((resolve) => {
          this.setState(
            () => ({
              lastActionResponse: actionResponse,
              lastActionTime: dateNow(),
              timeout,
            }),
            () => resolve(this.state),
          );
        });
      }
    }

    if (others?.length) {
      // If there are self and other actions at the same time, wait before processing the other actions.
      if (self) {
        await sleep(this._scheduleTimer, this.state.animationConfig, 'long');
      }

      state = await this._processActionResponses(others);
    }

    if (timeout) {
      state = await this._update({ timeout });
    }

    return {
      ...state,
      timeout,
    };
  };

  private _processActionResponses = async (
    gameActionResponses: GameActionResponses,
  ): Promise<State> => {
    return new Promise((resolve) => {
      this._clearReplayTimers();

      this._resolvers = [];
      this._timers = new Set();

      const { currentViewer, map } = this.state;
      const currentPlayer = map.getCurrentPlayer();
      const isLive = currentViewer !== currentPlayer.id;
      this.setState(
        {
          ...this._resetGameInfoState(),
          animationConfig: this._isFastForward.current
            ? this.state.animationConfig
            : this._animationConfigs[currentPlayer.isHumanPlayer() ? 1 : 0],
          preventRemoteActions: true,
          replayState: {
            isLive,
            isPaused: false,
            isReplaying: isLive,
            isWaiting: false,
            pauseStart: null,
          },
        },
        async () => {
          const { currentViewer } = this.state;
          const { behavior, onError } = this.props;
          try {
            await processActionResponses(
              this.state,
              this._actions,
              gameActionResponses,
              this._animationConfigs,
              this._isFastForward,
              this.props.playerHasReward || (() => false),
            );
          } catch (error) {
            if (onError) {
              onError(error as Error);
              resolve(this.state);

              return;
            } else {
              throw error;
            }
          }
          this._resolvers = [];
          this._timers = new Set();

          const lastActionResponse = gameActionResponses.at(-1)!.actionResponse;
          const currentPlayer = this.state.map.getCurrentPlayer();
          const isLive =
            lastActionResponse.type !== 'GameEnd' &&
            (lastActionResponse.type !== 'EndTurn' ||
              lastActionResponse.next.player !== currentViewer) &&
            currentViewer !== currentPlayer.id;

          this.setState(
            {
              ...(resetBehavior(this.props.behavior) as State),
              animationConfig: this._isFastForward.current
                ? this.state.animationConfig
                : this._animationConfigs[currentPlayer.isHumanPlayer() ? 1 : 0],
              behavior:
                lastActionResponse.type === 'GameEnd'
                  ? new NullBehavior()
                  : behavior
                    ? new behavior()
                    : new BaseBehavior(),
              lastActionResponse,
              position: !this._pointerEnabled
                ? this.state.previousPosition
                : null,
              preventRemoteActions: false,
              replayState: {
                isLive,
                isPaused: false,
                isReplaying: false,
                isWaiting: false,
                pauseStart: null,
              },
            },
            () => {
              if (isLive) {
                this._liveTimer = setTimeout(this._liveTimerFn, liveInterval);
              }

              const detail: ActionsProcessedEventDetail = {
                gameActionResponses,
                map: this.state.map,
              };
              this.props.events?.dispatchEvent(
                new CustomEvent('actionsProcessed', {
                  detail,
                }),
              );
              resolve(this.state);
            },
          );
        },
      );
    });
  };

  private _liveTimerFn = () =>
    this.setState((state) => {
      const { currentViewer, map } = state;
      const isWaitingOnHumanPlayer =
        (!currentViewer || !map.isCurrentPlayer(currentViewer)) &&
        map.getCurrentPlayer().isHumanPlayer();

      if (isWaitingOnHumanPlayer) {
        this._waitingTimer = setTimeout(this._waitingTimerFn, waitingInterval);
      }

      return {
        replayState: {
          ...state.replayState,
          isLive: false,
          isWaiting: true,
        },
      };
    });

  private _waitingTimerFn = () =>
    this.setState((state) => {
      return {
        replayState: {
          ...state.replayState,
          isWaiting: false,
        },
      };
    });

  private _processRemoteActionResponse = async (
    event: Event,
  ): Promise<void> => {
    if (this.state.replayState.isPaused) {
      return new Promise((resolve) =>
        this._resolvers.push(() =>
          this._processRemoteActionResponse(event).then(resolve),
        ),
      );
    }

    const gameActionResponse = (event as CustomEvent<GameActionResponse>)
      .detail;
    const queue = (this._actionQueue = (
      this._actionQueue || Promise.resolve()
    ).then(async () => {
      const { animationConfig, animations } =
        await this.processGameActionResponse(gameActionResponse);

      if (animations.size) {
        // Some animations like HealthAnimation do not have an `onComplete` callback.
        // This delay gives these animations a chance to finish before continuing to process the queue.
        await new Promise((resolve) =>
          setTimeout(resolve, animationConfig.AnimationDuration * 3),
        );
      }
    }));
    return queue;
  };

  private _animationComplete = (position: Vector, animation: Animation) => {
    const currentAnimation = this.state.animations.get(position);
    if (currentAnimation && currentAnimation !== animation) {
      throw new Error(
        `Animation at position '${position}' changed unexpectedly:\nExpected: ${JSON.stringify(
          animation,
          null,
          2,
        )}\nReceived: ${JSON.stringify(
          this.state.animations.get(position),
          null,
          2,
        )}`,
      );
    }

    if ('onComplete' in animation && animation.onComplete) {
      const onComplete = animation.onComplete;
      this._update((state) => {
        const animations = state.animations.delete(position);
        return {
          animations,
          ...onComplete({
            ...state,
            animations,
          }),
        };
      });
    } else {
      this.setState((state) => ({
        animations: state.animations.delete(position),
      }));
    }
  };

  private _clearReplayTimers = () => {
    if (this._liveTimer) {
      clearTimeout(this._liveTimer);
    }
    this._liveTimer = null;

    if (this._waitingTimer) {
      clearTimeout(this._waitingTimer);
    }
    this._waitingTimer = null;
  };

  private _pauseReplay = async () => {
    this._clearReplayTimers();
    const pauseStart = dateNow();
    const timers = new Set<TimerState>();
    for (const timer of this._timers) {
      clearTimeout(timer.timer);
      timers.add({
        ...timer,
        delay: pauseStart - timer.start,
      });
    }
    this._timers = timers;

    await this._update({
      replayState: {
        ...this.state.replayState,
        isPaused: true,
        isWaiting: false,
        pauseStart,
      },
    });
  };

  private _resumeReplay = async () => {
    this._clearReplayTimers();

    await this._update({
      replayState: {
        ...this.state.replayState,
        isPaused: false,
        isWaiting: false,
        pauseStart: dateNow(),
      },
    });

    this._resolvers.forEach((resolve) => resolve());
    this._resolvers = [];
    const timers = new Set<TimerState>();
    for (const { delay, fn } of this._timers) {
      const timerObject = {
        delay,
        fn,
        start: dateNow(),
        timer: window.setTimeout(() => {
          this._timers.delete(timerObject);
          this._update(fn.call(null, this.state));
        }, delay),
      };
      timers.add(timerObject);
    }
    this._timers = timers;
  };

  private _fastForward = () => {
    if (!this._isFastForward.current) {
      this._isFastForward.current = true;
      const { map } = this.state;
      const animationConfig =
        this._animationConfigs[map.getCurrentPlayer().isHumanPlayer() ? 3 : 2];
      if (this.state.animationConfig !== animationConfig) {
        this.setState({
          animationConfig,
        });
      }
    }

    return this._releaseFastForward;
  };

  private _releaseFastForward = () => {
    this._isFastForward.current = false;
    const isHumanPlayer = this.state.map.getCurrentPlayer().isHumanPlayer();
    const animationConfig = this._animationConfigs[isHumanPlayer ? 3 : 2];
    if (this.state.animationConfig === animationConfig) {
      this.setState({
        animationConfig: this._animationConfigs[isHumanPlayer ? 1 : 0],
      });
    }
  };

  private _clearTimer = (timer: number | TimerID) => {
    Promise.resolve(timer).then((timer) => {
      window.clearTimeout(timer);
      for (const timerObject of this._timers) {
        if (timerObject.timer === timer) {
          this._timers.delete(timerObject);
          break;
        }
      }
    });
  };

  private _scheduleTimer = async (
    // eslint-disable-next-line @typescript-eslint/ban-types
    fn: Function,
    delay: number,
  ): Promise<number> => {
    const { replayState } = this.state;
    if (replayState.isPaused) {
      let _resolve: () => void;
      const promise = new Promise<void>((resolve) => {
        _resolve = resolve;
      }).then(() => this._scheduleTimer(fn, delay));
      requestAnimationFrame(() => this._resolvers.push(_resolve));
      return promise;
    }

    const timer = window.setTimeout(() => {
      this._timers.delete(timerObject);
      this._update({
        ...fn.call(null, this.state),
        replayState: {
          ...this.state.replayState,
        },
      });
    }, delay);
    const timerObject = {
      delay,
      fn,
      start: dateNow(),
      timer,
    };
    this._timers = this._timers.add(timerObject);
    return timer;
  };

  private _requestFrame = (fn: (timestamp: number) => void): number => {
    const { replayState } = this.state;
    if (replayState.isPaused) {
      let _resolve: () => void;
      new Promise<void>((resolve) => {
        _resolve = () => resolve();
      }).then(() => fn(dateNow() - replayState.pauseStart!));
      requestAnimationFrame(() => this._resolvers.push(_resolve));
      return 0;
    }
    return requestAnimationFrame(fn);
  };

  private _resetPosition = () => {
    const { position, radius } = this.state;
    if (position && !radius?.locked) {
      this.setState({ position: null });
    }
  };

  private _updateEditorState = (editor: Partial<EditorState>) =>
    this.props.setEditorState?.(editor);

  private _throwError = (error: Error) => this.props.onError?.(error);

  private _showGameInfo = (gameInfoState: GameInfoState) =>
    this.setState((state) => ({
      gameInfoState: {
        ...gameInfoState,
        ...(gameInfoState.type === 'game-info'
          ? { panels: this.props.gameInfoPanels }
          : null),
      },
      namedPositions: null,
      paused: true,
      position: null,
      previousPosition: state.position,
      radius:
        state.behavior?.type === 'base' &&
        state.radius?.type === RadiusType.Attack
          ? null
          : state.radius,
    }));

  private _showFieldInfo = (vector: Vector, origin: string) => {
    const { behavior, lastActionResponse, map, vision } = this.state;
    if (behavior?.type === 'null' && lastActionResponse?.type !== 'GameEnd') {
      return;
    }

    const unit = vector && map.units.get(vector);
    const building = vector && map.buildings.get(vector);
    const tile = vector && map.getTileInfo(vector);
    if (unit || building || tile) {
      if (behavior?.type === 'base') {
        behavior.clearTimers?.();
      }
      AudioPlayer.playSound('UI/LongPress');
      this._showGameInfo({
        building: vision.isVisible(map, vector)
          ? building
          : building?.hide(map.config.biome, true),
        decorators: getDecoratorsAtField(map, vector),
        modifierField: map.modifiers[map.getTileIndex(vector)],
        origin,
        tile,
        type: 'map-info',
        unit: vision.isVisible(map, vector) ? unit : null,
        vector,
      });
    }
  };

  private _resetGameInfoState = () => ({
    gameInfoState: null,
    paused: this.props.paused === true || false,
    position: !this._pointerEnabled ? this.state.previousPosition : null,
  });

  private _hideGameInfo = () =>
    new Promise<void>((resolve) => {
      AudioPlayer.playSound('UI/Cancel');
      this.setState(this._resetGameInfoState(), resolve);
    });

  private _pointerDown = (event: ReactPointerEvent) => {
    this._isTouch.current = event.pointerType === 'touch';
  };

  private _pointerMove = (event: PointerEvent) => {
    this._enablePointer();

    if (!this.props.pan || !this._pointerPosition) {
      return;
    }

    const element = this._maskRef.current;
    if (
      event.pointerType === 'touch' ||
      !element ||
      (event.target as HTMLElement)?.parentNode !== element
    ) {
      return;
    }

    const {
      map: {
        size: { height, width },
      },
      tileSize,
    } = this.state;
    const multiplier = (0.03 * (width + height)) / 2 + 0.85;
    const { clientX, clientY } = event;
    const distanceX = this._pointerPosition.clientX - clientX;
    const distanceY = this._pointerPosition.clientY - clientY;
    const distance = Math.abs(distanceX) + Math.abs(distanceY);
    if (this._pointerPosition.initial && distance < tileSize) {
      return;
    }

    this._pointerLock.current = true;
    window.scrollBy(distanceX * multiplier, distanceY * multiplier);

    this._pointerPosition = {
      clientX,
      clientY,
      distance: this._pointerPosition.distance + distance,
      initial: false,
    };
  };

  private _clearPanState = () => {
    this._lastEnteredPosition = null;
    this._pointerPosition = null;
    if (this._releasePointerLock) {
      clearTimeout(this._releasePointerLock);
    }
    this._releasePointerLock = setTimeout(() => {
      this._pointerLock.current = false;
    }, 100);
    document.removeEventListener('mouseleave', this._clearPanState);
  };

  private _mouseDown = (event: MouseEvent) => {
    this._pointerPosition = {
      clientX: event.clientX,
      clientY: event.clientY,
      distance: 0,
      initial: true,
    };
    document.addEventListener('mouseleave', this._clearPanState);

    const { editor } = this.props;
    if (
      editor &&
      this.state.position &&
      (event.target as HTMLElement)?.parentNode === this._maskRef.current
    ) {
      if (event.shiftKey || event.button === 2) {
        this._update((actualState) => {
          const { behavior, position } = actualState;
          return position && behavior?.enterAlternative
            ? behavior.enterAlternative(
                position,
                actualState,
                this._actions,
                editor!,
              )
            : null;
        });
      } else {
        if (!editor.isDrawing) {
          this._updateEditorState({ isDrawing: true });
        }
        this._update((actualState) => {
          const { behavior, position } = actualState;
          return position && behavior?.enter
            ? behavior.enter(position, actualState, this._actions, {
                ...editor,
                isDrawing: true,
              })
            : null;
        });
      }
    }
  };

  private _mouseUp = () => {
    const { editor } = this.props;
    if (!editor && this._lastEnteredPosition) {
      this._enter(this._lastEnteredPosition);
    }

    this._clearPanState();

    if (editor?.isDrawing) {
      this._updateEditorState({
        isDrawing: false,
      });
    }
  };

  private _getMaskElement = (vector: Vector) => {
    return this._maskRef.current?.querySelector(`.${maskClassName(vector)}`);
  };

  private _scrollIntoView = async (
    vectors: ReadonlyArray<Vector>,
    direction?: VectorLike,
  ) => {
    const mask = this._maskRef.current;
    if (!vectors.length || !mask) {
      return;
    }

    const element = this._getMaskElement(getAverageVector(vectors));
    // Assume that the first and last vectors are the most distant.
    const boundaries =
      vectors.length === 1
        ? [element]
        : [vectors[0], vectors.at(-1)!].map(this._getMaskElement);

    const scale = getScale(this.props.scale, mask);
    if (
      element &&
      !boundaries.some(
        (element) => element && isInView(element, scale, DoubleSize),
      )
    ) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: direction?.x && !direction.y ? 'nearest' : 'center',
        inline: direction?.y && !direction.x ? 'nearest' : 'center',
      });
      return sleep(this._scheduleTimer, this.state.animationConfig, 'long');
    }
  };

  override render() {
    const {
      props: {
        animatedChildren,
        children,
        className,
        editor,
        fogStyle,
        margin,
        playerAchievement,
        scale,
        showCursor: propsShowCursor,
        skipBanners,
        tilted,
      },
      state: {
        additionalRadius,
        animationConfig,
        animations,
        attackable,
        behavior,
        currentViewer,
        effectState,
        gameInfoState,
        lastActionResponse,
        map,
        namedPositions,
        objectiveRadius,
        paused,
        position,
        radius,
        replayState,
        selectedBuilding,
        selectedPosition,
        selectedUnit,
        showCursor,
        tileSize,
        vision,
        zIndex,
      },
    } = this;
    const { height, width } = map.size;

    const isFloating = this.props.style === 'floating';
    const StateComponent = behavior?.component;
    return (
      <div
        className={cx(className, style)}
        style={scale ? { [cssVar('scale')]: scale } : undefined}
      >
        <div
          style={{
            margin: tilted
              ? margin === 'minimal'
                ? `${tileSize * 2}px auto ${tileSize * 4}px`
                : `${tileSize * 8}px ${tileSize * 7 * Math.floor(map.size.height / 4)}px ${
                    isFloating
                      ? tileSize * 5 * Math.floor(map.size.height / 4)
                      : 0
                  }px`
              : isFloating
                ? `${tileSize * 10}px`
                : `${tileSize}px auto 0`,
          }}
        >
          <div
            className={cx(
              mapStyle,
              (replayState.isReplaying && replayState.isPaused) || paused
                ? pausedStyle
                : null,
              tilted && tiltedStyle,
              hasShake(animations) &&
                !replayState.isPaused &&
                !paused &&
                explosionAnimation,
            )}
            onMouseLeave={this._reset}
            onPointerDown={this._pointerDown}
            style={{
              [cssVar('perspective-height')]: Math.max(
                0,
                map.size.height - MaxSize / 2,
              ),
              [cssVar('animation-duration')]:
                `${animationConfig.AnimationDuration}ms`,

              height: tileSize * height,
              width: tileSize * width,
              zoom: applyVar('scale'),
            }}
          >
            <MapComponent
              animationConfig={animationConfig}
              animations={animations}
              attackable={attackable}
              behavior={behavior}
              extraUnits={effectState?.extraUnits}
              fogStyle={fogStyle}
              getLayer={getLayer}
              map={map}
              onAnimationComplete={this._animationComplete}
              paused={paused}
              radius={radius}
              requestFrame={this._requestFrame}
              scheduleTimer={this._scheduleTimer}
              selectedBuilding={selectedBuilding}
              selectedPosition={selectedPosition}
              selectedUnit={selectedUnit}
              style={isFloating ? 'floating' : 'none'}
              tileSize={tileSize}
              vision={vision}
            />
            {objectiveRadius?.map((radius, index) => (
              <Radius
                currentViewer={currentViewer}
                getLayer={() => getLayer(0, 'building')}
                key={index}
                map={map}
                radius={radius}
                size={tileSize}
                vision={vision}
              />
            ))}
            {effectState?.radius.map((radius, index) => (
              <Radius
                currentViewer={currentViewer}
                getLayer={() => getLayer(0, 'unit')}
                key={index}
                map={map}
                radius={radius}
                size={tileSize}
                vision={vision}
              />
            ))}
            {additionalRadius && (
              <Radius
                currentViewer={currentViewer}
                getLayer={getLayer}
                map={map}
                radius={additionalRadius}
                selectedPosition={selectedPosition}
                selectedUnit={selectedUnit}
                size={tileSize}
                vision={vision}
              />
            )}
            {radius && (
              <Radius
                currentViewer={currentViewer}
                getLayer={getLayer}
                map={map}
                radius={radius}
                selectedPosition={selectedPosition}
                // Do not pass the selected unit if we are showing the radius for dropping a transported unit.
                selectedUnit={
                  behavior?.type === 'dropUnit' ? null : selectedUnit
                }
                size={tileSize}
                vision={vision}
              />
            )}
            {(propsShowCursor || propsShowCursor == null) &&
              showCursor &&
              !replayState.isReplaying && (
                <>
                  <Cursor
                    position={position}
                    size={tileSize}
                    zIndex={zIndex - 4}
                  />
                  {editor?.mode === 'design' && (
                    <MapEditorExtraCursors
                      color="red"
                      drawingMode={editor?.drawingMode}
                      mapSize={map.size}
                      origin={position}
                      size={tileSize}
                      zIndex={zIndex}
                    />
                  )}
                </>
              )}
            <MapAnimations
              actions={this._actions}
              animationComplete={this._animationComplete}
              getLayer={getLayer}
              skipBanners={skipBanners}
              state={this.state}
            />
            {editor?.selected?.decorator ||
            editor?.selected?.eraseDecorators ? (
              <MaskWithSubtiles
                enter={this._enter}
                map={map}
                maskRef={this._maskRef}
                select={this._select}
                tileSize={tileSize}
                zIndex={zIndex - 2}
              />
            ) : (
              <Mask
                attackable={attackable}
                cancel={this._cancel}
                currentViewer={currentViewer}
                enter={this._enter}
                expand={!editor}
                map={map}
                maskRef={this._maskRef}
                pointerLock={this._pointerLock}
                radius={radius}
                select={this._select}
                selectedPosition={selectedPosition}
                showFieldInfo={editor ? () => void 0 : this._showFieldInfo}
                tileSize={tileSize}
                zIndex={zIndex - 2}
              />
            )}
            <div className={pointerStyle} ref={this._wrapperRef}>
              <AnimatePresence>
                {!behavior || showNamedPositionsForBehavior.has(behavior.type)
                  ? namedPositions?.map((vector) => (
                      <NamedPosition
                        animationConfig={animationConfig}
                        currentViewer={currentViewer}
                        key={`named-position-${vector}`}
                        map={map}
                        tileSize={tileSize}
                        vector={vector}
                        zIndex={zIndex}
                      />
                    ))
                  : null}
                {StateComponent && (
                  <StateComponent
                    actions={this._actions}
                    editor={editor}
                    key="state-component"
                    state={this.state}
                  />
                )}
                {animatedChildren?.(this.state)}
              </AnimatePresence>
              {children?.(this.state, this._actions)}
            </div>
          </div>
          {lastActionResponse?.type === 'GameEnd' &&
            lastActionResponse.toPlayer &&
            currentViewer != null &&
            map.matchesTeam(lastActionResponse.toPlayer, currentViewer) && (
              <MapPerformanceMetrics
                key="performance-metrics"
                map={map}
                player={currentViewer}
                playerAchievement={playerAchievement || null}
                scrollIntoView={this._scrollIntoView}
                zIndex={zIndex}
              />
            )}
        </div>
        {gameInfoState && (
          <GameDialog
            endGame={this.props.endGame ? this._endGame : undefined}
            onClose={this._hideGameInfo}
            state={this.state}
          />
        )}
      </div>
    );
  }
}

GameMap.contextType = ScrollRestore;

const vars = new CSSVariables<'transform'>('m');
const style = css`
  position: relative;
`;

const mapStyle = css`
  ${vars.set('transform', 'none')}

  -webkit-user-drag: none;
  image-rendering: pixelated;
  position: relative;

  transform: ${vars.apply('transform')};

  * {
    animation-play-state: running;
  }
`;

const tiltedStyle = css`
  ${vars.set('transform', applyVar('perspective-transform'))}

  box-shadow: ${applyVar('border-color-light')} 0 8px 10px;
`;

const pausedStyle = css`
  * {
    animation-play-state: paused !important;
  }
`;

const pointerStyle = css`
  &.pointerNone * {
    cursor: none !important;
    pointer-events: none !important;
  }
`;

const explosionAnimation = css`
  animation-iteration-count: infinite;
  animation-timing-function: linear;
  animation-delay: calc(${applyVar('animation-duration')} / 4);
  animation-duration: ${applyVar('animation-duration')};
  animation-name: ${keyframes`
    0% {
      transform: ${vars.apply('transform')} translate3d(0, 0, 0);
    }
    25% {
      transform: ${vars.apply('transform')} translate3d(0, 2.5px, 0);
    }
    50% {
      transform: ${vars.apply('transform')} translate3d(0, -2.5px, 0);
    }
    75% {
      transform: ${vars.apply('transform')} translate3d(-1.3px, 0, 0);
    }
    100% {
      transform: ${vars.apply('transform')} translate3d(1.3px, 0, 0);
    }
  `};
`;
