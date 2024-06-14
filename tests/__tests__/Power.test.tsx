import {
  ActivatePowerAction,
  AttackUnitAction,
  EndTurnAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { SmallTank } from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge, MaxCharges } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import executeGameActions from '../executeGameActions.tsx';
import snapshotEncodedActionResponse from '../snapshotEncodedActionResponse.tsx';

const initialMap = withModifiers(
  MapData.createMap({
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
        players: [{ funds: 500, id: 1, userId: 'User-1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ funds: 500, id: 2, userId: 'User-2' }],
      },
    ],
  }),
);

test('skills are active until the beginning of the next turn', () => {
  const skills = new Set([Skill.AttackIncreaseMajorDefenseDecreaseMajor]);
  const vecA = vec(1, 1);
  const vecB = vec(1, 2);
  const vecC = vec(2, 2);
  const vecD = vec(2, 3);
  const vecE = vec(3, 2);
  const map = initialMap.copy({
    teams: updatePlayer(
      initialMap.teams,
      initialMap.getPlayer(1).copy({
        charge: Charge * MaxCharges,
        skills,
      }),
    ),
    units: initialMap.units
      .set(vecA, SmallTank.create(1))
      .set(vecB, SmallTank.create(2))
      .set(vecC, SmallTank.create(1))
      .set(vecD, SmallTank.create(2))
      .set(vecE, SmallTank.create(2)),
  });

  const [, gameActionResponse] = executeGameActions(map, [
    EndTurnAction(),
    AttackUnitAction(vecB, vecA),
    EndTurnAction(),
    AttackUnitAction(vecA, vecB),
    ActivatePowerAction(Skill.AttackIncreaseMajorDefenseDecreaseMajor),
    AttackUnitAction(vecC, vecD),
    EndTurnAction(),
    AttackUnitAction(vecE, vecC),
    EndTurnAction(),
  ]);

  expect(snapshotEncodedActionResponse(gameActionResponse))
    .toMatchInlineSnapshot(`
      "EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 1, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (1,2 → 1,1) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 87, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 41, ammo: [ [ 1, 6 ] ] }, chargeA: 131, chargeB: 15254 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (1,1 → 1,2) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 11, ammo: [ [ 1, 5 ] ] }, unitB: DryUnit { health: 70, ammo: [ [ 1, 5 ] ] }, chargeA: 15150, chargeB: 194 }
      ActivatePower { skill: 3 }
      AttackUnit (2,2 → 2,3) { hasCounterAttack: true, playerA: 1, playerB: 2, unitA: DryUnit { health: 85, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 5, ammo: [ [ 1, 6 ] ] }, chargeA: 6181, chargeB: 550 }
      EndTurn { current: { funds: 500, player: 1 }, next: { funds: 500, player: 2 }, round: 2, rotatePlayers: false, supply: null, miss: false }
      AttackUnit (3,2 → 2,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 92, ammo: [ [ 1, 6 ] ] }, unitB: DryUnit { health: 7, ammo: [ [ 1, 5 ] ] }, chargeA: 690, chargeB: 6517 }
      EndTurn { current: { funds: 500, player: 2 }, next: { funds: 500, player: 1 }, round: 3, rotatePlayers: false, supply: null, miss: false }"
    `);
});
