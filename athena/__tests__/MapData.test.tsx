import { expect, test } from 'vitest';
import map from '../../hermes/map-fixtures/they-are-close-to-home.tsx';
import { Pioneer } from '../info/Unit.tsx';
import canDeploy from '../lib/canDeploy.tsx';
import MapData from '../MapData.tsx';
import vec from './../map/vec.tsx';

const player1 = map.getPlayer(1);
const player2 = map.getPlayer(2);

test('serializing to JSON', () => {
  const json = JSON.stringify(map);
  const newMap = MapData.fromJSON(json);

  expect(JSON.parse(json)).toEqual(map.toJSON());
  expect(newMap).toEqual(map);
});

test('allow entity lookups through vectors', () => {
  const unit = map.units.get(vec(11, 5))!;

  expect(unit.id).toBe(4);
  expect(unit.health).toBe(100);
  expect(unit.player).toBe(2);
  expect(unit.fuel).toBe(40);
});

test('support for basic queries', () => {
  const unitA = map.units.get(vec(9, 6))!;
  const unitB = map.units.get(vec(11, 5))!;

  expect(map.contains(vec(-1, -1))).toBe(false);
  expect(map.contains(vec(5, 4))).toBe(true);
  expect(map.contains(vec(15, 10))).toBe(true);
  expect(map.contains(vec(25, 10))).toBe(false);
  expect(map.contains(vec(15, 11))).toBe(false);

  expect(canDeploy(map, Pioneer, vec(11, 5), false)).toBe(false);
  expect(canDeploy(map, Pioneer, vec(11, 7), false)).toBe(true);
  expect(canDeploy(map, Pioneer, vec(15, 17), false)).toBe(false);
  expect(canDeploy(map, Pioneer, vec(5, 1), false)).toBe(false);

  expect(map.matchesPlayer(1, 1)).toBe(true);
  expect(map.matchesPlayer(map.getPlayer(1), 1)).toBe(true);
  expect(map.matchesPlayer(unitB, 1)).toBe(false);

  expect(map.isOpponent(1, 1)).toBe(false);
  expect(map.isOpponent(unitB, 1)).toBe(true);

  expect(map.getNextPlayer()).toBe(player2);
  expect(map.isEndOfRound()).toBe(false);

  expect(map.getCurrentPlayer()).toBe(player1);

  expect(map.isCurrentPlayer(player1)).toBe(true);
  expect(map.isCurrentPlayer(player2)).toBe(false);
  expect(map.isCurrentPlayer(unitA)).toBe(true);
  expect(map.isCurrentPlayer(unitB)).toBe(false);

  expect(map.getTeam(1)).toBe(map.teams.get(1));
  expect(map.getTeam(player2)).toBe(map.teams.get(2));
});
