import { expect, test } from 'vitest';
import { toPlayerID } from '../../map/Player.tsx';
import { PlainTeams, toTeamArray } from '../../map/Team.tsx';
import MapData from '../../MapData.tsx';
import validateTeams from '../validateTeams.tsx';
import withModifiers from '../withModifiers.tsx';

const defaultTeams: PlainTeams = [
  { id: 1, name: '', players: [{ funds: 0, id: 1 }] },
  { id: 3, name: '', players: [{ funds: 0, id: 2 }] },
  { id: 3, name: '', players: [{ funds: 0, id: 3 }] },
  { id: 4, name: '', players: [{ funds: 0, id: 4 }] },
];

const getTeams = (teams?: PlainTeams): PlainTeams => {
  const seen = new Set(teams?.map(({ id }) => id));
  return [
    ...(teams || []),
    ...defaultTeams.filter(({ id }) => !seen.has(toPlayerID(id))),
  ];
};

test('validates teams', () => {
  let map = withModifiers(
    MapData.createMap({
      active: [1, 2, 3, 4],
      teams: getTeams([
        {
          id: 1,
          name: '',
          players: [
            { funds: 0, id: 1 },
            { funds: 0, id: 2 },
          ],
        },
        {
          id: 2,
          name: '',
          players: [
            { funds: 0, id: 2 },
            { funds: 0, id: 3 },
            { funds: 0, id: 4 },
          ],
        },
      ]),
    }),
  );

  expect(
    validateTeams(map, toTeamArray(map.teams))[0]?.teams.toArray(),
  ).toBeUndefined();

  map = withModifiers(
    MapData.createMap({
      active: [1, 2, 3, 4],
      teams: getTeams([
        {
          id: 2,
          name: '',
          players: [{ funds: 0, id: 2 }],
        },
      ]),
    }),
  );

  expect(validateTeams(map, toTeamArray(map.teams))[0]?.teams.toArray())
    .toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "id": 1,
            "name": "",
            "players": [
              {
                "ai": undefined,
                "funds": 0,
                "id": 1,
                "skills": [],
              },
            ],
          },
        ],
        [
          2,
          {
            "id": 2,
            "name": "",
            "players": [
              {
                "ai": undefined,
                "funds": 0,
                "id": 2,
                "skills": [],
              },
            ],
          },
        ],
        [
          3,
          {
            "id": 3,
            "name": "",
            "players": [
              {
                "ai": undefined,
                "funds": 0,
                "id": 3,
                "skills": [],
              },
            ],
          },
        ],
        [
          4,
          {
            "id": 4,
            "name": "",
            "players": [
              {
                "ai": undefined,
                "funds": 0,
                "id": 4,
                "skills": [],
              },
            ],
          },
        ],
      ]
    `);

  map = withModifiers(
    MapData.createMap({
      active: [1, 2],
      teams: [
        {
          id: 1,
          name: '',
          players: [{ funds: 0, id: 1 }],
        },
        {
          id: 2,
          name: '',
          players: [{ funds: 0, id: 2 }],
        },
      ],
    }),
  );

  expect(validateTeams(map, toTeamArray(map.teams))[0]?.teams.toArray())
    .toMatchInlineSnapshot(`
      [
        [
          1,
          {
            "id": 1,
            "name": "",
            "players": [
              {
                "ai": undefined,
                "funds": 0,
                "id": 1,
                "skills": [],
              },
            ],
          },
        ],
        [
          2,
          {
            "id": 2,
            "name": "",
            "players": [
              {
                "ai": undefined,
                "funds": 0,
                "id": 2,
                "skills": [],
              },
            ],
          },
        ],
      ]
    `);

  map = withModifiers(
    MapData.createMap({
      active: [1, 2],
      teams: [
        {
          id: 1,
          name: '',
          players: [
            { funds: 0, id: 1 },
            { funds: 0, id: 2 },
          ],
        },
      ],
    }),
  );

  expect(
    validateTeams(map, toTeamArray(map.teams))[0]?.teams.toArray(),
  ).toBeUndefined();
});
