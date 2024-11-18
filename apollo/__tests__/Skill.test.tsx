import { Bar, ResearchLab } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Forest, Forest2, RailTrack } from '@deities/athena/info/Tile.tsx';
import {
  BazookaBear,
  Cannon,
  Flamethrower,
  Infantry,
  Medic,
  Pioneer,
  Saboteur,
  SmallTank,
  Sniper,
  SuperTank,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import { generateUnitName } from '@deities/athena/info/UnitNames.tsx';
import getDefenseStatusEffect from '@deities/athena/lib/getDefenseStatusEffect.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Charge, MaxCharges } from '@deities/athena/map/Configuration.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import {
  ActivatePowerAction,
  AttackUnitAction,
  CaptureAction,
  HealAction,
} from '../action-mutators/ActionMutators.tsx';
import { execute } from '../Action.tsx';

const map = withModifiers(
  MapData.createMap({
    buildings: [[1, 1, ResearchLab.create(0).toJSON()]],
    map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
    size: { height: 3, width: 3 },
    teams: [
      { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 500, id: 2, name: 'AI' }] },
    ],
    units: [
      [1, 1, Pioneer.create(1).capture().toJSON()],
      [2, 1, SmallTank.create(1).toJSON()],
      [3, 1, SmallTank.create(2).toJSON()],
      [1, 2, SmallTank.create(1).toJSON()],
      [2, 2, SmallTank.create(2).toJSON()],
    ],
  }),
);
const player1 = HumanPlayer.from(map.getPlayer(1), '1');
const vision = map.createVisionObject(player1);

const fromA = vec(2, 1);
const toA = vec(3, 1);
const fromB = vec(1, 2);
const toB = vec(2, 2);

test('status effects from leaders are applied', async () => {
  const leader = {
    name: generateUnitName(true),
  };
  const regular = {
    name: generateUnitName(false),
  };
  const [, state1] = execute(
    map.copy({
      units: map.units
        .set(fromA, SmallTank.create(1, leader))
        .set(toA, SmallTank.create(2, regular)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, state2] = execute(
    map.copy({
      units: map.units
        .set(fromA, SmallTank.create(1, regular))
        .set(toA, SmallTank.create(2, regular)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, state3] = execute(
    map.copy({
      units: map.units
        .set(fromA, SmallTank.create(1, leader))
        .set(toA, SmallTank.create(2, leader)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const unitA1 = state1.units.get(fromA)!;
  const unitB1 = state1.units.get(toA)!;

  const unitA2 = state2.units.get(fromA)!;
  const unitB2 = state2.units.get(toA)!;

  const unitA3 = state3.units.get(fromA)!;
  const unitB3 = state3.units.get(toA)!;

  // A1 has more defense than A2.
  expect(unitA1.health).toBeGreaterThan(unitA2.health);
  // A1 has more attack than A2.
  expect(unitB1.health).toBeLessThan(unitB2.health);

  // A2 and B2 are weaker, therefore dealing less damage than A3 and B3.
  expect(unitA2.health).toBeLessThanOrEqual(unitA3.health);
  expect(unitB2.health).toBeGreaterThan(unitB3.health);

  // A3 is attacked by a stronger unit than A1.
  expect(unitA1.health).toBeGreaterThan(unitA3.health);
  // B3 has higher defense than B1.
  expect(unitB1.health).toBeLessThan(unitB3.health);
});

test('status effects from research labs are applied', async () => {
  const [, state1] = execute(map, vision, AttackUnitAction(fromA, toA))!;
  const [, state2] = execute(state1, vision, CaptureAction(vec(1, 1)))!;
  const [, state3] = execute(
    state2,
    vision,
    AttackUnitAction(vec(1, 2), vec(2, 2)),
  )!;
  const unitB = state3.units.get(toA)!;
  const unitC = state3.units.get(vec(2, 2))!;
  expect(unitB.health).toBeGreaterThan(unitC.health);
  expect([unitB.format(), unitC.format()]).toMatchInlineSnapshot(`
    [
      {
        "ammo": [
          [
            1,
            6,
          ],
        ],
        "fuel": 30,
        "health": 50,
        "id": 5,
        "player": 2,
      },
      {
        "ammo": [
          [
            1,
            6,
          ],
        ],
        "fuel": 30,
        "health": 41,
        "id": 5,
        "player": 2,
      },
    ]
  `);
});

test('status effects from skills are applied', async () => {
  const options = {
    name: generateUnitName(false),
  };
  const [, state1] = execute(
    map.copy({
      teams: updatePlayer(
        map.teams,
        map.getPlayer(1).copy({ skills: new Set([Skill.AttackIncreaseMinor]) }),
      ),
      units: map.units
        .set(fromA, SmallTank.create(1, options))
        .set(toA, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, state2] = execute(
    map.copy({
      units: map.units
        .set(fromA, SmallTank.create(1, options))
        .set(toA, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, state3] = execute(
    map.copy({
      teams: updatePlayer(
        map.teams,
        map
          .getPlayer(2)
          .copy({ skills: new Set([Skill.DefenseIncreaseMinor]) }),
      ),
      units: map.units
        .set(fromA, SmallTank.create(1, options))
        .set(toA, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const unitB1 = state1.units.get(toA)!;
  const unitBDefault = state2.units.get(toA)!;
  const unitB3 = state3.units.get(toA)!;

  // A1 has more attack than A2.
  expect(unitB1.health).toBeLessThan(unitBDefault.health);

  // B3 has higher defense than B1.
  expect(unitB3.health).toBeGreaterThan(unitBDefault.health);
});

test('status effects from skills can increase and decrease attack or defense', async () => {
  const options = {
    name: generateUnitName(false),
  };
  const initialMap = map.copy({
    units: map.units
      .set(fromA, SmallTank.create(1, options))
      .set(toA, SmallTank.create(2, options)),
  });
  const initialMapWithSkills = initialMap.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(1).copy({
        skills: new Set([Skill.AttackIncreaseMajorDefenseDecreaseMajor]),
      }),
    ),
  });

  const [, defaultAttackAtoB] = execute(
    initialMap,
    vision,
    AttackUnitAction(fromA, toA),
  )!;
  const [, defaultAttackBtoA] = execute(
    initialMap.copy({
      currentPlayer: 2,
    }),
    vision,
    AttackUnitAction(toA, fromA),
  )!;

  const [, skillAttackAtoB] = execute(
    initialMapWithSkills,
    vision,
    AttackUnitAction(fromA, toA),
  )!;
  const [, skillAttackBtoA] = execute(
    initialMapWithSkills.copy({
      currentPlayer: 2,
    }),
    vision,
    AttackUnitAction(toA, fromA),
  )!;

  // A with skill has more attack than without.
  expect(skillAttackAtoB.units.get(toA)!.health).toBeLessThan(
    defaultAttackAtoB.units.get(toA)!.health,
  );

  // But A with skill also has lower defense.
  expect(skillAttackBtoA.units.get(fromA)!.health).toBeLessThan(
    defaultAttackBtoA.units.get(fromA)!.health,
  );
});

test('status effects can increase defense on specific tiles', async () => {
  const options = {
    name: generateUnitName(false),
  };

  const newMapA = map.map.slice();
  const newMapB = map.map.slice();
  newMapA[map.getTileIndex(toA)] = Forest.id;
  newMapB[map.getTileIndex(toA)] = Forest2.id;
  const initialMap = map.copy({
    map: newMapA,
    units: map.units
      .set(fromA, Infantry.create(1, options))
      .set(toA, Saboteur.create(2, options)),
  });
  const mapWithSkill = initialMap.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({
        skills: new Set([Skill.UnitInfantryForestAttackAndDefenseIncrease]),
      }),
    ),
  });
  const mapWithForestVariant = initialMap.copy({
    map: newMapB,
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({
        skills: new Set([Skill.UnitInfantryForestAttackAndDefenseIncrease]),
      }),
    ),
  });

  const [, defaultAttackAtoB] = execute(
    initialMap,
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, skillAttackAtoB] = execute(
    mapWithSkill,
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, forestVariantAttackAtoB] = execute(
    mapWithForestVariant,
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  // Player 2 with skill has more defense than without.
  expect(skillAttackAtoB.units.get(toA)!.health).toBeGreaterThan(
    defaultAttackAtoB.units.get(toA)!.health,
  );

  // This skill is also applied to Forest variants.
  expect(skillAttackAtoB.units.get(toA)!.health).toEqual(
    forestVariantAttackAtoB.units.get(toA)!.health,
  );
});

test('status effects can increase attack on specific tiles', async () => {
  const options = {
    name: generateUnitName(false),
  };
  const newMap = map.map.slice();
  newMap[map.getTileIndex(fromA)] = RailTrack.id;

  const initialMap = map.copy({
    map: newMap,
    units: map.units
      .set(fromA, Infantry.create(1, options))
      .set(toA, Saboteur.create(2, options)),
  });

  const initialMapWithSkills = initialMap.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(1).copy({
        activeSkills: new Set([
          Skill.UnitRailDefenseIncreasePowerAttackIncrease,
        ]),
      }),
    ),
  });

  const [, defaultAttackAtoB] = execute(
    initialMap,
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, skillAttackAtoB] = execute(
    initialMapWithSkills,
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  // A with skill has more attack than without.
  expect(skillAttackAtoB.units.get(toA)!.health).toBeLessThan(
    defaultAttackAtoB.units.get(toA)!.health,
  );
});

test('status effects from skills may lower unit costs', async () => {
  const player = map.getPlayer(1);
  const playerWithSkill = player.copy({
    skills: new Set([Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor]),
  });

  expect(SmallTank.getCostFor(player)).toBeGreaterThan(
    SmallTank.getCostFor(playerWithSkill),
  );

  const playerWithCannon = player.copy({
    skills: new Set([Skill.BuyUnitCannon]),
  });
  expect(Cannon.getCostFor(player)).toBeGreaterThan(
    Cannon.getCostFor(playerWithCannon),
  );

  // Skills can also be stacked.
  const playerWithCannonAndCostSkills = player.copy({
    skills: new Set([
      Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor,
      Skill.BuyUnitCannon,
    ]),
  });
  expect(Cannon.getCostFor(playerWithCannon)).toBeGreaterThan(
    Cannon.getCostFor(playerWithCannonAndCostSkills),
  );
});

test('sniper leader units can attack without unfolding', async () => {
  const player = map.getPlayer(1);
  const playerWithSkill = player.copy({
    skills: new Set([Skill.UnitAbilitySniperImmediateAction]),
  });

  const unitA = Sniper.create(1, { name: -1 });
  const unitB = Sniper.create(1);
  expect(unitA.canAttack(player)).toBeFalsy();
  expect(unitA.unfold().canAttack(player)).toBeTruthy();

  expect(unitA.canAttack(playerWithSkill)).toBeTruthy();
  expect(unitA.unfold().canAttack(playerWithSkill)).toBeTruthy();
  expect(unitB.canAttack(playerWithSkill)).toBeFalsy();
});

test('sniper leader units can capture with a skill', async () => {
  const player = map.getPlayer(1);
  const playerWithSkill = player.copy({
    skills: new Set([Skill.UnitAbilitySniperImmediateAction]),
  });

  const unitA = Sniper.create(1, { name: -1 });
  const unitB = Sniper.create(1);
  expect(unitA.canCapture(player)).toBeFalsy();
  expect(unitA.canCapture(playerWithSkill)).toBeTruthy();
  expect(unitB.canCapture(playerWithSkill)).toBeFalsy();
});

test('skills can extend the range of units', async () => {
  const skills = new Set([Skill.MovementIncreaseGroundUnitDefenseDecrease]);
  const player = map.getPlayer(1);
  const playerWithSkill = player.copy({
    skills,
  });
  const playerWithActiveSkill = player.copy({
    activeSkills: skills,
    skills,
  });

  expect(SmallTank.getRadiusFor(player1)).toBeLessThan(
    SmallTank.getRadiusFor(playerWithSkill),
  );

  expect(Pioneer.getRadiusFor(player1)).toEqual(
    Pioneer.getRadiusFor(playerWithSkill),
  );

  expect(SmallTank.getRadiusFor(playerWithActiveSkill)).toBeGreaterThan(
    SmallTank.getRadiusFor(playerWithSkill),
  );
});

test('activating a power adds the active status effect of a power', () => {
  const skills = new Set([Skill.AttackIncreaseMinor]);
  const options = {
    name: generateUnitName(false),
  };
  const [, state1] = execute(
    map.copy({
      teams: updatePlayer(
        map.teams,
        map.getPlayer(1).copy({ activeSkills: skills, skills }),
      ),
      units: map.units
        .set(fromA, SmallTank.create(1, options))
        .set(toA, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const [, state2] = execute(
    map.copy({
      teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
      units: map.units
        .set(fromA, SmallTank.create(1, options))
        .set(toA, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  const unitB1 = state1.units.get(toA)!;
  const unitBDefault = state2.units.get(toA)!;

  // A1 has more attack than A2.
  expect(unitB1.health).toBeLessThan(unitBDefault.health);
});

test(`cannot activate a skill that the player doesn't own or if the player doesn't have enough charges`, () => {
  const skills = new Set([Skill.AttackIncreaseMinor]);
  const mapA = map.copy({
    teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
  });

  // Player does not own this skill.
  expect(
    execute(
      mapA,
      vision,
      ActivatePowerAction(Skill.AttackIncreaseMajorDefenseDecreaseMajor),
    ),
  ).toBe(null);

  // Player does not have enough charges.
  expect(
    execute(mapA, vision, ActivatePowerAction(Skill.AttackIncreaseMinor)),
  ).toBe(null);

  // Skill is already activated.
  expect(
    execute(
      mapA.copy({
        teams: updatePlayer(
          mapA.teams,
          mapA
            .getPlayer(1)
            .copy({ activeSkills: skills, charge: Charge * MaxCharges }),
        ),
      }),
      vision,
      ActivatePowerAction(Skill.AttackIncreaseMinor),
    ),
  ).toBe(null);

  // It works when the player has enough charges:
  const [actionResponse] = execute(
    mapA.copy({
      teams: updatePlayer(
        mapA.teams,
        mapA.getPlayer(1).copy({ charge: Charge * MaxCharges }),
      ),
    }),
    vision,
    ActivatePowerAction(Skill.AttackIncreaseMinor),
  )!;

  expect(actionResponse.type).toBe('ActivatePower');
  if (actionResponse.type !== 'ActivatePower') {
    throw new Error(`Expected 'actionResponse' type to be 'ActivatePower'.`);
  }

  expect(actionResponse.skill).toBe(Skill.AttackIncreaseMinor);
});

test('can enable some units and disable others', async () => {
  const player = map.getPlayer(1);
  const playerWithSkill = player.copy({
    skills: new Set([Skill.BuyUnitZombieDefenseDecreaseMajor]),
  });

  expect(Zombie.getCostFor(player)).toBe(Number.POSITIVE_INFINITY);
  expect(Zombie.getCostFor(playerWithSkill)).toBeLessThan(
    Number.POSITIVE_INFINITY,
  );

  expect(Pioneer.getCostFor(player)).toBeLessThan(Number.POSITIVE_INFINITY);
  expect(Pioneer.getCostFor(playerWithSkill)).toBe(Number.POSITIVE_INFINITY);
});

test('can modify the range of units using a skill', async () => {
  const player = map.getPlayer(1);
  const skills = new Set([Skill.BuyUnitBazookaBear]);
  const playerWithSkill = player.copy({
    skills,
  });
  const playerWithActiveSkill = player.copy({
    activeSkills: skills,
    skills,
  });

  expect(BazookaBear.getRangeFor(player)).toMatchInlineSnapshot(`
    [
      1,
      2,
    ]
  `);
  expect(BazookaBear.getRangeFor(playerWithSkill)).toMatchInlineSnapshot(`
    [
      1,
      2,
    ]
  `);
  expect(BazookaBear.getRangeFor(playerWithActiveSkill)).toMatchInlineSnapshot(`
    [
      1,
      3,
    ]
  `);

  expect(Bar.getCostFor(player)).toBe(Number.POSITIVE_INFINITY);
  expect(Bar.getCostFor(playerWithSkill)).toBeLessThan(
    Number.POSITIVE_INFINITY,
  );
});

test('the counter attack skill makes counter attacks more powerful', () => {
  const skills = new Set([Skill.CounterAttackPower]);
  const options = {
    name: generateUnitName(false),
  };
  const [, state1] = execute(map, vision, AttackUnitAction(fromA, toA))!;
  const [, state2] = execute(
    map.copy({
      teams: updatePlayer(
        map.teams,
        map.getPlayer(2).copy({ activeSkills: skills, skills }),
      ),
      units: map.units
        .set(fromA, SmallTank.create(1, options))
        .set(toA, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(fromA, toA),
  )!;

  expect(state1.units.get(fromA)!.health).toBeGreaterThan(
    state1.units.get(toA)!.health,
  );
  expect(state2.units.get(fromA)!.health).toEqual(
    state2.units.get(toA)!.health,
  );
});

test('the commander skill makes leader units stronger', () => {
  const skills = new Set([Skill.BuyUnitCommander]);
  const options = {
    name: generateUnitName(true),
  };
  const mapA = map.copy({
    teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
    units: map.units.set(fromA, SmallTank.create(1, options)),
  });
  const mapB = mapA.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(1).copy({ activeSkills: skills }),
    ),
  });
  const [, state1] = execute(mapA, vision, AttackUnitAction(fromA, toA))!;
  const [, state2] = execute(mapB, vision, AttackUnitAction(fromA, toA))!;
  const [, state3] = execute(mapB, vision, AttackUnitAction(fromB, toB))!;

  expect(state1.units.get(toA)!.health).toBeGreaterThan(0);
  expect(state2.units.get(toA)).toBeUndefined();
  expect(state3.units.get(toB)!.health).toBeGreaterThan(0);
});

test('unit prices always round up', () => {
  const skills = new Set([Skill.AttackIncreaseMajorDefenseDecreaseMajor]);
  const player = map.getPlayer(1);
  const playerWithOneSkill = map.getPlayer(1).copy({ skills });
  const playerWithTwoSkills = map
    .getPlayer(1)
    .copy({ skills: new Set([...skills, Skill.AttackIncreaseMinor]) });

  expect(Flamethrower.getCostFor(player)).toBeLessThan(
    Flamethrower.getCostFor(playerWithOneSkill),
  );

  expect(Flamethrower.getCostFor(playerWithOneSkill)).toEqual(
    Flamethrower.getCostFor(playerWithTwoSkills),
  );
});

test('the Charge skill increases charge accumulation', async () => {
  const skills = new Set([Skill.Charge]);
  const mapA = map.copy({
    units: map.units
      .set(fromA, SmallTank.create(1))
      .set(toA, SmallTank.create(2)),
  });
  const mapB = map.copy({
    teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
  });
  const [, state1] = execute(mapA, vision, AttackUnitAction(fromA, toA))!;
  const [, state2] = execute(mapB, vision, AttackUnitAction(fromA, toA))!;

  expect(state2.getPlayer(1).charge).toBeGreaterThan(
    state1.getPlayer(1).charge,
  );
});

test('defense cannot go negative', async () => {
  const skills = new Set([
    Skill.DecreaseUnitCostAttackAndDefenseDecreaseMinor,
    Skill.BuyUnitZombieDefenseDecreaseMajor,
    Skill.UnlockZombie,
  ]);
  const mapA = map.copy({
    teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
    units: map.units
      .set(fromA, SuperTank.create(1))
      .set(toA, SmallTank.create(2)),
  });

  expect(
    getDefenseStatusEffect(mapA, mapA.units.get(fromA)!, null),
  ).toBeGreaterThanOrEqual(0);
});

test('adds a shield when healing units with the shield skill', async () => {
  const skills = new Set([Skill.Shield]);
  const mapA = map.copy({
    units: map.units
      .set(fromA, Medic.create(1))
      .set(toA, Infantry.create(1).setHealth(50)),
  });

  const [, resultMapA] = execute(mapA, vision, HealAction(fromA, toA))!;
  expect(resultMapA.units.get(toA)!.shield).toBe(null);

  const mapB = mapA.copy({
    teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
  });
  const [, resultMapB] = execute(mapB, vision, HealAction(fromA, toA))!;
  expect(resultMapB.units.get(toA)!.shield).toBe(true);
});
