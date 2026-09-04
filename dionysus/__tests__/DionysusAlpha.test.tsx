import {
  CompleteUnitAction,
  MessageAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import {
  executeAIAction,
  AIRegistryEntry,
  AIRegistryT,
} from '@deities/apollo/actions/executeGameAction.tsx';
import { House } from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { Infantry } from '@deities/athena/info/Unit.tsx';
import updatePlayer from '@deities/athena/lib/updatePlayer.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { expect, test } from 'vitest';
import snapshotGameState from '../../tests/snapshotGameState.tsx';
import BaseAI from '../BaseAI.tsx';
import DionysusAlpha from '../DionysusAlpha.tsx';

type PrivateDionysusAlphaAttack = {
  attack: (map: MapData) => MapData | null;
};

test('DionysusAlpha skips stale attack candidates when another unit occupies the planned move tile', () => {
  const baseMap = MapData.createMap({
    map: Array(5 * 3).fill(Plain.id),
    size: { height: 3, width: 5 },
    teams: [
      {
        id: 1,
        name: '',
        players: [{ funds: 0, id: 1, userId: 'User-1' }],
      },
      {
        id: 2,
        name: '',
        players: [{ ai: 0, funds: 0, id: 2, name: 'DionysusAlpha' }],
      },
    ],
  });
  const map = withModifiers(
    baseMap.copy({
      currentPlayer: 2,
      units: baseMap.units
        .set(vec(1, 1), Infantry.create(2))
        .set(vec(5, 1), Infantry.create(2))
        .set(vec(2, 2), Infantry.create(1))
        .set(vec(4, 2), Infantry.create(1)),
    }),
  );
  const ai = new DionysusAlpha(new Map());
  const attack = (ai as unknown as PrivateDionysusAlphaAttack).attack.bind(ai);

  expect(attack(map)).not.toBe(null);

  expect(snapshotGameState(ai.retrieveGameState())).toMatchInlineSnapshot(`
    "Move (5,1 → 3,2) { fuel: 47, completed: null, path: [4,1 → 3,1 → 3,2], movementExhausted: null }
    AttackUnit (3,2 → 2,2) { hasCounterAttack: true, playerA: 2, playerB: 1, unitA: DryUnit { health: 75 }, unitB: DryUnit { health: 44 }, chargeA: 86, chargeB: 112 }
    Move (1,1 → 2,1) { fuel: 49, completed: null, path: [2,1], movementExhausted: null }
    AttackUnit (2,1 → 2,2) { hasCounterAttack: false, playerA: 2, playerB: 1, unitA: DryUnit { health: 100 }, unitB: null, chargeA: 115, chargeB: 200 }"
  `);
});

const initialSkillMap = MapData.createMap({
  buildings: [[1, 1, House.create(1).toJSON()]],
  map: [Plain.id, Plain.id],
  size: { height: 1, width: 2 },
  teams: [
    { id: 1, name: '', players: [{ ai: 0, funds: 500, id: 1, name: 'AI' }] },
    { id: 2, name: '', players: [{ funds: 500, id: 2, userId: '2' }] },
  ],
  units: [[2, 1, Infantry.create(1).toJSON()]],
});

const skillMap = initialSkillMap.copy({
  teams: updatePlayer(
    initialSkillMap.teams,
    initialSkillMap.getPlayer(1).copy({ skills: new Set([Skill.SkipTurnGainFunds]) }),
  ),
});

class MessageOnlyAI extends BaseAI {
  private hasSentMessage = false;

  protected action(map: MapData): MapData | null {
    if (!this.hasSentMessage) {
      this.hasSentMessage = true;
      return this.execute(map, MessageAction('Hello!'));
    }
    return this.endTurn(map);
  }
}

class ActingAI extends BaseAI {
  private hasActed = false;

  protected action(map: MapData): MapData | null {
    if (!this.hasActed) {
      this.hasActed = true;
      return this.execute(map, CompleteUnitAction(vec(2, 1)));
    }
    return this.endTurn(map);
  }
}

const createAIRegistry = (AI: AIRegistryEntry['class']): AIRegistryT =>
  new Map([[0, { class: AI, description: 'Test', name: 'Test', published: true }]]);

test('AI message-only turns receive the skipped-turn bonus', () => {
  const [gameState] = executeAIAction(skillMap, createAIRegistry(MessageOnlyAI), new Map());
  const endTurn = gameState.findLast(([actionResponse]) => actionResponse.type === 'EndTurn')?.[0];

  expect(gameState.map(([actionResponse]) => actionResponse.type)).toEqual(['Message', 'EndTurn']);
  expect(endTurn).toMatchObject({
    current: { funds: 550, player: 1 },
    type: 'EndTurn',
  });
});

test('AI gameplay actions prevent the skipped-turn bonus', () => {
  const [gameState] = executeAIAction(skillMap, createAIRegistry(ActingAI), new Map());
  const endTurn = gameState.findLast(([actionResponse]) => actionResponse.type === 'EndTurn')?.[0];

  expect(gameState.map(([actionResponse]) => actionResponse.type)).toEqual([
    'CompleteUnit',
    'EndTurn',
  ]);
  expect(endTurn).toMatchObject({
    current: { funds: 500, player: 1 },
    type: 'EndTurn',
  });
});
