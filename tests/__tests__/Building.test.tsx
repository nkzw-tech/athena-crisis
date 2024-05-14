import {
  Bar,
  BuildingInfo,
  Factory,
  filterBuildings,
} from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { BazookaBear, Cannon } from '@deities/athena/info/Unit.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { HumanPlayer } from '@deities/athena/map/Player.tsx';
import { expect, test } from 'vitest';

BuildingInfo.setConstructor(Building);

test('ensures the configuration for buildings and the units they can create is correct', () => {
  expect(
    new Map(
      filterBuildings(
        (building) => !![...building.getAllBuildableUnits()].length,
      ).map((building) => [
        building.name,
        [
          ...building
            .create(1)
            .getBuildableUnits(
              new HumanPlayer(
                1,
                '1',
                1,
                0,
                undefined,
                new Set(),
                new Set(),
                0,
                null,
                0,
              ),
            ),
        ]
          .map((unit) => unit.name)
          .sort(),
      ]),
    ),
  ).toMatchInlineSnapshot(`
    Map {
      "HQ" => [
        "Flamethrower",
        "Infantry",
        "Medic",
        "Pioneer",
        "Rocket Launcher",
        "Saboteur",
        "Sniper",
      ],
      "Barracks" => [
        "Flamethrower",
        "Infantry",
        "Medic",
        "Pioneer",
        "Rocket Launcher",
        "Saboteur",
        "Sniper",
      ],
      "Factory" => [
        "APU",
        "Anti Air",
        "Artillery",
        "Heavy Artillery",
        "Heavy Tank",
        "Humvee",
        "Jeep",
        "Mammoth",
        "Small Tank",
        "Supply Train",
        "Transport Train",
      ],
      "Airbase" => [
        "Bomber",
        "Fighter Jet",
        "Helicopter",
        "Jetpack",
        "Sea Patrol",
        "Transport Chopper",
        "X-Fighter",
      ],
      "Bar" => [],
      "Shipyard" => [
        "Amphibious Tank",
        "Battleship",
        "Corvette",
        "Destroyer",
        "Frigate",
        "Hovercraft",
        "Lander",
        "Patrol Ship",
        "Support Ship",
      ],
    }
  `);
});

test('units can be added to buildings via skills', () => {
  const playerWithoutSkill = new HumanPlayer(
    1,
    '1',
    1,
    0,
    undefined,
    new Set(),
    new Set(),
    0,
    null,
    0,
  );
  const playerWithSkill = new HumanPlayer(
    1,
    '1',
    1,
    0,
    undefined,
    new Set([Skill.BuyUnitCannon]),
    new Set(),
    0,
    null,
    0,
  );

  expect(
    new Set(Factory.create(1).getBuildableUnits(playerWithSkill)).has(Cannon),
  ).toBeTruthy();
  expect(
    new Set(Factory.create(1).getBuildableUnits(playerWithoutSkill)).has(
      Cannon,
    ),
  ).toBeFalsy();

  expect(Cannon.getCostFor(playerWithSkill)).toBeLessThan(
    Number.POSITIVE_INFINITY,
  );
  expect(Cannon.getCostFor(playerWithoutSkill)).toEqual(
    Number.POSITIVE_INFINITY,
  );
});

test('units can be added to the Bar via skills', () => {
  const playerWithoutSkill = new HumanPlayer(
    1,
    '1',
    1,
    0,
    undefined,
    new Set(),
    new Set(),
    0,
    null,
    0,
  );
  const playerWithSkill = new HumanPlayer(
    1,
    '1',
    1,
    0,
    undefined,
    new Set([Skill.BuyUnitBazookaBear]),
    new Set(),
    0,
    null,
    0,
  );

  expect(
    new Set(Bar.create(1).getBuildableUnits(playerWithSkill)).has(BazookaBear),
  ).toBeTruthy();
  expect(
    new Set(Bar.create(1).getBuildableUnits(playerWithoutSkill)).has(
      BazookaBear,
    ),
  ).toBeFalsy();

  expect(BazookaBear.getCostFor(playerWithSkill)).toBeLessThan(
    Number.POSITIVE_INFINITY,
  );
  expect(BazookaBear.getCostFor(playerWithoutSkill)).toEqual(
    Number.POSITIVE_INFINITY,
  );
});
