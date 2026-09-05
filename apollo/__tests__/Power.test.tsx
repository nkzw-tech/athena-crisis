import { Skill } from '@deities/athena/info/Skill.tsx';
import {
  Dragon,
  Infantry,
  Jeep,
  Pioneer,
  TransportHelicopter,
} from '@deities/athena/info/Unit.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { Criteria } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { expect, test } from 'vitest';
import { ActivatePowerAction } from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';
import applyActionResponse from '../actions/applyActionResponse.tsx';
import executeGameAction from '../actions/executeGameAction.tsx';
import computeVisibleActions from '../lib/computeVisibleActions.tsx';

const position = vec(2, 2);
const passenger = Infantry.create(2, { label: 3 }).setHealth(37).setFuel(4).transport();
const jeep = Jeep.create(2).setHealth(1).load(passenger).load(Pioneer.create(2).transport());

const createMap = (unit: Unit, skill: Skill, hasSkill = true) =>
  withModifiers(
    MapData.createMap({
      config: { fog: true },
      map: Array(25).fill(1),
      size: { height: 5, width: 5 },
      teams: ([1, 2] as const).map((id) => ({
        id,
        name: '',
        players: [
          {
            charge: 5 * Charge,
            funds: 0,
            id,
            skills: [
              ...(id === 1 ? [skill] : []),
              ...(id === (hasSkill ? unit.player : 1) ? [Skill.Jeep] : []),
            ],
            userId: String(id),
          },
        ],
      })),
      units: [
        [2, 1, Dragon.create(1).toJSON()],
        [5, 5, Infantry.create(1).toJSON()],
        [position.x, position.y, unit.toJSON()],
      ],
    }),
  );

test.each([Skill.BuyUnitDinosaur, Skill.BuyUnitDragon, Skill.BuyUnitOctopus])(
  'a Jeep deploys one passenger after a fatal power hit on server and client: %s',
  (skill) => {
    const map = createMap(jeep, skill);
    const vision = map.createVisionObject(2);
    const visibleMap = vision.apply(map);
    expect(visibleMap.units.has(vec(5, 5))).toBe(false);

    const [response, serverMap] = execute(
      map,
      map.createVisionObject(1),
      ActivatePowerAction(skill, position),
    )!;
    expect(serverMap.units.get(position)).toEqual(passenger.deploy());
    expect(serverMap.getPlayer(1).stats.destroyedUnits).toBe(2);
    expect(serverMap.getPlayer(2).stats.lostUnits).toBe(2);

    const responses = computeVisibleActions(map, vision, [[response, serverMap]]);
    expect(responses).toHaveLength(1);
    const clientMap = applyActionResponse(visibleMap, vision, responses[0][0]);
    expect(clientMap.units.get(position)).toEqual(passenger.deploy());
    expect(clientMap.getPlayer(2).stats).toEqual(serverMap.getPlayer(2).stats);
  },
);

test.each([
  { expected: undefined, hasSkill: false, losses: 3, unit: jeep },
  { expected: undefined, hasSkill: true, losses: 1, unit: Jeep.create(2).setHealth(1) },
  { expected: jeep.setHealth(50), hasSkill: true, losses: 0, unit: jeep.setHealth(100) },
  {
    expected: undefined,
    hasSkill: true,
    losses: 2,
    unit: TransportHelicopter.create(2).setHealth(1).load(passenger),
  },
  {
    expected: passenger.deploy(),
    hasSkill: true,
    losses: 1,
    unit: Jeep.create(2).setHealth(1).load(passenger),
  },
])(
  'Jeep power survival respects transport state (owner skill: $hasSkill, losses: $losses)',
  ({ expected, hasSkill, losses, unit }) => {
    const map = createMap(unit, Skill.BuyUnitDinosaur, hasSkill);
    const [, result] = execute(
      map,
      map.createVisionObject(1),
      ActivatePowerAction(Skill.BuyUnitDinosaur, position),
    )!;
    expect(result.units.get(position)?.toJSON()).toEqual(expected?.toJSON());
    expect(result.getPlayer(1).stats.destroyedUnits).toBe(losses);
    expect(result.getPlayer(2).stats.lostUnits).toBe(losses);
  },
);

test.each([Criteria.Default, Criteria.DefeatAmount] as const)(
  'a passenger surviving power damage prevents premature victory: %s',
  async (type) => {
    const initialMap = createMap(jeep, Skill.BuyUnitDinosaur);
    const map = initialMap.copy({
      config: initialMap.config.copy({
        objectives: ImmutableMap([
          [
            0,
            type === Criteria.Default
              ? { hidden: false, type }
              : { amount: 3, hidden: false, optional: false, players: [1], type },
          ],
        ]),
      }),
    });
    const [, activeMap, gameState] = await executeGameAction(
      map,
      map.createVisionObject(1),
      new Map(),
      ActivatePowerAction(Skill.BuyUnitDinosaur, position),
      null,
    );
    expect(activeMap?.units.get(position)).toEqual(passenger.deploy());
    expect(activeMap?.getPlayer(1).stats.destroyedUnits).toBe(2);
    expect(gameState).toEqual([]);
  },
);

test('a Jeep hit by its owner’s Dinosaur power preserves its passenger and casualty counts', () => {
  const unit = Jeep.create(1).setHealth(1).load(Infantry.create(1).transport());
  const map = createMap(unit, Skill.BuyUnitDinosaur);
  const [, result] = execute(
    map,
    map.createVisionObject(1),
    ActivatePowerAction(Skill.BuyUnitDinosaur, position),
  )!;
  expect(result.units.get(position)).toEqual(unit.transports![0].deploy());
  expect(result.getPlayer(1).stats.destroyedUnits).toBe(1);
  expect(result.getPlayer(1).stats.lostUnits).toBe(1);
});
