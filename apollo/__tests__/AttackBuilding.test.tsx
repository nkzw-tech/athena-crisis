import { House } from '@deities/athena/info/Building.tsx';
import { CostRecoverySkillModifier, Skill } from '@deities/athena/info/Skill.tsx';
import { APU, HeavyTank, Infantry, Jeep, Pioneer } from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import { AttackBuildingAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import executeGameAction from '../actions/executeGameAction.tsx';
import computeVisibleActions from '../lib/computeVisibleActions.tsx';
import gameHasEnded from '../lib/gameHasEnded.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [
      [1, 1, House.create(2).toJSON()],
      [5, 5, House.create(2).toJSON()],
    ],
    map: [8, 1, 3, 1, 3, 1, 1, 1, 3, 1, 1, 3, 1, 1, 1, 3, 1, 3, 1, 1, 2, 2, 2, 8, 8],
    size: { height: 5, width: 5 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, name: 'AI' }] },
    ],
    units: [
      [1, 1, Pioneer.create(2).toJSON()],
      [2, 1, HeavyTank.create(1).toJSON()],
      [1, 2, HeavyTank.create(1).toJSON()],
      [5, 5, APU.create(2).toJSON()],
      [4, 5, HeavyTank.create(1).toJSON()],
      [5, 4, HeavyTank.create(1).toJSON()],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');

const jeepPosition = vec(1, 1);
const attackerPosition = vec(2, 1);
const passenger = Infantry.create(2, { label: 3 }).setHealth(37).setFuel(4).transport();

const createJeepMap = (hasSkill: boolean, passengers: number, buildingHealth: number) => {
  let unit = Jeep.create(2);
  for (let index = 0; index < passengers; index++) {
    unit = unit.load(index === 0 ? passenger : Pioneer.create(2).transport());
  }
  return withModifiers(
    MapData.createMap({
      buildings: [[1, 1, House.create(2).setHealth(buildingHealth).toJSON()]],
      config: { fog: true },
      map: Array(25).fill(1),
      size: { height: 5, width: 5 },
      teams: [
        { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
        {
          id: 2,
          name: '',
          players: [
            HumanPlayer.from(map.getPlayer(2), '2')
              .copy({
                activeSkills: new Set([Skill.CostRecovery]),
                skills: new Set(hasSkill ? [Skill.Jeep] : []),
              })
              .toJSON(),
          ],
        },
        { id: 3, name: '', players: [{ funds: 500, id: 3, userId: '3' }] },
      ],
      units: [
        [2, 1, HeavyTank.create(1).toJSON()],
        [1, 3, Infantry.create(3).toJSON()],
        [1, 1, unit.toJSON()],
      ],
    }),
  );
};

test.each([
  { buildingHealth: 1, hasSkill: true, passengers: 1 },
  { buildingHealth: 1, hasSkill: true, passengers: 2 },
  { buildingHealth: 1, hasSkill: false, passengers: 2 },
  { buildingHealth: 1, hasSkill: true, passengers: 0 },
  { buildingHealth: 100, hasSkill: true, passengers: 2 },
])(
  'Jeep passengers survive building destruction on server and client: %j',
  ({ buildingHealth, hasSkill, passengers }) => {
    const initialMap = createJeepMap(hasSkill, passengers, buildingHealth);
    const observerVision = initialMap.createVisionObject(3);
    const visibleMap = observerVision.apply(initialMap);
    expect(visibleMap.units.has(attackerPosition)).toBe(false);
    expect(visibleMap.units.has(jeepPosition)).toBe(true);
    expect(initialMap.createVisionObject(1).isVisible(initialMap, jeepPosition)).toBe(true);

    const [response, serverMap] = execute(
      initialMap,
      initialMap.createVisionObject(1),
      AttackBuildingAction(attackerPosition, jeepPosition),
    )!;
    const destroyed = buildingHealth === 1;
    const survives = destroyed && hasSkill && passengers > 0;
    const expectedUnit = destroyed
      ? survives
        ? passenger.deploy()
        : undefined
      : initialMap.units.get(jeepPosition);
    const lostUnits = destroyed ? 1 + passengers - (survives ? 1 : 0) : 0;
    expect(serverMap.units.get(jeepPosition)).toEqual(expectedUnit);
    expect(serverMap.getPlayer(1).stats.destroyedUnits).toBe(lostUnits);
    expect(serverMap.getPlayer(2).stats.lostUnits).toBe(lostUnits);
    expect(serverMap.getPlayer(2).stats.lostBuildings).toBe(destroyed ? 1 : 0);
    expect(serverMap.getPlayer(2).funds).toBe(
      500 +
        (destroyed
          ? Math.ceil(Jeep.getCostFor(initialMap.getPlayer(2)) * CostRecoverySkillModifier)
          : 0),
    );

    const visibleResponses = computeVisibleActions(initialMap, observerVision, [
      [response, serverMap],
    ]);
    expect(visibleResponses).toHaveLength(1);
    expect(visibleResponses[0][0].type).toBe('HiddenSourceAttackBuilding');
    const clientMap = applyActionResponse(visibleMap, observerVision, visibleResponses[0][0]);
    expect(clientMap.units.get(jeepPosition)).toEqual(expectedUnit);
    expect(clientMap.getPlayer(2).toJSON()).toEqual(serverMap.getPlayer(2).toJSON());
  },
);

test.each([true, false])(
  'Jeep survival is based on the unit owner’s skill (owner has skill: %s)',
  (hasSkill) => {
    let initialMap = createJeepMap(hasSkill, 1, 1);
    initialMap = initialMap.copy({
      buildings: initialMap.buildings.set(jeepPosition, House.create(0).setHealth(1)),
      teams: updatePlayer(
        initialMap.teams,
        initialMap.getPlayer(1).copy({ skills: new Set(hasSkill ? [] : [Skill.Jeep]) }),
      ),
    });
    const [, result] = execute(
      initialMap,
      initialMap.createVisionObject(1),
      AttackBuildingAction(attackerPosition, jeepPosition),
    )!;
    expect(result.units.get(jeepPosition)).toEqual(hasSkill ? passenger.deploy() : undefined);
    expect(result.getPlayer(2).stats.lostBuildings).toBe(0);
  },
);

test.each([Criteria.Default, Criteria.DefeatAmount] as const)(
  'a surviving Jeep passenger prevents premature victory for objective %s',
  async (type) => {
    let initialMap = createJeepMap(true, 1, 1);
    initialMap = initialMap.copy({
      config: initialMap.config.copy({
        objectives: ImmutableMap([
          [
            0,
            type === Criteria.Default
              ? { hidden: false, type }
              : { amount: 2, hidden: false, optional: false, players: [1], type },
          ],
        ]),
      }),
    });
    const [, activeMap, gameState] = await executeGameAction(
      initialMap,
      initialMap.createVisionObject(1),
      new Map(),
      AttackBuildingAction(attackerPosition, jeepPosition),
      null,
    );
    expect(activeMap?.units.get(jeepPosition)).toEqual(passenger.deploy());
    expect(activeMap?.getPlayer(1).stats.destroyedUnits).toBe(1);
    expect(gameHasEnded(gameState!)).toBe(false);
    expect(gameState).toEqual([]);
  },
);

test.each([0, 2] as const)(
  'neutral units do not counterattack when a building owned by player %s is attacked',
  (buildingPlayer) => {
    const from = vec(2, 1);
    const to = vec(1, 1);
    const defender = HeavyTank.create(0);
    const initialMap = map.copy({
      buildings: map.buildings.set(to, House.create(buildingPlayer)),
      units: map.units.clear().set(from, HeavyTank.create(1).setHealth(1)).set(to, defender),
    });
    const [actionResponse, resultMap] = execute(
      initialMap,
      initialMap.createVisionObject(player1),
      AttackBuildingAction(from, to),
    )!;

    expect(resultMap.buildings.get(to)?.health).toBeGreaterThan(0);
    expect(resultMap.buildings.get(to)?.health).toBeLessThan(100);
    expect(actionResponse).toMatchObject({ hasCounterAttack: false, type: 'AttackBuilding' });
    expect(resultMap.units.get(from)?.health).toBe(1);
    expect(resultMap.units.get(to)).toEqual(defender);
  },
);

test('units do not disappear when a building is attacked and there is no counter attack', async () => {
  const to = vec(1, 1);
  const vision = map.createVisionObject(player1);
  const [, mapState1] = execute(map, vision, AttackBuildingAction(vec(2, 1), to))!;
  const [, mapState2] = execute(mapState1, vision, AttackBuildingAction(vec(1, 2), to))!;
  expect(mapState1.units.get(to)).toEqual(Pioneer.create(2));
  expect(mapState2.units.get(to)).toBeUndefined();

  const to2 = vec(5, 5);
  const [, mapState3] = execute(map, vision, AttackBuildingAction(vec(4, 5), to2))!;
  const [, mapState4] = execute(mapState3, vision, AttackBuildingAction(vec(5, 4), to2))!;
  expect(mapState3.units.get(to2)).toEqual(
    APU.create(2).subtractAmmo(APU.attack.weapons!.get(1)!, 1),
  );
  expect(mapState4.units.get(to2)).toBeUndefined();
});

test('non-countering units on surviving buildings are not counted as destroyed', () => {
  const from = vec(2, 1);
  const to = vec(1, 1);
  const vision = map.createVisionObject(player1);
  const [, resultMap] = execute(map, vision, AttackBuildingAction(from, to))!;
  const [, resultMapWithoutUnit] = execute(
    map.copy({ units: map.units.delete(to) }),
    vision,
    AttackBuildingAction(from, to),
  )!;

  expect(resultMap.buildings.has(to)).toBe(true);
  expect(resultMap.units.get(to)).toEqual(Pioneer.create(2));
  expect(resultMap.getPlayer(1).stats.destroyedUnits).toBe(0);
  expect(resultMap.getPlayer(2).stats.lostUnits).toBe(0);
  expect(resultMap.getPlayer(2).charge).toBe(resultMapWithoutUnit.getPlayer(2).charge);
});
