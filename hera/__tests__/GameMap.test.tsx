import { InstantAnimationConfig, TileSize } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test, vi } from 'vitest';
import type { Animation, Animations } from '../MapAnimations.tsx';
import type { Props, State, StateLike, UpdateFunction } from '../Types.tsx';

vi.mock('@deities/ui/AudioPlayer.tsx', () => ({
  default: {
    playSound: vi.fn(),
  },
}));
vi.mock('@deities/ui/Browser.tsx', () => ({ isIOS: false }));
vi.mock('@deities/ui/controls/Input.tsx', () => ({
  default: { register: vi.fn(() => vi.fn()) },
}));
vi.mock('@deities/ui/controls/setupGamePad.tsx', () => ({ rumbleEffect: vi.fn() }));
vi.mock('@deities/ui/controls/throttle.tsx', () => ({
  default: (fn: unknown) => fn,
}));
vi.mock('@deities/ui/cssVar.tsx', () => ({
  applyVar: () => '',
  CSSVariables: class CSSVariables {
    apply() {
      return '';
    }
    set() {
      return '';
    }
  },
  default: () => '',
}));
vi.mock('@deities/ui/hooks/useScrollRestore.tsx', () => ({ ScrollRestore: {} }));
vi.mock('@deities/ui/lib/captureException.tsx', () => ({ default: vi.fn() }));
vi.mock('@deities/ui/lib/scrollToCenter.tsx', () => ({ default: vi.fn() }));
vi.mock('@deities/ui/Portal.tsx', () => ({ default: () => null }));
vi.mock('@deities/ui/ScrollContainer.tsx', () => ({ ScrollContainerClassName: 'scroll' }));
vi.mock('@emotion/css', () => ({
  css: () => '',
  cx: (...classes: ReadonlyArray<string | null | undefined | false>) =>
    classes.filter(Boolean).join(' '),
  keyframes: () => '',
}));
vi.mock('framer-motion', () => ({ AnimatePresence: () => null }));

vi.mock('../action-response/processActionResponse.tsx', () => ({ default: vi.fn() }));
vi.mock('../behavior/Base.tsx', () => ({
  default: class BaseBehavior {
    type = 'base' as const;
  },
}));
vi.mock('../behavior/Menu.tsx', () => ({
  default: class MenuBehavior {
    type = 'menu' as const;
  },
}));
vi.mock('../behavior/Message.tsx', () => ({ canPlaceMessage: () => false }));
vi.mock('../Cursor.tsx', () => ({ default: () => null }));
vi.mock('../editor/MapEditorMirrorCursors.tsx', () => ({ default: () => null }));
vi.mock('../lib/addEndTurnAnimations.tsx', () => ({ default: vi.fn() }));
vi.mock('../Map.tsx', () => ({ default: () => null }));
vi.mock('../MapAnimations.tsx', () => ({
  hasCharacterMessage: () => false,
  MapAnimations: () => null,
}));
vi.mock('../Mask.tsx', () => ({
  default: () => null,
  parseVector: () => null,
}));
vi.mock('../MaskWithSubtiles.tsx', () => ({ default: () => null }));
vi.mock('../message/CreateMapMessage.tsx', () => ({ default: () => null }));
vi.mock('../message/MapMessage.tsx', () => ({ default: () => null }));
vi.mock('../Radius.tsx', async () => {
  const actual = await vi.importActual<typeof import('../Radius.tsx')>('../Radius.tsx');
  return {
    ...actual,
    default: () => null,
  };
});
vi.mock('../ui/GameDialog.tsx', () => ({ default: () => null }));
vi.mock('../ui/MapPerformanceMetrics.tsx', () => ({ default: () => null }));
vi.mock('../ui/NamedPosition.tsx', () => ({ default: () => null }));
vi.mock('../ui/PositionHint.tsx', () => ({ default: () => null }));
vi.mock('../ui/SkipMessages.tsx', () => ({
  default: () => null,
  MessageSkipDuration: 300,
}));

const map = MapData.createMap({
  map: [1, 1, 1, 1],
  size: { height: 2, width: 2 },
  teams: [
    { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
    { id: 2, name: '', players: [{ funds: 0, id: 2, userId: '2' }] },
  ],
});

type TestGameMap = {
  _actions: {
    scheduleTimer: (fn: () => void, delay: number) => Promise<number>;
    update: UpdateFunction;
  };
  _update: UpdateFunction;
  setState: (
    updater: StateLike | ((state: State) => StateLike | State | null),
    callback?: () => void,
  ) => void;
  state: State;
};

function installSynchronousSetState(gameMap: TestGameMap) {
  let isUpdating = false;

  gameMap.setState = (
    updater: StateLike | ((state: State) => StateLike | State | null),
    callback?: () => void,
  ) => {
    if (isUpdating) {
      throw new Error('Maximum update depth exceeded.');
    }

    isUpdating = true;
    try {
      const newState = typeof updater === 'function' ? updater(gameMap.state) : updater;
      if (newState) {
        gameMap.state = {
          ...gameMap.state,
          ...newState,
        };
      }
    } finally {
      isUpdating = false;
    }

    callback?.();
  };
}

test('skipped animation completion does not synchronously re-enter GameMap updates', async () => {
  vi.stubGlobal('window', {
    innerHeight: 768,
    innerWidth: 1024,
    setTimeout,
  });

  const [{ default: GameMap }, { default: NullBehavior }] = await Promise.all([
    import('../GameMap.tsx'),
    import('../behavior/NullBehavior.tsx'),
  ]);
  const gameMap = new GameMap({
    animationSpeed: {
      human: InstantAnimationConfig,
      regular: InstantAnimationConfig,
    },
    autoPanning: false,
    behavior: NullBehavior,
    buildingSize: TileSize,
    confirmActionStyle: 'never',
    currentUserId: '2',
    fogStyle: 'soft',
    map,
    playerAchievement: null,
    playerDetails: new Map(),
    scale: 1,
    showCursor: false,
    style: 'none',
    tileSize: TileSize,
    tilted: false,
    unitSize: TileSize,
  } satisfies Props) as unknown as TestGameMap;
  installSynchronousSetState(gameMap);

  let followUpUpdateCompleted = false;
  const animation: Animation = {
    onComplete: (state) => {
      gameMap._actions.scheduleTimer(() => {
        gameMap._actions.update({ showSkipActions: false }).then(() => {
          followUpUpdateCompleted = true;
        });
      }, 0);
      return state;
    },
    text: 'Skip',
    type: 'notice',
  };

  gameMap.state = {
    ...gameMap.state,
    animations: ImmutableMap([[vec(1, 1), animation]]) as Animations,
    preventRemoteActions: true,
    showSkipActions: true,
    skipActions: true,
  };

  await expect(gameMap._update((state: State) => state)).resolves.toMatchObject({
    animations: ImmutableMap(),
  });
  await Promise.resolve();

  expect(followUpUpdateCompleted).toBe(true);
});

test('partial viewer updates do not require a map in the update payload', async () => {
  vi.stubGlobal('window', {
    innerHeight: 768,
    innerWidth: 1024,
  });

  const [{ default: GameMap }, { default: NullBehavior }] = await Promise.all([
    import('../GameMap.tsx'),
    import('../behavior/NullBehavior.tsx'),
  ]);
  const gameMap = new GameMap({
    animationSpeed: {
      human: InstantAnimationConfig,
      regular: InstantAnimationConfig,
    },
    autoPanning: false,
    behavior: NullBehavior,
    buildingSize: TileSize,
    confirmActionStyle: 'never',
    currentUserId: '2',
    fogStyle: 'soft',
    map,
    playerAchievement: null,
    playerDetails: new Map(),
    scale: 1,
    showCursor: false,
    style: 'none',
    tileSize: TileSize,
    tilted: false,
    unitSize: TileSize,
  } satisfies Props) as unknown as TestGameMap;
  installSynchronousSetState(gameMap);

  await expect(gameMap._update({ currentViewer: 1 })).resolves.toMatchObject({
    currentViewer: 1,
    map,
  });
});
