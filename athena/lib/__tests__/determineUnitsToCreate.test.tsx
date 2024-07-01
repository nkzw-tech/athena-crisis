import { expect, test } from 'vitest';
import { Barracks, Factory, House } from '../../info/Building.tsx';
import { ConstructionSite } from '../../info/Tile.tsx';
import { Infantry, Jeep, SmallTank, UnitInfo } from '../../info/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import determineUnitsToCreate from '../determineUnitsToCreate.tsx';
import withModifiers from '../withModifiers.tsx';

const format = (unitInfos: ReadonlyArray<UnitInfo>) =>
  unitInfos.map((info) => info.name).sort();

const size = 20;
const map = withModifiers(
  MapData.createMap({
    map: Array(size * size).fill(1),
    size: { height: size, width: size },
    teams: [
      { id: 1, name: '', players: [{ funds: 0, id: 1, userId: '1' }] },
      { id: 2, name: '', players: [{ funds: 0, id: 2, name: 'AI' }] },
    ],
  }),
);
const player1 = map.getCurrentPlayer();

const options = {
  canCreateBuildUnits: true,
  canCreateCaptureUnits: true,
  canCreateSupplyUnits: true,
  canCreateTransportUnits: true,
};
const barrackUnits = [...Barracks.create(1).getBuildableUnits(player1)];
const factoryUnits = [...Factory.create(1).getBuildableUnits(player1)];

const getPlayerUnits = (map: MapData) => [
  ...map.units.filter((unit) => map.matchesPlayer(unit, player1)).values(),
];

test('`determineUnitsToCreate` builds Pioneers at the beginning of a game with Construction Sites', () => {
  expect(
    format(
      determineUnitsToCreate(
        map,
        player1,
        getPlayerUnits(map),
        barrackUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      "Flamethrower",
      "Infantry",
      "Medic",
      "Pioneer",
      "Rocket Launcher",
      "Saboteur",
      "Sniper",
    ]
  `);

  expect(
    format(
      determineUnitsToCreate(
        map.copy({
          map: map.map.slice().fill(ConstructionSite.id),
        }),
        player1,
        getPlayerUnits(map),
        barrackUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      "Pioneer",
    ]
  `);
});

test('`determineUnitsToCreate` builds Infantry, Rocket Launchers or Flamethrowers at the beginning of a game with neutral structures', () => {
  expect(
    format(
      determineUnitsToCreate(
        map.copy({
          buildings: map.buildings
            .set(vec(1, 1), House.create(0))
            .set(vec(2, 1), House.create(0))
            .set(vec(3, 1), House.create(0))
            .set(vec(4, 1), House.create(0))
            .set(vec(5, 1), House.create(0)),
        }),
        player1,
        getPlayerUnits(map),
        barrackUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      "Flamethrower",
      "Infantry",
      "Pioneer",
      "Rocket Launcher",
    ]
  `);
});

test('`determineUnitsToCreate` builds supply units when there are units with supply needs', () => {
  const currentMap = map.copy({
    units: map.units
      .set(vec(1, 1), SmallTank.create(1).setFuel(3))
      .set(vec(2, 1), SmallTank.create(1).setFuel(3))
      .set(vec(3, 1), SmallTank.create(1).setFuel(3))
      .set(vec(4, 1), SmallTank.create(1).setFuel(3))
      .set(vec(5, 1), SmallTank.create(1).setFuel(3)),
  });
  expect(
    format(
      determineUnitsToCreate(
        currentMap,
        player1,
        getPlayerUnits(currentMap),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      "Jeep",
      "Supply Train",
    ]
  `);
});

test('`determineUnitsToCreate` does not build supply units when there are units with supply needs but there enough supply units', () => {
  const currentMap = map.copy({
    units: map.units
      .set(vec(1, 1), SmallTank.create(1).setFuel(3))
      .set(vec(2, 1), SmallTank.create(1).setFuel(3))
      .set(vec(3, 1), SmallTank.create(1).setFuel(3))
      .set(vec(4, 1), SmallTank.create(1).setFuel(3))
      .set(vec(5, 1), Jeep.create(1)),
  });
  expect(
    format(
      determineUnitsToCreate(
        currentMap,
        player1,
        getPlayerUnits(currentMap),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
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
    ]
  `);
});

test('`determineUnitsToCreate` builds transporters early in the game', () => {
  const currentMap = map.copy({
    round: 3,
    units: map.units
      .set(vec(1, 1), Infantry.create(1))
      .set(vec(2, 1), Infantry.create(1)),
  });
  expect(
    format(
      determineUnitsToCreate(
        currentMap,
        player1,
        getPlayerUnits(currentMap),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      "Jeep",
      "Transport Train",
    ]
  `);
});

test('`determineUnitsToCreate` does not build transporters early in the game if the player has many units', () => {
  const currentMap = map.copy({
    round: 3,
    units: map.units
      .set(vec(1, 1), Infantry.create(1))
      .set(vec(2, 1), Infantry.create(1))
      .set(vec(3, 1), Infantry.create(1))
      .set(vec(4, 1), Infantry.create(1))
      .set(vec(5, 1), Infantry.create(1))
      .set(vec(6, 1), Infantry.create(1)),
  });
  expect(
    format(
      determineUnitsToCreate(
        currentMap,
        player1,
        getPlayerUnits(currentMap),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
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
    ]
  `);
});

test('`determineUnitsToCreate` does not build transporters all the time later in the game', () => {
  // Does not build transporters in the first round.
  const map1 = map.copy({
    round: 1,
    units: map.units
      .set(vec(1, 1), Infantry.create(1))
      .set(vec(2, 1), Infantry.create(1))
      .set(vec(3, 1), Infantry.create(1)),
  });
  const map2 = map.copy({
    round: 7,
    units: map.units
      .set(vec(1, 1), Infantry.create(1))
      .set(vec(2, 1), Infantry.create(1))
      .set(vec(3, 1), Infantry.create(1)),
  });
  const map3 = map.copy({
    round: 10,
    units: map.units
      .set(vec(1, 1), Infantry.create(1))
      .set(vec(2, 1), Infantry.create(1))
      .set(vec(3, 1), Infantry.create(1)),
  });
  const map4 = map.copy({
    round: 13,
    units: map.units
      .set(vec(1, 1), Infantry.create(1))
      .set(vec(2, 1), Infantry.create(1))
      .set(vec(3, 1), Infantry.create(1)),
  });

  expect(
    format(
      determineUnitsToCreate(
        map1,
        player1,
        getPlayerUnits(map1),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
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
    ]
  `);

  expect(
    format(
      determineUnitsToCreate(
        map2,
        player1,
        getPlayerUnits(map2),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
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
    ]
  `);

  expect(
    format(
      determineUnitsToCreate(
        map3,
        player1,
        getPlayerUnits(map3),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
      "Jeep",
      "Transport Train",
    ]
  `);

  expect(
    format(
      determineUnitsToCreate(
        map4,
        player1,
        getPlayerUnits(map4),
        factoryUnits,
        options,
      ),
    ),
  ).toMatchInlineSnapshot(`
    [
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
    ]
  `);
});
