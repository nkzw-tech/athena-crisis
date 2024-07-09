import { Action, MutateActionResponseFn } from '@deities/apollo/Action.tsx';
import {
  ActionResponse,
  ReceiveRewardActionResponse,
} from '@deities/apollo/ActionResponse.tsx';
import { Effects } from '@deities/apollo/Effects.tsx';
import {
  GameActionResponse,
  GameActionResponses,
} from '@deities/apollo/Types.tsx';
import { DecoratorInfo } from '@deities/athena/info/Decorator.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { TileInfo } from '@deities/athena/info/Tile.tsx';
import Building from '@deities/athena/map/Building.tsx';
import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData, { ModifierField } from '@deities/athena/MapData.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import { NavigationDirection } from '@deities/ui/controls/Input.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import type { ReactElement, ReactNode } from 'react';
import { ConfirmProps } from './behavior/confirm/ConfirmAction.tsx';
import { EditorState, SetEditorStateFunction } from './editor/Types.tsx';
import { Animations } from './MapAnimations.tsx';
import { RadiusInfo } from './Radius.tsx';
import { TileStyle } from './Tiles.tsx';

export type Size = Readonly<{
  height: number;
  width: number;
}>;

export type AnimationConfigs = readonly [
  normal: AnimationConfig,
  player: AnimationConfig,
  fast: AnimationConfig,
  fastPlayer: AnimationConfig,
];

export type PlayerHasRewardFunction = (
  map: MapData,
  player: PlayerID,
  actionResponse: ReceiveRewardActionResponse,
) => boolean;

export type PlayerAchievement = Readonly<{ result: string; stars: number }>;

export type Props = Readonly<{
  animatedChildren?: (state: State) => ReactNode;
  animationConfig?: AnimationConfigs | AnimationConfig;
  behavior?: MapBehaviorConstructor | null;
  buildingSize: number;
  children?: (state: State, actions: Actions) => ReactNode;
  className?: string;
  confirmActionStyle: 'always' | 'touch' | 'never';
  currentUserId: string;
  dangerouslyApplyExternalState?: boolean;
  editor?: EditorState;
  effects?: Effects;
  endGame?: (type: 'Lose') => void;
  events?: EventTarget;
  factionNames: FactionNames;
  fogStyle: 'soft' | 'hard';
  gameInfoPanels?: GameInfoPanels;
  inset?: number;
  lastActionResponse?: ActionResponse | null;
  lastActionTime?: number;
  map: MapData;
  mapName?: string;
  margin?: 'minimal';
  mutateAction?: MutateActionResponseFn;
  onAction?: (action: Action) => Promise<GameActionResponse>;
  onError?: (error: Error) => void;
  pan?: true;
  paused?: boolean;
  playerAchievement?: PlayerAchievement | null;
  playerHasReward?: PlayerHasRewardFunction;
  scale: number;
  scroll?: boolean;
  setEditorState?: SetEditorStateFunction;
  showCursor: boolean;
  skipBanners?: boolean;
  spectatorCodes?: ReadonlyArray<string>;
  style: TileStyle;
  tileSize: number;
  tilted: boolean;
  timeout?: number | null;
  unitSize: number;
  userDisplayName: string;
}>;

export type TimerState = Readonly<{
  delay: number;
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn: Function;
  start: number;
  timer: number;
}>;

export type ReplayState = Readonly<{
  isLive: boolean;
  isPaused: boolean;
  isReplaying: boolean;
  isWaiting: boolean;
  pauseStart: number | null;
}>;

export type State = Readonly<{
  additionalRadius: RadiusInfo | null;
  animationConfig: AnimationConfig;
  animations: Animations;
  attackable: ReadonlyMap<Vector, RadiusItem> | null;
  behavior: MapBehavior | null;
  confirmAction?: ConfirmProps | null;
  currentUserId: string;
  currentViewer: PlayerID | null;
  effectState: {
    extraUnits: ImmutableMap<Vector, Unit>;
    radius: ReadonlyArray<RadiusInfo>;
  } | null;
  factionNames: FactionNames;
  gameInfoState: GameInfoState | null;
  initialBehaviorClass: MapBehaviorConstructor | undefined | null;
  inlineUI: boolean;
  lastActionResponse: ActionResponse | null;
  lastActionTime?: number;
  map: MapData;
  mapName?: string;
  namedPositions: ReadonlyArray<Vector> | null;
  navigationDirection: NavigationDirection | null;
  objectiveRadius: ReadonlyArray<RadiusInfo> | null;
  paused: boolean;
  position: Vector | null;
  preventRemoteActions: boolean;
  previousPosition: Vector | null;
  radius: RadiusInfo | null;
  replayState: ReplayState;
  selectedAttackable: Vector | null;
  selectedBuilding: Building | null;
  selectedPosition: Vector | null;
  selectedUnit: Unit | null;
  showCursor: boolean;
  tileSize: number;
  timeout: number | null;
  userDisplayName: string;
  vision: VisionT;
  zIndex: number;
}>;

export type StateLike = Partial<State>;

export type FactionNames = ReadonlyMap<PlayerID, string>;
export type TimerID = Promise<number>;
// eslint-disable-next-line @typescript-eslint/ban-types
export type TimerFunction = (fn: Function, delay: number) => TimerID;
export type RequestFrameFunction = (fn: (timestamp: number) => void) => void;
export type ClearTimerFunction = (timer: number | TimerID) => void;
export type UpdateFunction = (
  newState: StateLike | null | ((state: State) => StateLike | null),
) => Promise<State>;
export type GetLayerFunction = (y: number, type: LayerTypes) => number;
export type LayerTypes =
  | 'building'
  | 'radius'
  | 'decorator'
  | 'unit'
  | 'animation'
  | 'top';

export type GameInfoPanels = Map<
  string,
  Readonly<{
    content: ReactNode;
    title: ReactNode;
  }>
>;

export type CurrentGameInfoState = Readonly<{
  origin: string;
  panels?: GameInfoPanels;
  type: 'game-info';
}>;

export type MapInfoState = Readonly<{
  building?: Building | null;
  buildingPlayer?: PlayerID;
  create?: () => void;
  decorators?: ReadonlyMap<Vector, DecoratorInfo> | null;
  modifierField?: ModifierField;
  origin: string;
  tile?: TileInfo | null;
  type: 'map-info';
  unit?: Unit | null;
  vector: Vector;
}>;

export type LeaderInfoState = Readonly<{
  origin: string;
  type: 'leader-info';
  unit?: Unit | null;
  vector: Vector;
}>;

export type SkillInfoState = Readonly<{
  action?: (skill: Skill) => void;
  actionName?: ReactElement;
  canAction?: (skill: Skill) => boolean;
  currentSkill: Skill;
  origin: string;
  showAction?: (skill: Skill) => boolean;
  showCost?: boolean;
  skills?: ReadonlyArray<Skill>;
  type: 'skill';
}>;

export type GameInfoState =
  | CurrentGameInfoState
  | LeaderInfoState
  | MapInfoState
  | SkillInfoState;

export type Actions = Readonly<{
  action: (
    state: State,
    action: Action,
  ) => [Promise<GameActionResponse>, MapData, ActionResponse];
  clearTimer: ClearTimerFunction;
  fastForward: () => () => void;
  optimisticAction: (state: State, action: Action) => ActionResponse;
  pauseReplay: () => Promise<void>;
  processGameActionResponse: (
    gameActionResponse: GameActionResponse,
  ) => Promise<State>;
  requestFrame: RequestFrameFunction;
  resetPosition: () => void;
  resumeReplay: () => Promise<void>;
  scheduleTimer: TimerFunction;
  scrollIntoView: (vectors: ReadonlyArray<Vector>) => Promise<void>;
  setEditorState: SetEditorStateFunction;
  showGameInfo: (gameInfoState: GameInfoState) => void;
  throwError: (error: Error) => void;
  update: UpdateFunction;
}>;

export type StateWithActions = Readonly<{
  actions: Actions;
  editor?: EditorState;
  state: State;
}>;

export type MapEnterType = 'pointer' | 'synthetic';

export type MapBehavior = Readonly<{
  readonly activate?: (
    state: State,
    actions?: Actions,
    shouldConfirm?: boolean,
  ) => StateLike | null;
  readonly clearTimers?: () => void;
  readonly component?: (props: StateWithActions) => JSX.Element | null;
  readonly deactivate?: () => StateLike | null;
  readonly enter?: (
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: EditorState,
    subVector?: Vector,
  ) => StateLike | null;
  readonly enterAlternative?: (
    vector: Vector,
    state: State,
    actions: Actions,
    editor: EditorState,
  ) => StateLike | null;
  readonly navigate?: boolean;
  readonly select?: (
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: EditorState,
    subVector?: Vector,
    shouldConfirm?: boolean,
  ) => StateLike | null;
  readonly type:
    | 'attack'
    | 'attackRadius'
    | 'base'
    | 'buySkills'
    | 'createBuilding'
    | 'createUnit'
    | 'design'
    | 'dropUnit'
    | 'entity'
    | 'heal'
    | 'menu'
    | 'move'
    | 'null'
    | 'radar'
    | 'rescue'
    | 'sabotage'
    | 'transport'
    | 'vector';
}>;

export type MapBehaviorConstructor = { new (): MapBehavior };

export type StateToStateLike = (state: State) => StateLike | null;

export type ActionsProcessedEventDetail = Readonly<{
  gameActionResponses: GameActionResponses;
  map: MapData;
}>;
