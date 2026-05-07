import { expect, test } from 'vitest';
import { ResearchLab } from '../info/Building.tsx';
import { Skill } from '../info/Skill.tsx';
import { Crystal } from '../invasions/Crystal.tsx';
import { AIBehavior } from '../map/AIBehavior.tsx';
import { resolveDynamicPlayerID } from '../map/Player.tsx';
import MapData from '../MapData.tsx';

test('players can clear nullable copy fields', () => {
  const map = MapData.createMap({
    teams: [
      {
        id: 1,
        name: '',
        players: [{ ai: 1, crystal: Crystal.Command, funds: 0, id: 1, time: 10, userId: '1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ ai: 1, funds: 0, id: 2, name: 'AI' }],
      },
    ],
  });

  const player = map.getPlayer(1);
  expect(player.isHumanPlayer()).toBe(true);
  if (!player.isHumanPlayer()) {
    throw new Error('Expected player 1 to be human.');
  }

  expect(player.copy({ ai: null }).ai).toBeUndefined();
  expect(player.copy({ crystal: null }).crystal).toBeNull();
  expect(player.setTime(undefined).time).toBeNull();

  expect(map.getPlayer(2).copy({ ai: null }).ai).toBeUndefined();
});

test('buildings can clear nullable copy fields', () => {
  const building = ResearchLab.create(1, {
    behaviors: new Set([AIBehavior.Stay]),
  }).withSkills(new Set([Skill.Charge]));

  expect(building.matchesBehavior(AIBehavior.Stay)).toBe(true);
  expect(building.skills?.has(Skill.Charge)).toBe(true);

  const cleared = building.copy({ behaviors: null, skills: null });

  expect(cleared.matchesBehavior(AIBehavior.Stay)).toBe(false);
  expect(cleared.skills).toBeNull();
});

test('`resolveDynamicPlayerID` resolves to the correct players', () => {
  const map = MapData.createMap({
    map: Array(3 * 3).fill(1),
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
  });

  expect(resolveDynamicPlayerID(map, 'self')).toBe(1);
  expect(resolveDynamicPlayerID(map, 'team')).toBe(1);
  expect(resolveDynamicPlayerID(map, 'opponent')).toBe(2);
});

test('`resolveDynamicPlayerID` always prefers human players', () => {
  const map = MapData.createMap({
    currentPlayer: 2,
    map: Array(3 * 3).fill(1),
    size: { height: 3, width: 3 },
    teams: [
      {
        id: 1,
        name: '',
        players: [
          { funds: 0, id: 1, name: 'AI-1' },
          { funds: 0, id: 3, userId: '1' },
        ],
      },
      {
        id: 2,
        name: '',
        players: [
          { funds: 0, id: 2, name: 'AI-2' },
          { funds: 0, id: 4, name: 'AI-3' },
          { funds: 0, id: 5, userId: '3' },
        ],
      },
    ],
  });

  expect(resolveDynamicPlayerID(map, 'self')).toBe(2);
  expect(resolveDynamicPlayerID(map, 'team')).toBe(5);
  expect(resolveDynamicPlayerID(map, 'opponent')).toBe(3);
});
