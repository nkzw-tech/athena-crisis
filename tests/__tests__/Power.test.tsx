import {
  ActivateCrystalAction,
  ActivatePowerAction,
  AttackUnitAction,
  EndTurnAction,
  StartAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Effect, Effects } from '@deities/apollo/Effects.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Pioneer, SmallTank } from '@deities/athena/info/Unit.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import { Charge, MaxCharges } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData, { SizeVector } from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    config: { fog: true },
    map: [1, 8, 4, 8, 2, 8, 4, 4, 4, 8, 4, 4, 3, 4, 4, 8, 4, 4, 4, 8, 2, 8, 4, 8, 1],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: 'User-1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, userId: 'User-2' }] },
    ],
  }),
);

test('skills are active until the beginning of the next turn', async () => {
  const skills = new Set([Skill.AttackIncreaseMajorDefenseDecreaseMajor]);
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(2, 2);
  const vecD = vec(2, 3);
  const vecE = vec(3, 2);
  const map = initialMap.copy({
    teams: updatePlayer(
      initialMap.teams,
      initialMap.getPlayer(1).copy({ charge: Charge * MaxCharges, skills }),
    ),
    units: initialMap.units
      .set(vecA, SmallTank.create(1))
      .set(vecB, SmallTank.create(2))
      .set(vecC, SmallTank.create(1))
      .set(vecD, SmallTank.create(2))
      .set(vecE, SmallTank.create(2)),
  });

  const [, gameActionResponse] = await executeGameActions(map, [
    EndTurnAction(),
    AttackUnitAction(vecB, vecA),
    EndTurnAction(),
    AttackUnitAction(vecA, vecB),
    ActivatePowerAction(Skill.AttackIncreaseMajorDefenseDecreaseMajor, null),
    AttackUnitAction(vecC, vecD),
    EndTurnAction(),
    AttackUnitAction(vecE, vecC),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse)).toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (1,2 → 1,1) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 87, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 40, ammo: [ [ 1, 6 ] ] }, chargeA: 133, chargeB: 15259 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 9, ammo: [ [ 1, 5 ] ] }, unitB: DryUnit { health: 70, ammo: [ [ 1, 5 ] ] }, chargeA: 15154, chargeB: 196 }
      ActivatePower () { skill: 3, units: null, free: false }
      AttackUnit (2,2 → 2,3) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 84, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 5, ammo: [ [ 1, 6 ] ] }, chargeA: 6186, chargeB: 552 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,2 → 2,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 92, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 6, ammo: [ [ 1, 5 ] ] }, chargeA: 693, chargeB: 6522 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }"
    `);
});

test('crystals activate powers', async () => {
  const skills = new Set([Skill.Shield]);
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const mapA = initialMap.copy({
    teams: updatePlayer(initialMap.teams, initialMap.getPlayer(1).copy({ skills })),
    units: initialMap.units.set(vecA, SmallTank.create(1)).set(vecB, SmallTank.create(2)),
  });

  const [gameStateA, gameActionResponseA] = await executeGameActions(mapA, [
    ActivateCrystalAction(Crystal.Power),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponseA)).toMatchInlineSnapshot(`
      "ActivateCrystal { crystal: 0, player: 1, biome: null, hq: null }
      ActivatePower () { skill: 38, units: null, free: true }"
    `);

  expect(gameStateA.at(-1)?.[1].units.get(vecA)?.shield).toBe(true);

  // Powers are not activated when it is a regular crystal effect:
  const effects: Effects = new Map([
    [
      'Start',
      new Set<Effect>([
        {
          actions: [
            {
              biome: Biome.Swamp,
              crystal: Crystal.Memory,
              type: 'ActivateCrystal',
            },
          ],
        },
      ]),
    ],
  ]);

  const [gameStateB, gameActionResponseB] = await executeGameActions(
    mapA,
    [StartAction()],
    effects,
  );

  expect(snapshotEncodedActionResponse(gameActionResponseB)).toMatchInlineSnapshot(`
    "Start
    ActivateCrystal { crystal: 4, player: null, biome: 3, hq: null }
    BeginGame"
  `);

  expect(gameStateB.at(-1)?.[1].units.get(vecA)?.shield).toBe(null);
});

test('players can defeat themselves with powers or defeat their team', async () => {
  const skills = new Set([Skill.HighTide]);

  const vecA = vec(1, 1);
  const vecB = vec(1, 7);
  const vecC = vec(3, 3);
  const vecD = vec(7, 1);
  const vecE = vec(7, 7);
  const vecF = vec(2, 2);
  const vecG = vec(4, 4);

  // Player defeats opponent, game ends.
  const player = initialMap.getPlayer(1);
  const mapA = initialMap.copy({
    map: Array(7 * 7).fill(Plain.id),
    size: new SizeVector(7, 7),
    teams: player.isHumanPlayer()
      ? updatePlayer(
          initialMap.teams,
          player.copy({
            charge: Charge * MaxCharges,
            crystal: Crystal.Power,
            skills,
          }),
        )
      : initialMap.teams,
    units: initialMap.units
      .set(vecA, SmallTank.create(2))
      .set(vecB, SmallTank.create(2))
      .set(vecC, SmallTank.create(1))
      .set(vecD, SmallTank.create(2))
      .set(vecE, SmallTank.create(2)),
  });

  const actions = [ActivatePowerAction(Skill.HighTide, null)];
  const [, gameActionResponseA] = await executeGameActions(mapA, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseA)).toMatchInlineSnapshot(
    `
    "ActivatePower () { skill: 41, units: null, free: false }
    AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
  `,
  );

  // Player defeats themselves, game ends.
  const mapB = mapA.copy({
    units: mapA.units.delete(vecC).set(vecA, Pioneer.create(1)),
  });
  const [, gameActionResponseB] = await executeGameActions(mapB, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseB)).toMatchInlineSnapshot(`
      "ActivatePower () { skill: 41, units: null, free: false }
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
    `);

  // Player defeats every opponent and teammate, game ends.
  const teamA = mapA.teams.get(1)!;
  const mapC = mapA.copy({
    active: [...mapA.active, 3],
    teams: mapA.teams.set(
      1,
      teamA.copy({
        players: teamA.players.set(
          3,
          new HumanPlayer(
            3,
            'User-3',
            1,
            300,
            undefined,
            new Set(),
            new Set(),
            0,
            null,
            0,
            null,
            null,
          ),
        ),
      }),
    ),
    units: mapA.units.set(vecA, SmallTank.create(3)),
  });
  const [, gameActionResponseC] = await executeGameActions(mapC, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseC)).toMatchInlineSnapshot(`
    "ActivatePower () { skill: 41, units: null, free: false }
    AttackUnitGameOver { fromPlayer: 2, toPlayer: 1 }
    GameEnd { objective: null, objectiveId: null, toPlayer: 1, chaosStars: null }"
  `);

  // Player defeats teammate, game continues.
  const mapD = mapC.copy({
    units: mapC.units.set(vecF, SmallTank.create(2)),
  });
  const [, gameActionResponseD] = await executeGameActions(mapD, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseD)).toMatchInlineSnapshot(`
    "ActivatePower () { skill: 41, units: null, free: false }
    AttackUnitGameOver { fromPlayer: 3, toPlayer: 2 }"
  `);

  // Player defeats themselves, game continues.
  const mapF = mapD.copy({
    units: mapD.units.delete(vecC).set(vecA, Pioneer.create(1)).set(vecG, Pioneer.create(3)),
  });
  const [, gameActionResponseF] = await executeGameActions(mapF, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseF)).toMatchInlineSnapshot(`
      "ActivatePower () { skill: 41, units: null, free: false }
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }"
    `);

  // Player defeats themselves and opponent, game ends.
  const mapG = mapC.copy({
    units: mapC.units.set(vecC, SmallTank.create(3)).set(vecA, Pioneer.create(1)),
  });
  const [, gameActionResponseG] = await executeGameActions(mapG, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseG)).toMatchInlineSnapshot(`
      "ActivatePower () { skill: 41, units: null, free: false }
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      AttackUnitGameOver { fromPlayer: 2, toPlayer: 3 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 3, chaosStars: null }"
    `);

  // Player defeats themselves and teammate, game ends.
  const mapH = mapC.copy({
    units: mapC.units.set(vecC, SmallTank.create(2)).set(vecE, Pioneer.create(1)),
  });
  const [, gameActionResponseH] = await executeGameActions(mapH, actions);

  expect(snapshotEncodedActionResponse(gameActionResponseH)).toMatchInlineSnapshot(`
      "ActivatePower () { skill: 41, units: null, free: false }
      BeginTurnGameOver { abandoned: false, fromPlayer: 1 }
      AttackUnitGameOver { fromPlayer: 3, toPlayer: 2 }
      GameEnd { objective: null, objectiveId: null, toPlayer: 2, chaosStars: null }"
    `);
});
