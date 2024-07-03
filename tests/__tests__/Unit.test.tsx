import { MoveAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Barracks, House } from '@deities/athena/info/Building.tsx';
import { findTile, Plain, Sea } from '@deities/athena/info/Tile.tsx';
import {
  Ability,
  AmphibiousTank,
  Battleship,
  Dragon,
  Frigate,
  Helicopter,
  Jeep,
  mapUnits,
  Octopus,
  Pioneer,
  SupportShip,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import { printGameState } from '../printGameState.tsx';
import { captureOne } from '../screenshot.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

test('displays all units and all possible states correctly', async () => {
  let units = ImmutableMap<Vector, Unit>();
  let maxWidth = 1;
  let y = 1;
  sortBy([...mapUnits((unit) => unit)], ({ id }) => id).map((unit) => {
    let x = 1;
    units = units.set(vec(x++, y), unit.create(1));

    if (unit.hasAbility(Ability.Unfold)) {
      units = units.set(vec(x++, y), unit.create(1).unfold());
    }
    if (unit.transports && unit.canTransport(Pioneer, Plain)) {
      units = units.set(
        vec(x++, y),
        unit.create(1).load(Pioneer.create(1).transport()),
      );
      if (unit.transports.limit > 1 && unit.sprite.transportsMany) {
        units = units.set(
          vec(x++, y),
          unit
            .create(1)
            .load(Pioneer.create(1).transport())
            .load(Pioneer.create(1).transport()),
        );
      }
    }

    if (x > maxWidth) {
      maxWidth = x;
    }

    y++;
  });

  const size = { height: y, width: maxWidth };
  units = units.merge(
    units
      .filter((_, vector) => vector.x === 1)
      .mapEntries(([vector, unit]) => [
        vec(size.width, vector.y),
        unit.setPlayer(2),
      ]),
  );

  const map = withModifiers(
    MapData.createMap({
      buildings: [
        [3, 1, { h: 100, i: 1, p: 1 }],
        [4, 1, { h: 100, i: 1, p: 2 }],
      ],
      map: Array(size.height * size.width).fill(Plain.id),
      size,
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 500, id: 2, name: 'AI' }],
        },
      ],
    }),
  ).copy({
    units,
  });

  // Fix up the map with the proper tiles below units.
  const newMap = map.map.slice();
  map.forEachField((vector: Vector) => {
    const unit = map.units.get(vector);
    if (unit) {
      newMap[map.getTileIndex(vector)] = findTile((tile) =>
        [...tile.configuration.movement].find(
          ([type, cost]) => unit.info.movementType === type && cost !== -1,
        ),
      )!.id;
    }
  });

  const screenshot = await captureOne(
    withModifiers(map.copy({ map: newMap })),
    HumanPlayer.from(map.getPlayer(1), '1').userId,
  );
  printGameState('All Units', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('correctly palette swaps water on naval units', async () => {
  const size = { height: 5, width: 5 };
  const map = withModifiers(
    MapData.createMap({
      config: {
        biome: Biome.Swamp,
      },
      map: Array(size.height * size.width).fill(Sea.id),
      size,
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 500, id: 2, name: 'AI' }],
        },
      ],
    }),
  ).copy({
    units: ImmutableMap([
      [vec(1, 1), Battleship.create(1)],
      [vec(2, 2), Frigate.create(2)],
      [vec(3, 3), SupportShip.create(1)],
      [vec(4, 4), AmphibiousTank.create(2)],
      [vec(5, 5), Octopus.create(1)],
    ]),
  });

  const screenshot = await captureOne(
    map,
    HumanPlayer.from(map.getPlayer(1), '1').userId,
  );
  printGameState('Naval Units', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('renders Dragons differently on water', async () => {
  const size = { height: 3, width: 3 };
  const length = size.height * size.width;
  const tileMap = Array(length).fill(Plain.id);
  tileMap[length - 1] = Sea.id;
  const map = withModifiers(
    MapData.createMap({
      map: tileMap,
      size,
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 500, id: 2, name: 'AI' }],
        },
      ],
    }),
  ).copy({
    units: ImmutableMap([
      [vec(2, 2), Dragon.create(2)],
      [vec(3, 3), Dragon.create(1)],
    ]),
  });

  const screenshot = await captureOne(
    map,
    HumanPlayer.from(map.getPlayer(1), '1').userId,
  );
  printGameState('Dragon Units', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('displays labels correctly', async () => {
  let map = withModifiers(
    MapData.createMap({
      map: Array(9).fill(1),
      size: { height: 3, width: 3 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 500, id: 2, name: 'AI' }],
        },
      ],
    }),
  );

  const player1 = HumanPlayer.from(map.getPlayer(1), '1');
  const player2 = map.getPlayer(2);
  map = map.copy({
    buildings: map.buildings.set(
      vec(1, 2),
      Barracks.create(player1, { label: 2 }),
    ),
    units: map.units
      .set(vec(2, 2), Pioneer.create(player1, { label: 3 }))
      .set(vec(2, 3), Helicopter.create(player2, { label: 1 }).setFuel(1))
      .set(vec(1, 3), Jeep.create(player2, { label: 4 }).setFuel(10)),
  });

  const screenshot = await captureOne(map, player1.userId);
  printGameState('Tags', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});

test('escort radius with label', async () => {
  const v1 = vec(1, 1);
  const v2 = vec(1, 2);
  const v3 = vec(2, 2);
  const v4 = vec(3, 1);
  const v5 = vec(2, 3);
  const v6 = vec(3, 3);
  const v7 = vec(3, 2);
  const v8 = vec(1, 3);
  const v9 = vec(2, 1);

  const map = withModifiers(
    MapData.createMap({
      map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
      size: { height: 3, width: 3 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 500, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 500, id: 2, userId: '4' }],
        },
      ],
    }),
  );

  const initialMap = map.copy({
    buildings: map.buildings.set(v4, House.create(1)),
    config: map.config.copy({
      objectives: ImmutableMap([
        [
          0,
          {
            amount: 1,
            hidden: false,
            label: new Set([2]),
            optional: false,
            players: [1],
            type: Criteria.EscortAmount,
            vectors: new Set([v4, v5]),
          },
        ],
        [
          1,
          {
            amount: 7,
            hidden: false,
            label: new Set([1]),
            optional: false,
            players: [2],
            type: Criteria.EscortAmount,
            vectors: new Set([v6, v7]),
          },
        ],
        [
          2,
          {
            amount: 15,
            hidden: false,
            optional: false,
            players: [1],
            type: Criteria.EscortAmount,
            vectors: new Set([v8, v9]),
          },
        ],
      ]),
    }),
    units: map.units
      .set(v1, Pioneer.create(1))
      .set(v2, Pioneer.create(2))
      .set(v3, Pioneer.create(1, { label: 2 })),
  });

  const [, gameActionResponseA] = executeGameActions(initialMap, [
    MoveAction(v1, v5),
    MoveAction(v3, v4),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA))
    .toMatchInlineSnapshot(`
      "Move (1,1 → 2,3) { fuel: 37, completed: false, path: [2,1 → 2,2 → 2,3] }
      Move (2,2 → 3,1) { fuel: 38, completed: false, path: [2,1 → 3,1] }
      GameEnd { objective: { amount: 1, completed: Set(0) {}, hidden: false, label: [ 2 ], optional: false, players: [ 1 ], reward: null, type: 6, vectors: [ '3,1', '2,3' ] }, objectiveId: 0, toPlayer: 1 }"
    `);

  const screenshot = await captureOne(initialMap, '1');
  printGameState('Escort Radius', screenshot);
  expect(screenshot).toMatchImageSnapshot();
});
