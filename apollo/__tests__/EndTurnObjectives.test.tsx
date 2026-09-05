import { Helicopter, Infantry, TransportHelicopter } from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { AllowedMisses } from '@deities/athena/map/Configuration.tsx';
import { PlayerIDs } from '@deities/athena/map/Player.tsx';
import { UnitStatusEffect } from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  Criteria,
  decodeObjectives,
  encodeObjectives,
  Objective,
  validateObjectives,
} from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import { EndTurnAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';
import executeGameAction from '../actions/executeGameAction.tsx';
import checkObjectives, { pickWinningPlayer } from '../lib/checkObjective.tsx';
import timeoutActionResponseMutator from '../lib/timeoutActionResponseMutator.tsx';

const createMap = (players: PlayerIDs) =>
  withModifiers(
    MapData.createMap({
      map: Array(15).fill(1),
      size: { height: 3, width: 5 },
      teams: players.map((id) => ({
        id,
        name: '',
        players: [{ funds: 0, id, userId: String(id) }],
      })),
      units: players.map((id) => [id, 1, Infantry.create(id).toJSON()]),
    }),
  );

test.each([
  {
    expectedLosses: 0,
    name: 'automatic resupply',
    supply: true,
    unit: Helicopter.create(2).setFuel(1),
  },
  {
    expectedLosses: 1,
    name: 'fuel starvation without supply',
    supply: false,
    unit: Helicopter.create(2).setFuel(1),
  },
  {
    expectedLosses: 1,
    name: 'fatal poison despite resupply',
    supply: true,
    unit: Helicopter.create(2).setFuel(1).setHealth(1).setStatusEffect(UnitStatusEffect.Poison),
  },
  {
    expectedLosses: 2,
    name: 'fuel starvation with a passenger',
    supply: false,
    unit: TransportHelicopter.create(2).setFuel(1).load(Infantry.create(2).transport()),
  },
])(
  'counts actual turn-start casualties for defeat objectives: $name',
  async ({ expectedLosses, supply, unit }) => {
    const initialMap = createMap([1, 2]);
    const position = vec(3, 2);
    const map = initialMap.copy({
      config: initialMap.config.copy({
        objectives: ImmutableMap([
          [
            0,
            {
              amount: 1,
              hidden: false,
              optional: false,
              players: [1],
              type: Criteria.DefeatAmount,
            },
          ],
        ]),
      }),
      units: initialMap.units
        .set(position, unit)
        .set(supply ? vec(3, 3) : vec(5, 3), TransportHelicopter.create(2)),
    });
    expect(validateObjectives(map)).toBe(true);

    const [, activeMap, gameState] = await executeGameAction(
      map,
      map.createVisionObject(1),
      new Map(),
      EndTurnAction(),
      null,
    );

    expect(activeMap?.getPlayer(1).stats.destroyedUnits).toBe(expectedLosses);
    expect(activeMap?.getPlayer(2).stats.lostUnits).toBe(expectedLosses);
    expect(activeMap?.units.has(position)).toBe(expectedLosses === 0);
    if (expectedLosses === 0) {
      expect(activeMap?.units.get(position)?.fuel).toBe(unit.info.configuration.fuel);
      expect(gameState).toEqual([]);
    } else {
      expect(gameState?.at(-1)?.[0]).toMatchObject({ toPlayer: 1, type: 'GameEnd' });
    }
  },
);

test.each([false, true])(
  'loses a required escort objective with a simultaneous survival bonus: %s',
  async (includeBonus) => {
    const initialMap = createMap([1, 2]);
    const objectives: ReadonlyArray<Objective> = [
      { hidden: false, optional: true, players: [2], rounds: 1, type: Criteria.Survival },
      {
        hidden: false,
        label: new Set([2]),
        optional: false,
        players: [2],
        type: Criteria.EscortLabel,
        vectors: new Set([vec(1, 3)]),
      },
    ];
    const map = initialMap.copy({
      config: initialMap.config.copy({
        objectives: decodeObjectives(
          encodeObjectives(
            ImmutableMap(objectives.map((objective, id) => [id, objective])).filter(
              (_, id) => includeBonus || id !== 0,
            ),
          ),
        ),
      }),
      units: initialMap.units.set(vec(2, 2), Helicopter.create(2, { label: 2 }).setFuel(0)),
    });
    expect(validateObjectives(map)).toBe(true);

    const [, activeMap, gameState] = await executeGameAction(
      map,
      map.createVisionObject(1),
      new Map(),
      EndTurnAction(),
      null,
    );
    expect(activeMap?.units.has(vec(2, 2))).toBe(false);
    expect(gameState?.map(([action]) => action)).toEqual([
      ...(includeBonus
        ? [
            expect.objectContaining({
              objective: expect.objectContaining({ completed: new Set([2]) }),
              objectiveId: 0,
              toPlayer: 2,
              type: 'OptionalObjective',
            }),
          ]
        : []),
      expect.objectContaining({
        objective: expect.objectContaining({ type: Criteria.EscortLabel }),
        objectiveId: 1,
        toPlayer: 1,
        type: 'GameEnd',
      }),
    ]);
  },
);

test.each([
  [Criteria.DefeatLabel, [3]],
  [Criteria.DefeatLabel, undefined],
  [Criteria.DefeatOneLabel, [3]],
  [Criteria.DefeatOneLabel, undefined],
] as const)(
  'awards optional defeat objective %s to the outgoing player (players: %s)',
  async (type, players) => {
    const initialMap = createMap([1, 2, 3]);
    const objectives: ReadonlyArray<Objective> = [
      { hidden: false, label: new Set([1]), optional: true, players, type },
      { hidden: false, type: Criteria.Default },
    ];
    const map = initialMap.copy({
      config: initialMap.config.copy({
        objectives: decodeObjectives(
          encodeObjectives(ImmutableMap(objectives.map((objective, id) => [id, objective]))),
        ),
      }),
      currentPlayer: 3,
      units: initialMap.units.set(vec(1, 1), Helicopter.create(1, { label: 1 }).setFuel(0)),
    });
    expect(validateObjectives(map)).toBe(true);

    const [actionResponse, activeMap] = execute(map, map.createVisionObject(3), EndTurnAction())!;
    const [, objective] = checkObjectives(map, activeMap, actionResponse)!;
    // Check the winner before entering the objective loop so a regression fails instead of hanging.
    expect(pickWinningPlayer(activeMap, actionResponse, objective)).toBe(3);

    const [, , gameState] = await executeGameAction(
      map,
      map.createVisionObject(3),
      new Map(),
      EndTurnAction(),
      null,
    );
    expect(gameState?.map(([action]) => action)).toEqual([
      expect.objectContaining({
        objective: expect.objectContaining({ completed: new Set([3]) }),
        objectiveId: 0,
        toPlayer: 3,
        type: 'OptionalObjective',
      }),
      { fromPlayer: 1, type: 'BeginTurnGameOver' },
      expect.objectContaining({ next: { funds: 0, player: 2 }, type: 'EndTurn' }),
    ]);
    expect(gameState?.at(-1)?.[1].active).toEqual([2, 3]);
  },
);

test.each([[[1, 2]], [[1, 2, 3]], [[1, 2, 3, 4]]] as const)(
  'handles simultaneous timeout and fuel eliminations with players %s',
  async (players) => {
    const initialMap = createMap(players);
    const map = initialMap.copy({
      teams: updatePlayer(
        initialMap.teams,
        initialMap.getPlayer(1).copy({ misses: AllowedMisses - 1 }),
      ),
      units: initialMap.units.set(vec(2, 1), Helicopter.create(2).setFuel(0)),
    });
    const [, , gameState] = await executeGameAction(
      map,
      map.createVisionObject(1),
      new Map(),
      EndTurnAction(),
      null,
      timeoutActionResponseMutator,
    );
    const actions = gameState?.map(([action]) => action);
    expect(actions?.slice(0, 2)).toEqual([
      { fromPlayer: 1, type: 'PreviousTurnGameOver' },
      { fromPlayer: 2, type: 'BeginTurnGameOver' },
    ]);
    expect(gameState?.at(-1)?.[1].active).toEqual(players.slice(2));
    expect(actions?.at(-1)).toEqual(
      players.length === 2
        ? { type: 'GameEnd' }
        : players.length === 3
          ? { toPlayer: 3, type: 'GameEnd' }
          : expect.objectContaining({ next: { funds: 0, player: 3 }, type: 'EndTurn' }),
    );
  },
);
