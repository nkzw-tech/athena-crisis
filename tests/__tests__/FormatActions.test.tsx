import {
  AttackUnitAction,
  CaptureAction,
  CreateBuildingAction,
  CreateUnitAction,
  EndTurnAction,
  MessageAction,
  MoveAction,
  UnfoldAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { formatActionResponse } from '@deities/apollo/FormatActions.tsx';
import { Barracks } from '@deities/athena/info/Building.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';
import snapshotGameState from '../snapshotGameState.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, { h: 100, i: 1, p: 1 }],
      [5, 5, { h: 100, i: 1, p: 2 }],
    ],
    config: {
      fog: true,
    },
    map: [
      1, 8, 4, 8, 2, 8, 4, 4, 4, 8, 4, 4, 3, 4, 4, 8, 4, 4, 4, 8, 2, 8, 4, 8, 1,
    ],
    size: { height: 5, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 10_000, id: 1, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 10_000, id: 2, userId: '2' }],
      },
    ],
    units: [
      [2, 1, { g: 40, h: 100, i: 1, p: 1 }],
      [1, 2, { g: 40, h: 100, i: 1, p: 1 }],
      [5, 4, { g: 40, h: 100, i: 1, p: 2 }],
      [4, 5, { g: 40, h: 100, i: 1, p: 2 }],
    ],
  }),
);

test('create building and create unit actions', async () => {
  const [gameState, gameActionResponse] = executeGameActions(initialMap, [
    EndTurnAction(),
    MoveAction(vec(5, 4), vec(5, 2)),
    CreateBuildingAction(vec(5, 2), Barracks.id),
    MoveAction(vec(4, 5), vec(2, 5)),
    CreateBuildingAction(vec(2, 5), Barracks.id),
    CreateUnitAction(vec(5, 5), 1, vec(5, 4)),
    EndTurnAction(),
    CreateBuildingAction(vec(2, 1), Barracks.id),
    CreateBuildingAction(vec(1, 2), Barracks.id),
    CreateUnitAction(vec(1, 1), 1, vec(2, 1)),
    EndTurnAction(),
    CreateBuildingAction(vec(5, 4), Barracks.id),
    CreateUnitAction(vec(5, 2), 1, vec(5, 1)),
    CreateUnitAction(vec(2, 5), 1, vec(2, 4)),
    CreateUnitAction(vec(5, 5), 1, vec(5, 4)),
    EndTurnAction(),
    MoveAction(vec(2, 1), vec(4, 1)),
    CreateBuildingAction(vec(4, 1), Barracks.id),
    CreateUnitAction(vec(2, 1), 1, vec(2, 2)),
    CreateUnitAction(vec(1, 2), 1, vec(1, 3)),
    CreateUnitAction(vec(1, 1), 2, vec(2, 1)),
    EndTurnAction(),
    MoveAction(vec(5, 4), vec(4, 5)),
    CreateBuildingAction(vec(4, 5), 3),
    MoveAction(vec(5, 1), vec(4, 1)),
    CaptureAction(vec(4, 1)),
    MoveAction(vec(2, 4), vec(1, 4)),
    CreateBuildingAction(vec(1, 4), 3),
    CreateUnitAction(vec(5, 2), 2, vec(4, 2)),
    EndTurnAction(),
    MoveAction(vec(2, 1), vec(3, 2)),
    AttackUnitAction(vec(3, 2), vec(4, 2)),
    MoveAction(vec(1, 3), vec(1, 4)),
    CaptureAction(vec(1, 4)),
    MoveAction(vec(2, 2), vec(2, 5)),
    CaptureAction(vec(2, 5)),
    EndTurnAction(),
    CaptureAction(vec(4, 1)),
    AttackUnitAction(vec(4, 2), vec(3, 2)),
    EndTurnAction(),
    CaptureAction(vec(1, 4)),
    CaptureAction(vec(2, 5)),
    AttackUnitAction(vec(3, 2), vec(4, 2)),
    CreateUnitAction(vec(2, 1), 14, vec(3, 1)),
    EndTurnAction(),
    MoveAction(vec(4, 1), vec(5, 3)),
    EndTurnAction(),
    MoveAction(vec(2, 5), vec(5, 5)),
    CaptureAction(vec(5, 5)),
    MoveAction(vec(3, 2), vec(4, 3)),
    AttackUnitAction(vec(4, 3), vec(5, 3)),
    MoveAction(vec(3, 1), vec(3, 2)),
    UnfoldAction(vec(3, 2)),
    MoveAction(vec(1, 4), vec(4, 4)),
    EndTurnAction(),
    MoveAction(vec(5, 3), vec(5, 4)),
    MessageAction('Banana Banana Banana!'),
    EndTurnAction(),
  ]);

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 10000, player: 2 }, round: 1, rotatePlayers: null, supply: null, miss: null }
    Move (5,4 → 5,2) { fuel: 38, completed: null, path: [5,3 → 5,2] }
    CreateBuilding (5,2) { building: Barracks { id: 12, health: 100, player: 2, completed: true } }
    Move (4,5 → 2,5) { fuel: 38, completed: null, path: [3,5 → 2,5] }
    CreateBuilding (2,5) { building: Barracks { id: 12, health: 100, player: 2, completed: true } }
    CreateUnit (5,5 → 5,4) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 9600, player: 2 }, next: { funds: 10000, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }
    CreateBuilding (2,1) { building: Barracks { id: 12, health: 100, player: 1, completed: true } }
    CreateBuilding (1,2) { building: Barracks { id: 12, health: 100, player: 1, completed: true } }
    CreateUnit (1,1 → 2,1) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 9600, player: 1 }, next: { funds: 9600, player: 2 }, round: 2, rotatePlayers: null, supply: null, miss: null }
    CreateBuilding (5,4) { building: Barracks { id: 12, health: 100, player: 2, completed: true } }
    CreateUnit (5,2 → 5,1) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
    CreateUnit (2,5 → 2,4) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Rick', completed: true }, free: false, skipBehaviorRotation: false }
    CreateUnit (5,5 → 5,4) { unit: Pioneer { id: 1, health: 100, player: 2, fuel: 40, moved: true, name: 'Idris', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 9150, player: 2 }, next: { funds: 9600, player: 1 }, round: 3, rotatePlayers: null, supply: null, miss: null }
    Move (2,1 → 4,1) { fuel: 38, completed: null, path: [3,1 → 4,1] }
    CreateBuilding (4,1) { building: Barracks { id: 12, health: 100, player: 1, completed: true } }
    CreateUnit (2,1 → 2,2) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
    CreateUnit (1,2 → 1,3) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Liam', completed: true }, free: false, skipBehaviorRotation: false }
    CreateUnit (1,1 → 2,1) { unit: Infantry { id: 2, health: 100, player: 1, fuel: 50, moved: true, name: 'Valentin', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 9050, player: 1 }, next: { funds: 9150, player: 2 }, round: 3, rotatePlayers: null, supply: null, miss: null }
    Move (5,4 → 4,5) { fuel: 38, completed: null, path: [4,4 → 4,5] }
    CreateBuilding (4,5) { building: Factory { id: 3, health: 100, player: 2, completed: true } }
    Move (5,1 → 4,1) { fuel: 39, completed: null, path: [4,1] }
    Capture (4,1)
    Move (2,4 → 1,4) { fuel: 39, completed: null, path: [1,4] }
    CreateBuilding (1,4) { building: Factory { id: 3, health: 100, player: 2, completed: true } }
    CreateUnit (5,2 → 4,2) { unit: Infantry { id: 2, health: 100, player: 2, fuel: 50, moved: true, name: 'Valentin', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 9050, player: 1 }, round: 4, rotatePlayers: null, supply: null, miss: null }
    Move (2,1 → 3,2) { fuel: 48, completed: null, path: [3,1 → 3,2] }
    AttackUnit (3,2 → 4,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 75 }, unitB: DryUnit { health: 43 }, chargeA: 87, chargeB: 113 }
    Move (1,3 → 1,4) { fuel: 39, completed: null, path: [1,4] }
    Capture (1,4)
    Move (2,2 → 2,5) { fuel: 37, completed: null, path: [2,3 → 2,4 → 2,5] }
    Capture (2,5)
    EndTurn { current: { funds: 9050, player: 1 }, next: { funds: 8450, player: 2 }, round: 4, rotatePlayers: null, supply: null, miss: null }
    Capture (4,1) { building: Barracks { id: 12, health: 100, player: 2 }, player: 1 }
    AttackUnit (4,2 → 3,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 18 }, unitB: DryUnit { health: 42 }, chargeA: 184, chargeB: 153 }
    EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 9050, player: 1 }, round: 5, rotatePlayers: null, supply: null, miss: null }
    Capture (1,4) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }
    Capture (2,5) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
    AttackUnit (3,2 → 4,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 42 }, unitB: null, chargeA: 164, chargeB: 220 }
    CreateUnit (2,1 → 3,1) { unit: Sniper { id: 14, health: 100, player: 1, fuel: 40, ammo: [ [ 1, 7 ] ], moved: true, name: 'Maxima', completed: true }, free: false, skipBehaviorRotation: false }
    EndTurn { current: { funds: 8675, player: 1 }, next: { funds: 8450, player: 2 }, round: 5, rotatePlayers: null, supply: null, miss: null }
    Move (4,1 → 5,3) { fuel: 36, completed: null, path: [5,1 → 5,2 → 5,3] }
    EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 8675, player: 1 }, round: 6, rotatePlayers: null, supply: null, miss: null }
    Move (2,5 → 5,5) { fuel: 34, completed: null, path: [3,5 → 4,5 → 5,5] }
    Capture (5,5)
    Move (3,2 → 4,3) { fuel: 46, completed: null, path: [4,2 → 4,3] }
    AttackUnit (4,3 → 5,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 42 }, unitB: DryUnit { health: 62 }, chargeA: 176, chargeB: 258 }
    Move (3,1 → 3,2) { fuel: 39, completed: null, path: [3,2] }
    Unfold (3,2)
    Move (1,4 → 4,4) { fuel: 36, completed: null, path: [2,4 → 3,4 → 4,4] }
    EndTurn { current: { funds: 8675, player: 1 }, next: { funds: 8450, player: 2 }, round: 6, rotatePlayers: null, supply: null, miss: null }
    Move (5,3 → 5,4) { fuel: 35, completed: null, path: [5,4] }
    Message { message: 'Banana Banana Banana!', player: null }
    EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 8675, player: 1 }, round: 7, rotatePlayers: null, supply: null, miss: null }"
  `);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 10000, player: 1 }, next: { funds: 10000, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      CreateBuilding (5,2) { building: Barracks { id: 12, health: 100, player: 0 } }
      CreateBuilding (2,5) { building: Barracks { id: 12, health: 100, player: 0 } }
      EndTurn { current: { funds: 9600, player: 2 }, next: { funds: 10000, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      CreateBuilding (2,1) { building: Barracks { id: 12, health: 100, player: 1, completed: true } }
      CreateBuilding (1,2) { building: Barracks { id: 12, health: 100, player: 1, completed: true } }
      CreateUnit (1,1 → 2,1) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
      EndTurn { current: { funds: 9600, player: 1 }, next: { funds: 9600, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      CreateBuilding (5,4) { building: Barracks { id: 12, health: 100, player: 0 } }
      EndTurn { current: { funds: 9150, player: 2 }, next: { funds: 9600, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      Move (2,1 → 4,1) { fuel: 38, completed: false, path: [3,1 → 4,1] }
      CreateBuilding (4,1) { building: Barracks { id: 12, health: 100, player: 1, completed: true } }
      CreateUnit (2,1 → 2,2) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Sam', completed: true }, free: false, skipBehaviorRotation: false }
      CreateUnit (1,2 → 1,3) { unit: Pioneer { id: 1, health: 100, player: 1, fuel: 40, moved: true, name: 'Liam', completed: true }, free: false, skipBehaviorRotation: false }
      CreateUnit (1,1 → 2,1) { unit: Infantry { id: 2, health: 100, player: 1, fuel: 50, moved: true, name: 'Valentin', completed: true }, free: false, skipBehaviorRotation: false }
      EndTurn { current: { funds: 9050, player: 1 }, next: { funds: 9150, player: 2 }, round: 3, rotatePlayers: false, supply: null, miss: false }
      CreateBuilding (4,5) { building: Factory { id: 3, health: 100, player: 0 } }
      Move (5,1 → 4,1) { fuel: 39, completed: false, path: [4,1] }
      Capture (4,1)
      Move (2,4 → 1,4) { fuel: 39, completed: false, path: [1,4] }
      CreateBuilding (1,4) { building: Factory { id: 3, health: 100, player: 2, completed: true } }
      HiddenMove { path: [5,2 → 4,2], completed: false, fuel: null, unit: Infantry { id: 2, health: 100, player: 2, fuel: 50, moved: true, name: 'Valentin', completed: true } }
      EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 9050, player: 1 }, round: 4, rotatePlayers: false, supply: null, miss: false }
      Move (2,1 → 3,2) { fuel: 48, completed: false, path: [3,1 → 3,2] }
      AttackUnit (3,2 → 4,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 75 }, unitB: DryUnit { health: 43 }, chargeA: 87, chargeB: 113 }
      Move (1,3 → 1,4) { fuel: 39, completed: false, path: [1,4] }
      Capture (1,4)
      Move (2,2 → 2,5) { fuel: 37, completed: false, path: [2,3 → 2,4 → 2,5] }
      Capture (2,5)
      EndTurn { current: { funds: 9050, player: 1 }, next: { funds: 8450, player: 2 }, round: 4, rotatePlayers: false, supply: null, miss: false }
      Capture (4,1) { building: Barracks { id: 12, health: 100, player: 2 }, player: 1 }
      AttackUnit (4,2 → 3,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 18 }, unitB: DryUnit { health: 42 }, chargeA: 184, chargeB: 153 }
      EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 9050, player: 1 }, round: 5, rotatePlayers: false, supply: null, miss: false }
      Capture (1,4) { building: Factory { id: 3, health: 100, player: 1 }, player: 2 }
      Capture (2,5) { building: Barracks { id: 12, health: 100, player: 1 }, player: 2 }
      AttackUnit (3,2 → 4,2) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 42 }, unitB: null, chargeA: 164, chargeB: 220 }
      CreateUnit (2,1 → 3,1) { unit: Sniper { id: 14, health: 100, player: 1, fuel: 40, ammo: [ [ 1, 7 ] ], moved: true, name: 'Maxima', completed: true }, free: false, skipBehaviorRotation: false }
      EndTurn { current: { funds: 8675, player: 1 }, next: { funds: 8450, player: 2 }, round: 5, rotatePlayers: false, supply: null, miss: false }
      HiddenMove { path: [4,1 → 5,1 → 5,2 → 5,3], completed: false, fuel: 36, unit: null }
      EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 8675, player: 1 }, round: 6, rotatePlayers: false, supply: null, miss: false }
      Move (2,5 → 5,5) { fuel: 34, completed: false, path: [3,5 → 4,5 → 5,5] }
      Capture (5,5)
      Move (3,2 → 4,3) { fuel: 46, completed: false, path: [4,2 → 4,3] }
      AttackUnit (4,3 → 5,3) { hasCounterAttack: false, playerA: 1, playerB: 2, unitA: DryUnit { health: 42 }, unitB: DryUnit { health: 62 }, chargeA: 176, chargeB: 258 }
      Move (3,1 → 3,2) { fuel: 39, completed: false, path: [3,2] }
      Unfold (3,2)
      Move (1,4 → 4,4) { fuel: 36, completed: false, path: [2,4 → 3,4 → 4,4] }
      EndTurn { current: { funds: 8675, player: 1 }, next: { funds: 8450, player: 2 }, round: 6, rotatePlayers: false, supply: null, miss: false }
      Move (5,3 → 5,4) { fuel: 35, completed: false, path: [5,4] }
      Message { message: 'Banana Banana Banana!', player: null }
      EndTurn { current: { funds: 8450, player: 2 }, next: { funds: 8675, player: 1 }, round: 7, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('format spawn actions', () => {
  expect(
    formatActionResponse(
      {
        teams: initialMap.teams,
        type: 'Spawn',
        units: initialMap.units,
      },
      { colors: false },
    ),
  ).toMatchInlineSnapshot(
    `"Spawn { units: [2,1 → Pioneer { id: 1, health: 100, player: 1, fuel: 40 }, 1,2 → Pioneer { id: 1, health: 100, player: 1, fuel: 40 }, 5,4 → Pioneer { id: 1, health: 100, player: 2, fuel: 40 }, 4,5 → Pioneer { id: 1, health: 100, player: 2, fuel: 40 }], teams: [ { id: 1, name: '', players: [ { activeSkills: [], ai: undefined, charge: 0, funds: 10000, id: 1, misses: 0, skills: [], stats: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], userId: '1' } ] }, { id: 2, name: '', players: [ { activeSkills: [], ai: undefined, charge: 0, funds: 10000, id: 2, misses: 0, skills: [], stats: [ 0, 0, 0, 0, 0, 0, 0, 0, 0, 0 ], userId: '2' } ] } ] }"`,
  );
});
