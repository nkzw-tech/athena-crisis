import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import getActionResponseVectors from '@deities/apollo/lib/getActionResponseVectors.tsx';
import getMatchingTeam from '@deities/apollo/lib/getMatchingTeam.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import {
  GameActionResponse,
  GameActionResponses,
} from '@deities/apollo/Types.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import refillUnits from '@deities/athena/lib/refillUnits.tsx';
import {
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import { sortByVectorKey } from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { moveable, RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import dateNow from '@deities/hephaestus/dateNow.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import arrayShuffle from 'array-shuffle';
import { fbt } from 'fbt';
import animateFireworks, {
  getPossibleFireworksPositions,
} from '../animations/animateFireworks.tsx';
import objectiveAnimation from '../animations/objectiveAnimation.tsx';
import activatePowerAction from '../behavior/activatePower/activatePowerAction.tsx';
import clientAttackAction from '../behavior/attack/clientAttackAction.tsx';
import {
  hiddenSourceAttackAction,
  hiddenTargetAttackAction,
} from '../behavior/attack/hiddenAttackActions.tsx';
import buySkillAction from '../behavior/buySkill/buySkillAction.tsx';
import captureAction from '../behavior/capture/captureAction.tsx';
import { addCreateBuildingAnimation } from '../behavior/createBuilding/createBuildingAction.tsx';
import createTracksAction from '../behavior/createTracks/createTracksAction.tsx';
import createUnitAction from '../behavior/createUnit/createUnitAction.tsx';
import dropUnitAction from '../behavior/drop/dropUnitAction.tsx';
import healAction, { addHealAnimation } from '../behavior/heal/healAction.tsx';
import clientMoveAction from '../behavior/move/clientMoveAction.tsx';
import hiddenMoveAction from '../behavior/move/hiddenMoveAction.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { toggleLightningAnimation } from '../behavior/radar/toggleLightningAction.tsx';
import receivePortraitAnimation from '../behavior/receivePortrait/receivePortraitAnimation.tsx';
import rescueAction from '../behavior/rescue/rescueAction.tsx';
import sabotageAction, {
  addSabotageAnimation,
} from '../behavior/sabotage/sabotageAction.tsx';
import unfoldAction from '../behavior/unfold/unfoldAction.tsx';
import getCampaignMessage from '../i18n/getCampaignMessage.tsx';
import intlList, { Conjunctions, Delimiters } from '../i18n/intlList.tsx';
import addEndTurnAnimations from '../lib/addEndTurnAnimations.tsx';
import addPlayerLoseAnimation from '../lib/addPlayerLoseAnimation.tsx';
import animateSupply from '../lib/animateSupply.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getPlayerDefeatedMessage from '../lib/getPlayerDefeatedMessage.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import isFakeEndTurn from '../lib/isFakeEndTurn.tsx';
import isSkillRewardActionResponse from '../lib/isSkillRewardActionResponse.tsx';
import sleep from '../lib/sleep.tsx';
import spawn from '../lib/spawn.tsx';
import startGameAnimation from '../lib/startGameAnimation.tsx';
import { RadiusType } from '../Radius.tsx';
import {
  Actions,
  AnimationConfigs,
  PlayerHasRewardFunction,
  State,
} from '../Types.tsx';
import ActionResponseError from './ActionResponseError.tsx';

const applyRemoteActionResponse = <T extends ActionResponse>(
  map: MapData,
  vision: VisionT,
  actionResponse: T,
): [Promise<GameActionResponse>, MapData, T] => [
  Promise.resolve({ self: { actionResponse } }),
  applyActionResponse(map, vision, actionResponse),
  actionResponse,
];

async function processActionResponse(
  state: State,
  actions: Actions,
  actionResponse: ActionResponse,
  messageState: {
    count: number;
    lastPlayerId: PlayerID | null;
    lastUnitId: number | null;
  },
  playerHasReward: PlayerHasRewardFunction,
): Promise<State | null> {
  const { factionNames, map, vision } = state;
  const { requestFrame, scrollIntoView, update } = actions;
  const { type } = actionResponse;
  let newState: State;
  let resolve: (state: State | null) => void;
  const promise = new Promise<State | null>((_resolve) => {
    resolve = (state) => requestFrame(() => _resolve(state));
  });
  const resolveWithNull = (state: State) => {
    resolve(state);
    return null;
  };

  await scrollIntoView(getActionResponseVectors(map, actionResponse));

  const remoteActionResponse = applyRemoteActionResponse(
    map,
    vision,
    actionResponse,
  );
  const [remoteAction, newMap] = remoteActionResponse;

  switch (type) {
    case 'Move': {
      const { from, path, to } = actionResponse;
      const unit = map.units.get(from);
      if (!unit) {
        throw new ActionResponseError(
          `${type}: Could not find unit.`,
          actionResponse,
          map,
        );
      }

      await update((state) =>
        clientMoveAction(
          actions,
          remoteAction,
          newMap,
          from,
          to,
          path,
          moveable(map, unit, from),
          state,
          (state) => {
            const unit = state.map.units.get(to);
            const newState = {
              selectedPosition: to,
              selectedUnit: unit || null,
            };
            requestFrame(() =>
              resolve({
                ...state,
                ...newState,
              }),
            );
            return newState;
          },
          from,
          map.units.get(to) ? true : undefined,
        ),
      );
      break;
    }
    case 'AttackUnit':
    case 'AttackBuilding': {
      const { from, to, type } = actionResponse;
      const unitA = map.units.get(from);
      const entityB =
        type === 'AttackUnit' ? map.units.get(to) : map.buildings.get(to);

      if (!unitA || !entityB) {
        throw new ActionResponseError(
          `${type}: Could not find ${unitA ? 'entityB' : 'unitA'}`,
          actionResponse,
          map,
        );
      }
      return clientAttackAction(
        actions,
        ...remoteActionResponse,
        from,
        unitA,
        to,
        entityB,
        state,
      );
    }
    case 'Capture':
      return captureAction(
        actions,
        ...remoteActionResponse,
        actionResponse.from,
      );
    case 'Supply': {
      const { from, player } = actionResponse;
      const unit = map.units.get(from);
      const unitsToRefill = getUnitsToRefill(
        map,
        vision,
        map.getPlayer(player),
        from,
      );
      await update((state) =>
        animateSupply(state, sortByVectorKey(unitsToRefill), (state) => {
          resolve({
            ...state,
            // If the unit is missing, it means the supply action originates from
            // a hidden field.
            map: unit ? newMap : refillUnits(state.map, unitsToRefill),
          });
          return null;
        }),
      );
      break;
    }
    case 'CreateUnit':
      return createUnitAction(actions, actionResponse);
    case 'DropUnit':
      await update((state) =>
        dropUnitAction(newMap, actionResponse, state, resolveWithNull),
      );
      break;
    case 'CreateBuilding':
      await update((state) =>
        addCreateBuildingAnimation(actionResponse, state, resolveWithNull),
      );
      break;
    case 'CreateTracks':
      return createTracksAction(actions, actionResponse);
    case 'Fold':
    case 'Unfold':
      return unfoldAction(
        actions,
        actionResponse,
        actionResponse.from,
        type === 'Unfold' ? 'unfold' : 'fold',
        state,
      );
    case 'CompleteUnit':
      newState = await update({
        map: newMap,
      });
      requestFrame(() => resolve({ ...state, ...newState }));
      break;
    case 'CompleteBuilding':
      newState = await update({
        map: newMap,
      });
      requestFrame(() => resolve({ ...state, ...newState }));
      break;
    case 'EndTurn':
      if (!isFakeEndTurn(actionResponse)) {
        // Update the current player immediately so that the funds will be animated.
        state = await update({
          map: map.copy({
            currentPlayer: actionResponse.next.player,
          }),
        });
      }

      await update((state) => ({
        ...addEndTurnAnimations(
          actions,
          actionResponse,
          state,
          actionResponse.supply || null,
          (state) => {
            // All updates are handled elsewhere in this case.
            requestFrame(() => resolve(null));
            return {
              ...state,
              map: isFakeEndTurn(actionResponse) ? state.map : newMap,
            };
          },
        ),
      }));
      break;
    case 'CharacterMessage': {
      const { player: dynamicPlayer, unitId, variant } = actionResponse;
      const player = resolveDynamicPlayerID(map, dynamicPlayer);
      if (
        player !== messageState.lastPlayerId ||
        unitId !== messageState.lastUnitId
      ) {
        messageState.count += 1;
      }
      messageState.lastPlayerId = player;
      messageState.lastUnitId = unitId;

      const position = map.units.findKey(
        (unit) =>
          unit.id === unitId &&
          (player === 0 || unit.isLeader()) &&
          map.matchesPlayer(unit, player),
      );

      await update((state) => ({
        animations: state.animations.set(new AnimationKey(), {
          factionNames,
          map,
          onComplete: (state) => {
            resolve({ ...state, namedPositions: null, radius: null });
            return null;
          },
          player,
          position: messageState.count % 2 ? 'top' : 'bottom',
          text: getCampaignMessage(actionResponse),
          type: 'characterMessage',
          unitId,
          variant,
          viewer: state.currentViewer || undefined,
        }),
        namedPositions: position ? [position] : null,
        radius: position
          ? {
              fields: new Map([[position, RadiusItem(position)]]),
              focus: 'unit',
              path: null,
              type: RadiusType.Highlight,
            }
          : null,
      }));
      break;
    }
    case 'Message': {
      const playerID = actionResponse.player ?? map.getCurrentPlayer().id;
      messageState.lastPlayerId = null;
      messageState.lastUnitId = null;
      messageState.count += 1;
      await update((state) => ({
        animations: state.animations.set(new AnimationKey(), {
          color: playerID,
          onComplete: (state) => {
            resolve(state);
            return null;
          },
          position: messageState.count % 2 ? 'top' : 'bottom',
          text: actionResponse.message,
          type: 'message',
        }),
      }));
      break;
    }
    case 'MoveUnit': {
      requestFrame(() =>
        resolve({
          ...state,
          map: newMap,
        }),
      );
      break;
    }
    case 'ToggleLightning': {
      newState = await update(
        await toggleLightningAnimation(
          actions,
          actionResponse.to,
          state,
          newMap,
        ),
      );
      requestFrame(() => resolve({ ...state, ...newState, map: newMap }));
      break;
    }
    case 'Rescue':
      return rescueAction(actions, ...remoteActionResponse);
    case 'Sabotage': {
      await update((state) =>
        actionResponse.from
          ? sabotageAction(actionResponse, state, resolveWithNull)
          : addSabotageAnimation(
              newMap,
              actionResponse.to,
              state,
              resolveWithNull,
            ),
      );
      break;
    }
    case 'Spawn': {
      await update((state) =>
        spawn(
          actions,
          state,
          actionResponse.units.toArray(),
          actionResponse.teams,
          actionResponse.units.size >= 5 ? 'fast' : 'slow',
          (state) => {
            requestFrame(() =>
              resolve({
                ...state,
                map: newMap,
              }),
            );
            return null;
          },
        ),
      );
      break;
    }
    case 'Heal':
      await update((state) =>
        actionResponse.from
          ? healAction(actionResponse, state, resolveWithNull)
          : addHealAnimation(
              newMap,
              null,
              actionResponse.to,
              state,
              resolveWithNull,
            ),
      );
      break;
    case 'HiddenFundAdjustment':
      requestFrame(() =>
        resolve({
          ...state,
          map: newMap,
        }),
      );
      break;
    case 'HiddenMove':
      await update((state) =>
        hiddenMoveAction(actions, state, actionResponse, vision, () => {
          requestFrame(() => resolve(null));
          return null;
        }),
      );
      break;
    case 'HiddenSourceAttackBuilding':
    case 'HiddenSourceAttackUnit':
    case 'HiddenDestroyedBuilding':
      return hiddenSourceAttackAction(actions, state, actionResponse);
    case 'HiddenTargetAttackBuilding':
    case 'HiddenTargetAttackUnit':
      return hiddenTargetAttackAction(actions, state, actionResponse);
    case 'AttackUnitGameOver':
    case 'PreviousTurnGameOver':
      await update((state) => ({
        animations: state.animations.set(new AnimationKey(), {
          color: actionResponse.fromPlayer,
          length: 'short',
          onComplete: (state) => {
            resolve({
              ...state,
              map: newMap,
            });
            return null;
          },
          player: actionResponse.fromPlayer,
          sound: null,
          text: getPlayerDefeatedMessage(
            factionNames,
            actionResponse.fromPlayer,
          ),
          type: 'banner',
        }),
      }));
      break;
    case 'BeginTurnGameOver': {
      requestFrame(() =>
        resolve({
          ...state,
          map: newMap,
        }),
      );
      break;
    }
    case 'CaptureGameOver': {
      await update((state) =>
        addPlayerLoseAnimation(
          actions,
          actionResponse,
          state,
          map.getPlayer(actionResponse.fromPlayer),
          (state) => {
            resolve({
              ...state,
              map: newMap,
            });
            return null;
          },
        ),
      );
      break;
    }
    case 'GameEnd': {
      const { toPlayer } = actionResponse;
      const team = getMatchingTeam(map, actionResponse);
      if (!toPlayer || !team) {
        await update((currentState) => ({
          ...state,
          animations: currentState.animations.set(new AnimationKey(), {
            length: 'short',
            player: 0,
            sound: null,
            text: String(fbt(`The game ended in a draw!`, 'Draw')),
            type: 'banner',
          }),
        }));
        break;
      }

      const winners = [...team.players.map(({ id }) => id).values()];
      const winnerList = intlList(
        winners.map(getTranslatedFactionName.bind(null, factionNames)),
        Conjunctions.AND,
        Delimiters.COMMA,
      );
      const fireworks =
        state.currentViewer && winners.includes(state.currentViewer) ? 7 : 3;
      await update((currentState) => ({
        ...state,
        animations: currentState.animations.set(new AnimationKey(), {
          color: winners,
          length: 'short',
          onComplete: (state) =>
            animateFireworks(
              state,
              arrayShuffle([
                ...getPossibleFireworksPositions(map, toPlayer),
              ]).slice(0, fireworks),
              (state) => {
                resolve({
                  ...state,
                  map: newMap,
                });
                return null;
              },
            ),
          player: winners[0],
          sound: null,
          text: String(
            fbt(
              fbt.param('winners', winnerList) +
                ' ' +
                fbt.plural('wins', winners.length, {
                  many: 'win',
                  showCount: 'no',
                }) +
                '!',
              'Player wins message',
            ),
          ),
          type: 'banner',
        }),
      }));
      break;
    }
    case 'BeginGame': {
      const { funds, id: player } = map.getCurrentPlayer();
      await update((state) => ({
        ...addEndTurnAnimations(
          actions,
          {
            current: { funds, player },
            next: { funds, player },
            round: 1,
            type: 'EndTurn',
          },
          state,
          null,
          resolveWithNull,
        ),
      }));
      break;
    }
    case 'Start': {
      const { animations, mapName } = state;
      return mapName
        ? await startGameAnimation(actions, animations, mapName)
        : state;
    }
    case 'SetViewer':
      return { ...state, map: newMap };
    case 'BuySkill':
      return buySkillAction(actions, actionResponse);
    case 'ReceiveReward': {
      const { reward } = actionResponse;
      const rewardType = reward.type;
      switch (rewardType) {
        case 'Skill': {
          if (isSkillRewardActionResponse(actionResponse)) {
            if (map.getPlayer(actionResponse.player).skills.has(reward.skill)) {
              break;
            }

            return buySkillAction(actions, actionResponse);
          }

          throw new UnknownTypeError(
            'processActionResponse:ReceiveReward',
            `${actionResponse.type} - ${rewardType}`,
          );
        }
        case 'UnitPortraits': {
          const player = map.getPlayer(actionResponse.player);
          if (
            player.isHumanPlayer() &&
            !playerHasReward(map, actionResponse.player, actionResponse)
          ) {
            return receivePortraitAnimation(actions, state, actionResponse);
          }
          break;
        }
        default: {
          rewardType satisfies never;
          throw new UnknownTypeError(
            'processActionResponse:ReceiveReward',
            rewardType,
          );
        }
      }

      requestFrame(() =>
        resolve({
          ...state,
          map: newMap,
        }),
      );
      break;
    }
    case 'ActivatePower':
      return activatePowerAction(actions, state, actionResponse);
    case 'OptionalObjective':
    case 'SecretDiscovered':
      return objectiveAnimation(newMap, actions, state, actionResponse);
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('processActionResponse', type);
    }
  }

  return promise;
}

export default async function processActionResponses(
  state: State,
  actions: Actions,
  gameActionResponses: GameActionResponses,
  animationConfigs: AnimationConfigs,
  fastButtonIsPressed: { current: boolean },
  playerHasReward: PlayerHasRewardFunction,
): Promise<State> {
  let lastActionResponse: ActionResponse | null = null;
  const messageState = { count: 0, lastPlayerId: null, lastUnitId: null };
  const responses = gameActionResponses.slice();
  while (responses.length) {
    const response = responses.shift();
    if (response) {
      if (lastActionResponse) {
        await sleep(
          actions.scheduleTimer,
          state.animationConfig,
          'to' in lastActionResponse &&
            'from' in response.actionResponse &&
            lastActionResponse.to &&
            response.actionResponse.from &&
            lastActionResponse.to.equals(response.actionResponse.from)
            ? 'short'
            : 'long',
        );
      }

      lastActionResponse = response.actionResponse;
      const newState = {
        ...(await processActionResponse(
          state,
          actions,
          response.actionResponse,
          messageState,
          playerHasReward,
        )),
        behavior: new NullBehavior(),
        lastActionResponse,
        lastActionTime:
          lastActionResponse.type === 'EndTurn' &&
          isFakeEndTurn(lastActionResponse)
            ? undefined
            : dateNow(),
        radius: null,
      };
      const nextResponse = responses[0]?.actionResponse;
      const isLive =
        state.currentViewer !==
        (newState.map || state.map).getCurrentPlayer().id;

      state = await actions.update({
        ...newState,
        replayState: {
          ...state.replayState,
          isLive,
          isReplaying: isLive,
        },
        ...(newState.map
          ? { map: updateVisibleEntities(newState.map, state.vision, response) }
          : null),
        ...(nextResponse?.type === 'EndTurn'
          ? {
              animationConfig: fastButtonIsPressed.current
                ? newState.animationConfig || state.animationConfig
                : animationConfigs[
                    (newState.map || state.map)
                      .getPlayer(nextResponse.next.player)
                      .isHumanPlayer()
                      ? 1
                      : 0
                  ],
              selectedPosition: null,
              selectedUnit: null,
            }
          : null),
      });
    }
  }
  return state;
}
