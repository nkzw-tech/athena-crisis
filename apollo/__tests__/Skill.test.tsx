import { ResearchLab } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Forest, Forest2, RailTrack } from '@deities/athena/info/Tile.tsx';
import {
  BazookaBear,
  Cannon,
  Infantry,
  Pioneer,
  Saboteur,
  SmallTank,
  Sniper,
  Zombie,
} from '@deities/athena/info/Unit.tsx';
import { generateUnitName } from '@deities/athena/info/UnitNames.tsx';
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

const from = vec(2, 1);
const to = vec(3, 1);

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
        .set(from, SmallTank.create(1, leader))
        .set(to, SmallTank.create(2, regular)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const [, state2] = execute(
    map.copy({
      units: map.units
        .set(from, SmallTank.create(1, regular))
        .set(to, SmallTank.create(2, regular)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const [, state3] = execute(
    map.copy({
      units: map.units
        .set(from, SmallTank.create(1, leader))
        .set(to, SmallTank.create(2, leader)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const unitA1 = state1.units.get(from)!;
  const unitB1 = state1.units.get(to)!;

  const unitA2 = state2.units.get(from)!;
  const unitB2 = state2.units.get(to)!;

  const unitA3 = state3.units.get(from)!;
  const unitB3 = state3.units.get(to)!;

  // A1 has more defense than A2.
  expect(unitA1.health).toBeGreaterThan(unitA2.health);
  // A1 has more attack than A2.
  expect(unitB1.health).toBeLessThan(unitB2.health);

  // A2 and B2 are weaker, therefore dealing less damage than A3 and B3.
  expect(unitA2.health).toBeGreaterThanOrEqual(unitA3.health);
  expect(unitB2.health).toBeGreaterThan(unitB3.health);

  // A3 is attacked by a stronger unit than A1.
  expect(unitA1.health).toBeGreaterThan(unitA3.health);
  // B3 has higher defense than B1.
  expect(unitB1.health).toBeLessThan(unitB3.health);
});

test('status effects from research labs are applied', async () => {
  const [, state1] = execute(map, vision, AttackUnitAction(from, to))!;
  const [, state2] = execute(state1, vision, CaptureAction(vec(1, 1)))!;
  const [, state3] = execute(
    state2,
    vision,
    AttackUnitAction(vec(1, 2), vec(2, 2)),
  )!;
  const unitB = state3.units.get(to)!;
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
        "health": 51,
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
        "health": 42,
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
        .set(from, SmallTank.create(1, options))
        .set(to, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const [, state2] = execute(
    map.copy({
      units: map.units
        .set(from, SmallTank.create(1, options))
        .set(to, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(from, to),
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
        .set(from, SmallTank.create(1, options))
        .set(to, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const unitB1 = state1.units.get(to)!;
  const unitBDefault = state2.units.get(to)!;
  const unitB3 = state3.units.get(to)!;

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
      .set(from, SmallTank.create(1, options))
      .set(to, SmallTank.create(2, options)),
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
    AttackUnitAction(from, to),
  )!;
  const [, defaultAttackBtoA] = execute(
    initialMap.copy({
      currentPlayer: 2,
    }),
    vision,
    AttackUnitAction(to, from),
  )!;

  const [, skillAttackAtoB] = execute(
    initialMapWithSkills,
    vision,
    AttackUnitAction(from, to),
  )!;
  const [, skillAttackBtoA] = execute(
    initialMapWithSkills.copy({
      currentPlayer: 2,
    }),
    vision,
    AttackUnitAction(to, from),
  )!;

  // A with skill has more attack than without.
  expect(skillAttackAtoB.units.get(to)!.health).toBeLessThan(
    defaultAttackAtoB.units.get(to)!.health,
  );

  // But A with skill also has lower defense.
  expect(skillAttackBtoA.units.get(from)!.health).toBeLessThan(
    defaultAttackBtoA.units.get(from)!.health,
  );
});

test('status effects can increase defense on specific tiles', async () => {
  const options = {
    name: generateUnitName(false),
  };

  const newMapA = map.map.slice();
  const newMapB = map.map.slice();
  newMapA[map.getTileIndex(to)] = Forest.id;
  newMapB[map.getTileIndex(to)] = Forest2.id;
  const initialMap = map.copy({
    map: newMapA,
    units: map.units
      .set(from, Infantry.create(1, options))
      .set(to, Saboteur.create(2, options)),
  });
  const mapWithSkill = initialMap.copy({
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({
        skills: new Set([Skill.UnitInfantryForestDefenseIncrease]),
      }),
    ),
  });
  const mapWithForestVariant = initialMap.copy({
    map: newMapB,
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({
        skills: new Set([Skill.UnitInfantryForestDefenseIncrease]),
      }),
    ),
  });

  const [, defaultAttackAtoB] = execute(
    initialMap,
    vision,
    AttackUnitAction(from, to),
  )!;

  const [, skillAttackAtoB] = execute(
    mapWithSkill,
    vision,
    AttackUnitAction(from, to),
  )!;

  const [, forestVariantAttackAtoB] = execute(
    mapWithForestVariant,
    vision,
    AttackUnitAction(from, to),
  )!;

  // Player 2 with skill has more defense than without.
  expect(skillAttackAtoB.units.get(to)!.health).toBeGreaterThan(
    defaultAttackAtoB.units.get(to)!.health,
  );

  // This skill is also applied to Forest variants.
  expect(skillAttackAtoB.units.get(to)!.health).toEqual(
    forestVariantAttackAtoB.units.get(to)!.health,
  );
});

test('status effects can increase attack on specific tiles', async () => {
  const options = {
    name: generateUnitName(false),
  };
  const newMap = map.map.slice();
  newMap[map.getTileIndex(from)] = RailTrack.id;

  const initialMap = map.copy({
    map: newMap,
    units: map.units
      .set(from, Infantry.create(1, options))
      .set(to, Saboteur.create(2, options)),
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
    AttackUnitAction(from, to),
  )!;

  const [, skillAttackAtoB] = execute(
    initialMapWithSkills,
    vision,
    AttackUnitAction(from, to),
  )!;

  // A with skill has more attack than without.
  expect(skillAttackAtoB.units.get(to)!.health).toBeLessThan(
    defaultAttackAtoB.units.get(to)!.health,
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

test('snipers can attack without unfolding', async () => {
  const player = map.getPlayer(1);
  const playerWithSkill = player.copy({
    skills: new Set([Skill.UnitAbilitySniperImmediateAction]),
  });

  const unit = Sniper.create(1);
  expect(unit.canAttack(player)).toBeFalsy();
  expect(unit.unfold().canAttack(player)).toBeTruthy();

  expect(unit.canAttack(playerWithSkill)).toBeTruthy();
  expect(unit.unfold().canAttack(playerWithSkill)).toBeTruthy();
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
        .set(from, SmallTank.create(1, options))
        .set(to, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const [, state2] = execute(
    map.copy({
      teams: updatePlayer(map.teams, map.getPlayer(1).copy({ skills })),
      units: map.units
        .set(from, SmallTank.create(1, options))
        .set(to, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  const unitB1 = state1.units.get(to)!;
  const unitBDefault = state2.units.get(to)!;

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
});

test('the counter attack skill makes counter attacks more powerful', () => {
  const skills = new Set([Skill.CounterAttackPower]);
  const options = {
    name: generateUnitName(false),
  };
  const [, state1] = execute(map, vision, AttackUnitAction(from, to))!;
  const [, state2] = execute(
    map.copy({
      teams: updatePlayer(
        map.teams,
        map.getPlayer(2).copy({ activeSkills: skills, skills }),
      ),
      units: map.units
        .set(from, SmallTank.create(1, options))
        .set(to, SmallTank.create(2, options)),
    }),
    vision,
    AttackUnitAction(from, to),
  )!;

  expect(state1.units.get(from)!.health).toBeGreaterThan(
    state1.units.get(to)!.health,
  );
  expect(state2.units.get(from)!.health).toEqual(state2.units.get(to)!.health);
});
