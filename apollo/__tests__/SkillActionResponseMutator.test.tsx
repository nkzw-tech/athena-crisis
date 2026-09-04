import { House } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import { EndTurnActionResponse } from '../ActionResponse.tsx';
import createSkillActionResponseMutator from '../lib/skillActionResponseMutator.tsx';
import timeoutActionResponseMutator from '../lib/timeoutActionResponseMutator.tsx';

const initialMap = MapData.createMap({
  buildings: [[1, 1, House.create(1).toJSON()]],
  map: [1, 1],
  size: { height: 1, width: 2 },
  teams: [
    { id: 1, name: '', players: [{ funds: 500, id: 1, userId: '1' }] },
    { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
  ],
});

const map = initialMap.copy({
  teams: updatePlayer(
    initialMap.teams,
    initialMap.getPlayer(1).copy({ skills: new Set([Skill.SkipTurnGainFunds]) }),
  ),
});

const endTurnActionResponse: EndTurnActionResponse = {
  current: { funds: 500, player: 1 },
  next: { funds: 500, player: 2 },
  round: 1,
  type: 'EndTurn',
};

test('SkipTurnGetFunds grants half of the current income when the player skips their turn', () => {
  expect(createSkillActionResponseMutator(false)(map, endTurnActionResponse)).toEqual({
    ...endTurnActionResponse,
    current: { funds: 550, player: 1 },
  });
});

test('SkipTurnGetFunds does not grant funds after the player has acted', () => {
  expect(createSkillActionResponseMutator(true)(map, endTurnActionResponse)).toBe(
    endTurnActionResponse,
  );
});

test('SkipTurnGetFunds does not exceed the maximum safe fund amount', () => {
  const maximumFundsMap = map.copy({
    teams: updatePlayer(map.teams, map.getPlayer(1).copy({ funds: Number.MAX_SAFE_INTEGER })),
  });
  const maximumFundsEndTurnActionResponse: EndTurnActionResponse = {
    ...endTurnActionResponse,
    current: { funds: Number.MAX_SAFE_INTEGER, player: 1 },
  };

  expect(
    createSkillActionResponseMutator(false)(maximumFundsMap, maximumFundsEndTurnActionResponse),
  ).toEqual(maximumFundsEndTurnActionResponse);
});

test('SkipTurnGetFunds does not grant funds when a turn times out', () => {
  expect(
    createSkillActionResponseMutator(false, timeoutActionResponseMutator)(
      map,
      endTurnActionResponse,
    ),
  ).toEqual({ ...endTurnActionResponse, miss: true });
});

test('message-only turns still count as skipped turns', () => {
  const mutateAction = createSkillActionResponseMutator(false);

  mutateAction(map, { message: 'Hello!', type: 'Message' });

  expect(mutateAction(map, endTurnActionResponse)).toEqual({
    ...endTurnActionResponse,
    current: { funds: 550, player: 1 },
  });
});

test('messages do not hide an earlier gameplay action', () => {
  const mutateAction = createSkillActionResponseMutator(false);

  mutateAction(map, { from: vec(1, 1), type: 'CompleteBuilding' });
  mutateAction(map, { message: 'Hello!', type: 'Message' });

  expect(mutateAction(map, endTurnActionResponse)).toBe(endTurnActionResponse);
});

test('player changes reset action tracking after automatic turn endings', () => {
  const mutateAction = createSkillActionResponseMutator(false);
  const nextMap = map.copy({
    buildings: map.buildings.set(vec(1, 1), House.create(2)),
    currentPlayer: 2,
    teams: updatePlayer(
      map.teams,
      map.getPlayer(2).copy({ skills: new Set([Skill.SkipTurnGainFunds]) }),
    ),
  });
  const nextEndTurnActionResponse: EndTurnActionResponse = {
    current: { funds: 500, player: 2 },
    next: { funds: 500, player: 1 },
    round: 2,
    type: 'EndTurn',
  };

  mutateAction(map, { from: vec(1, 1), type: 'CompleteBuilding' });

  expect(mutateAction(nextMap, nextEndTurnActionResponse)).toEqual({
    ...nextEndTurnActionResponse,
    current: { funds: 550, player: 2 },
  });
});

test('timeout mutation only applies to the timed-out player', () => {
  const mutateAction = createSkillActionResponseMutator(false, timeoutActionResponseMutator);

  expect(mutateAction(map, endTurnActionResponse)).toEqual({
    ...endTurnActionResponse,
    miss: true,
  });
  expect(mutateAction(map, endTurnActionResponse)).toEqual({
    ...endTurnActionResponse,
    current: { funds: 550, player: 1 },
  });
});
