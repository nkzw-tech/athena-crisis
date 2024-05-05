import { EndTurnAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import executeGameAction from '@deities/apollo/actions/executeGameAction.tsx';
import { House } from '@deities/athena/info/Building.tsx';
import { Forest } from '@deities/athena/info/Tile.tsx';
import { AntiAir, APU, Infantry } from '@deities/athena/info/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import DionysusAlpha from '@deities/dionysus/DionysusAlpha.tsx';
import { expect, test } from 'vitest';
import snapshotGameState from '../snapshotGameState.tsx';

const rawMap = MapData.createMap({
  config: {
    fog: true,
  },
  map: [
    1,
    Forest.id,
    1,
    Forest.id,
    1,
    Forest.id,
    1,
    Forest.id,
    1,
    1,
    Forest.id,
    Forest.id,
    1,
    1,
    1,
    Forest.id,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
  ],
  size: {
    height: 5,
    width: 5,
  },
  teams: [
    {
      id: 1,
      name: '',
      players: [{ funds: 0, id: 1, userId: 'User-1' }],
    },
    {
      id: 2,
      name: '',
      players: [{ funds: 1000, id: 2, name: 'Bot' }],
    },
  ],
});

const vecA = vec(1, 1);
const vecB = vec(4, 5);
const vecC = vec(5, 5);

const initialMap = rawMap.copy({
  buildings: rawMap.buildings.set(vecC, House.create(1)),
  units: rawMap.units
    .set(vecA, AntiAir.create(2))
    .set(
      vecB,
      APU.create(2)
        .setFuel(0)
        .setAmmo(
          new Map(
            [...(APU.getAmmunitionSupply() || [])].map(([id]) => [id, 0]),
          ),
        ),
    )
    .set(vecC, Infantry.create(1)),
});

const player1 = initialMap.getPlayer(1);

test('units will hide in hidden fields in fog', async () => {
  const map = initialMap;
  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    DionysusAlpha,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 4,1) { fuel: 25, completed: null, path: [2,1 → 3,1 → 4,1] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);

  // Without fog the unit will move further.
  const [, , secondGameState] = executeGameAction(
    map.copy({ config: map.config.copy({ fog: false }) }),
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    DionysusAlpha,
  );

  expect(snapshotGameState(secondGameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 5,1) { fuel: 24, completed: null, path: [2,1 → 3,1 → 4,1 → 5,1] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});

test('does not hide in hidden fields too far from the target', async () => {
  const map = initialMap.copy({
    map: [
      1,
      Forest.id,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
      1,
    ],
  });

  const [, , gameState] = executeGameAction(
    map,
    map.createVisionObject(player1),
    new Map(),
    EndTurnAction(),
    DionysusAlpha,
  );

  expect(snapshotGameState(gameState)).toMatchInlineSnapshot(`
    "Move (1,1 → 4,4) { fuel: 24, completed: null, path: [1,2 → 1,3 → 1,4 → 2,4 → 3,4 → 4,4] }
    EndTurn { current: { funds: 1000, player: 2 }, next: { funds: 100, player: 1 }, round: 2, rotatePlayers: null, supply: null, miss: null }"
  `);
});
