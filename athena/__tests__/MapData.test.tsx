import { expect, test } from 'vitest';
import map from '../../hermes/map-fixtures/they-are-close-to-home.tsx';
import { Pioneer } from '../info/Unit.tsx';
import canDeploy from '../lib/canDeploy.tsx';
import updatePlayer from '../lib/updatePlayer.tsx';
import BitSet from '../map/BitSet.tsx';
import { Fog } from '../map/PlainMap.tsx';
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

test('serializing exploration fog state', () => {
  const exploredMap = map.copy({
    config: map.config.copy({ fog: Fog.Exploration }),
    teams: updatePlayer(map.teams, player1.copy({ seen: new BitSet().add(0).add(32) })),
  });
  const json = JSON.stringify(exploredMap);
  const newMap = MapData.fromJSON(json);

  expect(JSON.parse(json).config.fog).toBe(Fog.Exploration);
  expect(JSON.parse(json).teams[0].players[0].seen).toEqual([1, 1]);
  expect(newMap.config.fog).toBe(Fog.Exploration);
  expect(newMap.getPlayer(1).seen.has(0)).toBe(true);
  expect(newMap.getPlayer(1).seen.has(32)).toBe(true);
});

test('deserializing legacy boolean fog values', () => {
  const legacyMap = map.toJSON();

  const fogMap = MapData.fromObject({ ...legacyMap, config: { ...legacyMap.config, fog: true } });
  const noFogMap = MapData.fromObject({
    ...legacyMap,
    config: { ...legacyMap.config, fog: false },
  });

  expect(fogMap.config.fog).toBe(Fog.Standard);
  expect(fogMap.toJSON().config.fog).toBe(Fog.Standard);
  expect(noFogMap.config.fog).toBe(Fog.None);
  expect(noFogMap.toJSON().config.fog).toBe(Fog.None);
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
