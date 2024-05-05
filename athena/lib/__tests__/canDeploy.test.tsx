import { expect, test } from 'vitest';
import { Barracks } from '../../info/Building.tsx';
import { Skill } from '../../info/Skill.tsx';
import { Sea } from '../../info/Tile.tsx';
import { Infantry, Jeep, Pioneer } from '../../info/Unit.tsx';
import vec from '../../map/vec.tsx';
import MapData from '../../MapData.tsx';
import canDeploy from '../canDeploy.tsx';
import getDeployableVectors from '../getDeployableVectors.tsx';
import updatePlayer from '../updatePlayer.tsx';
import withModifiers from '../withModifiers.tsx';

const initialMap = withModifiers(
  MapData.createMap({
    map: Array(15 * 15).fill(1),
    size: { height: 15, width: 15 },
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

test('`canDeploy` ensures that units can only be created on valid fields', () => {
  const vecA = vec(3, 3);
  const [vecB, vecC, vecD, vecE] = vecA.adjacent();
  const tileMap = initialMap.map.slice();
  tileMap[initialMap.getTileIndex(vecD)] = Sea.id;
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecA, Barracks.create(1)),
    map: tileMap,
    units: initialMap.units
      .set(vecB, Pioneer.create(1))
      .set(vecC, Jeep.create(1)),
  });

  expect(canDeploy(map, Infantry, vecA, false)).toBeTruthy();
  expect(canDeploy(map, Infantry, vecB, false)).toBeFalsy();
  expect(canDeploy(map, Infantry, vecC, false)).toBeFalsy();
  expect(canDeploy(map, Infantry, vecD, false)).toBeFalsy();
  expect(canDeploy(map, Infantry, vecE, false)).toBeTruthy();
});

test('restricted units can be created by using a skill', () => {
  const vecA = vec(3, 3);
  const map = initialMap.copy({
    buildings: initialMap.buildings.set(vecA, Barracks.create(1)),
    config: initialMap.config.copy({
      blocklistedUnits: new Set([Infantry.id]),
    }),
  });

  expect(getDeployableVectors(map, Infantry, vecA, 1).length).toEqual(0);

  expect(
    getDeployableVectors(
      map.copy({
        teams: updatePlayer(
          initialMap.teams,
          initialMap.getPlayer(1).copy({
            skills: new Set([Skill.NoUnitRestrictions]),
          }),
        ),
      }),
      Infantry,
      vecA,
      1,
    ).length,
  ).toEqual(5);
});
