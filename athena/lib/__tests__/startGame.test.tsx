import { expect, test } from 'vitest';
import { Barracks, House, HQ } from '../../info/Building.tsx';
import { Flamethrower, Hovercraft, Jeep, SmallTank } from '../../info/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import startGame from '../startGame.tsx';
import withModifiers from '../withModifiers.tsx';

test('`startGame` calculates the correct funds for all players', () => {
  const map = withModifiers(
    MapData.createMap({
      buildings: [
        [1, 1, HQ.create(1).toJSON()],
        [5, 5, HQ.create(2).toJSON()],
        [1, 2, House.create(1).toJSON()],
        [1, 3, House.create(1).toJSON()],
        [1, 4, House.create(2).toJSON()],
        [1, 5, House.create(2).toJSON()],
        [2, 1, Barracks.create(1).toJSON()],
      ],
      config: {
        seedCapital: 10_000,
      },
      map: [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1,
      ],
      size: { height: 5, width: 5 },
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 0, id: 1, userId: '1' }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 0, id: 2, name: 'AI' }],
        },
      ],
    }),
  );

  expect(
    startGame(map)
      .getPlayers()
      .map(({ funds }) => funds),
  ).toMatchInlineSnapshot(`
    [
      10200,
      10000,
    ]
  `);
});

test('`startGame` resets fuel or ammo that is beyond the maximum', () => {
  const flamethrowerFuel = Math.floor(Flamethrower.configuration.fuel / 2);
  const tank = SmallTank.create(2);
  const map = startGame(
    withModifiers(
      MapData.createMap({
        map: [1, 1, 1, 1, 1, 1, 1, 1, 1],
        size: { height: 3, width: 3 },
        teams: [
          {
            id: 1,
            name: '',
            players: [{ funds: 0, id: 1, userId: '1' }],
          },
          {
            id: 2,
            name: '',
            players: [{ funds: 0, id: 2, name: 'AI' }],
          },
        ],
        units: [
          [1, 1, Jeep.create(1).copy({ fuel: 3000 }).toJSON()],
          [1, 2, Flamethrower.create(1).setFuel(0).toJSON()],
          [
            1,
            3,
            Hovercraft.create(1)
              .load(
                Jeep.create(1)
                  .copy({ fuel: 3000 })
                  .load(Flamethrower.create(1).copy({ fuel: 1000 }).transport())
                  .transport(),
              )
              .toJSON(),
          ],
          [2, 2, Flamethrower.create(2).setFuel(flamethrowerFuel).toJSON()],
          [3, 1, tank.subtractAmmo(tank.getAttackWeapon(tank)!, 2).toJSON()],
          [
            3,
            3,
            SmallTank.create(2)
              .setAmmo(new Map([[1, 1000]]))
              .toJSON(),
          ],
        ],
      }),
    ),
  );
  expect(map.units.get(vec(1, 1))!.fuel).toEqual(Jeep.configuration.fuel);
  expect(map.units.get(vec(1, 2))!.fuel).toEqual(0);
  expect(map.units.get(vec(2, 2))!.fuel).toEqual(flamethrowerFuel);
  expect(map.units.get(vec(3, 1))!.ammo).toMatchInlineSnapshot(`
    Map {
      1 => 5,
    }
  `);
  expect(map.units.get(vec(3, 3))!.ammo).toMatchInlineSnapshot(`
    Map {
      1 => 7,
    }
  `);

  const hovercraft = map.units.get(vec(1, 3))!;
  const jeep = hovercraft.getTransportedUnit(0)!.deploy();
  const flamethrower = jeep.getTransportedUnit(0)!.deploy();

  expect(jeep.id).toEqual(Jeep.id);
  expect(jeep.fuel).toEqual(Jeep.configuration.fuel);

  expect(flamethrower.id).toEqual(Flamethrower.id);
  expect(flamethrower.fuel).toEqual(Flamethrower.configuration.fuel);
});
