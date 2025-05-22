import type { ActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import dateNow from '@deities/apollo/lib/dateNow.tsx';
import getActionResponseVectors from '@deities/apollo/lib/getActionResponseVectors.tsx';
import getLosingPlayer from '@deities/apollo/lib/getLosingPlayer.tsx';
import getMatchingTeam from '@deities/apollo/lib/getMatchingTeam.tsx';
import updateVisibleEntities from '@deities/apollo/lib/updateVisibleEntities.tsx';
import {
  GameActionResponse,
  GameActionResponses,
} from '@deities/apollo/Types.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import canLoad from '@deities/athena/lib/canLoad.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import getWinningInvaders from '@deities/athena/lib/getWinningInvaders.tsx';
import refillUnits from '@deities/athena/lib/refillUnits.tsx';
import spawnBuildings from '@deities/athena/lib/spawnBuildings.tsx';
import {
  isHumanPlayer,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import { sortByVectorKey } from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { moveable, RadiusItem } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import ImmutableMap from '@nkzw/immutable-map';
import arrayShuffle from 'array-shuffle';
import { fbt } from 'fbtee';
import addIncreaseValueAnimation from '../animations/addIncreaseValueAnimation.tsx';
import animateFireworks, {
  getPossibleFireworksPositions,
} from '../animations/animateFireworks.tsx';
import maybeReceiveChaosStarsAnimation from '../animations/maybeReceiveChaosStarsAnimation.tsx';
import objectiveAnimation from '../animations/objectiveAnimation.tsx';
import receiveBiomeAnimation from '../animations/receiveBiomeAnimation.tsx';
import receiveCrystalAnimation from '../animations/receiveCrystalAnimation.tsx';
import receivePortraitAnimation from '../animations/receivePortraitAnimation.tsx';
import receiveSkillSlotAnimation from '../animations/receiveSkillSlotAnimation.tsx';
import activateCrystalAction from '../behavior/activateCrystal/activateCrystalAction.tsx';
import activatePowerAction from '../behavior/activatePower/activatePowerAction.tsx';
import clientActivatePowerAction from '../behavior/activatePower/clientActivatePowerAction.tsx';
import clientAttackAction from '../behavior/attack/clientAttackAction.tsx';
import {
  hiddenSourceAttackAction,
  hiddenTargetAttackAction,
} from '../behavior/attack/hiddenAttackActions.tsx';
import buySkillAction from '../behavior/buySkill/buySkillAction.tsx';
import captureAction from '../behavior/capture/captureAction.tsx';
import {
  addCreateBuildingAnimation,
  animateCreateBuilding,
} from '../behavior/createBuilding/createBuildingAction.tsx';
import createTracksAction from '../behavior/createTracks/createTracksAction.tsx';
import createUnitAction from '../behavior/createUnit/createUnitAction.tsx';
import dropUnitAction from '../behavior/drop/dropUnitAction.tsx';
import healAction, { addHealAnimation } from '../behavior/heal/healAction.tsx';
import clientMoveAction from '../behavior/move/clientMoveAction.tsx';
import hiddenMoveAction from '../behavior/move/hiddenMoveAction.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import { toggleLightningAnimation } from '../behavior/radar/toggleLightningAction.tsx';
import rescueAction from '../behavior/rescue/rescueAction.tsx';
import sabotageAction, {
  addSabotageAnimation,
} from '../behavior/sabotage/sabotageAction.tsx';
import unfoldAction from '../behavior/unfold/unfoldAction.tsx';
import translateMessage from '../i18n/translateMessage.tsx';
import abandonInvasion from '../lib/abandonInvasion.tsx';
import addEndTurnAnimations from '../lib/addEndTurnAnimations.tsx';
import addPlayerLoseAnimation from '../lib/addPlayerLoseAnimation.tsx';
import animateSupply from '../lib/animateSupply.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getCurrentAnimationConfig from '../lib/getCurrentAnimationConfig.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import isFakeEndTurn from '../lib/isFakeEndTurn.tsx';
import isSkillRewardActionResponse from '../lib/isSkillRewardActionResponse.tsx';
import sleep from '../lib/sleep.tsx';
import spawn from '../lib/spawn.tsx';
import startGameAnimation from '../lib/startGameAnimation.tsx';
import { RadiusType } from '../Radius.tsx';
import {
  Actions,
  AnimationSpeed,
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
  const { map, playerDetails, skipDialogue, vision } = state;
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

  if (type === 'CharacterMessage' && skipDialogue) {
    requestFrame(() => resolve(null));
    return null;
  }

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
      return createUnitAction(actions, ...remoteActionResponse);
    case 'DropUnit':
      await update((state) =>
        dropUnitAction(newMap, actionResponse, state, resolveWithNull),
      );
      break;
    case 'CreateBuilding':
      await update((state) =>
        addCreateBuildingAnimation(
          actions,
          state,
          ...remoteActionResponse,
          resolveWithNull,
        ),
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
          map,
          onComplete: (state) => {
            resolve({ ...state, namedPositions: null, radius: null });
            return null;
          },
          player,
          position: messageState.count % 2 ? 'top' : 'bottom',
          text: translateMessage(actionResponse),
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
      const { buildings, teams, units } = actionResponse;
      await update((state) =>
        spawn(
          actions,
          state,
          units.toArray(),
          teams,
          units.size >= 5 ? 'fast' : 'slow',
          'spawn',
          (state) => {
            requestFrame(async () => {
              state = await update(state);

              if (buildings) {
                for (const [from, building] of buildings) {
                  state = await update({
                    map: spawnBuildings(
                      state.map,
                      ImmutableMap([[from, building]]),
                    ).copy({
                      buildings: state.map.buildings,
                    }),
                  });
                  state = await animateCreateBuilding(actions, state, {
                    building,
                    free: true,
                    from,
                    type: 'CreateBuilding',
                  });
                }
              }

              resolve({
                ...state,
                map: newMap,
              });
            });

            return null;
          },
        ),
      );
      break;
    }
    case 'Swap': {
      const { source, sourceUnit, target, targetUnit } = actionResponse;

      const isBeingLoaded =
        targetUnit && canLoad(map, targetUnit, sourceUnit, target);
      const despawns = [[source, sourceUnit] as const];
      const spawns = !isBeingLoaded ? [[target, sourceUnit] as const] : null;

      if (targetUnit && !isBeingLoaded) {
        despawns.push([target, targetUnit]);
        spawns?.push([source, targetUnit]);
      }

      await update((state) =>
        spawn(actions, state, despawns, null, 'fast', 'despawn', (state) => {
          requestFrame(() => {
            if (spawns) {
              update(
                spawn(
                  actions,
                  state,
                  spawns,
                  null,
                  'fast',
                  'spawn',
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
            } else {
              resolve({
                ...state,
                map: newMap,
              });
            }
          });

          return null;
        }),
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
    case 'BeginTurnGameOver':
    case 'CaptureGameOver': {
      const abandoned =
        actionResponse.type === 'BeginTurnGameOver' &&
        !!actionResponse.abandoned;
      const losingPlayer = getLosingPlayer(map, actionResponse);
      if (losingPlayer) {
        await update((state) =>
          addPlayerLoseAnimation(
            actions,
            state,
            map.getPlayer(losingPlayer),
            abandoned,
            (state) => {
              resolve({
                ...state,
                map: newMap,
              });
              return null;
            },
          ),
        );
      } else {
        requestFrame(() =>
          resolve({
            ...state,
            map: newMap,
          }),
        );
      }
      break;
    }
    case 'GameEnd': {
      const { toPlayer } = actionResponse;
      const team = getMatchingTeam(map, actionResponse);
      if (!toPlayer || !team) {
        await update((currentState) => ({
          ...state,
          animations: currentState.animations.set(new AnimationKey(), {
            length: 'medium',
            player: 0,
            sound: null,
            text: String(
              fbt(
                `The game ended in a draw!`,
                'Text for when a game ended in a draw.',
              ),
            ),
            type: 'banner',
          }),
        }));
        break;
      }

      const winners = [
        ...new Set([
          ...team.players.map(({ id }) => id).values(),
          ...(
            getWinningInvaders(
              map,
              team,
              map
                .getPlayers()
                .filter(isHumanPlayer)
                .find((player) => player.crystal === Crystal.Power) || null,
            ) || []
          ).map(({ id }) => id),
        ]),
      ];
      const fireworks =
        state.currentViewer && winners.includes(state.currentViewer) ? 5 : 3;
      await update((currentState) => ({
        ...state,
        animations: currentState.animations.set(new AnimationKey(), {
          color: winners,
          length: 'medium',
          onComplete: (state) =>
            animateFireworks(
              state,
              arrayShuffle([
                ...getPossibleFireworksPositions(map, toPlayer),
              ]).slice(0, fireworks),
              (state) => {
                requestFrame(async () => {
                  state = await maybeReceiveChaosStarsAnimation(
                    actions,
                    state,
                    actionResponse.chaosStars,
                  );
                  resolve({
                    ...state,
                    map: newMap,
                  });
                });
                return null;
              },
            ),
          player: winners[0],
          sound: null,
          text: String(
            fbt(
              fbt.list(
                'winners',
                winners.map(getTranslatedFactionName.bind(null, playerDetails)),
              ) +
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
    case 'SetPlayer':
    case 'SetPlayerTime':
    case 'SetViewer':
      return { ...state, map: newMap };
    case 'BuySkill':
      return buySkillAction(actions, actionResponse);
    case 'ReceiveReward': {
      const { permanent, reward } = actionResponse;
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
        case 'Crystal':
        case 'Biome':
        case 'SkillSlot':
        case 'UnitPortraits': {
          const player = map.getPlayer(actionResponse.player);
          if (
            player.isHumanPlayer() &&
            !playerHasReward(map, actionResponse.player, actionResponse)
          ) {
            if (rewardType === 'Biome') {
              return receiveBiomeAnimation(actions, state, actionResponse);
            } else if (rewardType === 'Crystal' && permanent) {
              return receiveCrystalAnimation(actions, state, actionResponse);
            } else if (rewardType === 'SkillSlot') {
              return receiveSkillSlotAnimation(actions, state, actionResponse);
            } else if (rewardType === 'UnitPortraits') {
              return receivePortraitAnimation(actions, state, actionResponse);
            }
          }
          break;
        }
        case 'Keyart':
          break;
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
    case 'ActivatePower': {
      return actionResponse.skill === Skill.SpawnUnitInfernoJetpack
        ? clientActivatePowerAction(actions, state, actionResponse)
        : activatePowerAction(actions, state, actionResponse);
    }
    case 'AbandonInvasion': {
      state = await update(abandonInvasion(state, actionResponse.name));
      state = await maybeReceiveChaosStarsAnimation(
        actions,
        state,
        actionResponse.chaosStars,
      );

      requestFrame(() =>
        resolve({
          ...state,
          map: newMap,
        }),
      );
      break;
    }
    case 'ActivateCrystal':
      return activateCrystalAction(actions, actionResponse);
    case 'OptionalObjective':
    case 'SecretDiscovered':
      return objectiveAnimation(actions, newMap, state, actionResponse);
    case 'IncreaseCharge':
    case 'IncreaseFunds':
      return addIncreaseValueAnimation(actions, newMap, actionResponse);
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
  animationSpeed: AnimationSpeed,
  playerHasReward: PlayerHasRewardFunction,
): Promise<State> {
  let lastActionResponse: ActionResponse | null = null;
  const messageState = { count: 0, lastPlayerId: null, lastUnitId: null };
  const responses = gameActionResponses.slice();
  while (responses.length) {
    const response = responses.shift();
    if (response) {
      if (
        lastActionResponse &&
        !(state.skipDialogue && lastActionResponse.type === 'CharacterMessage')
      ) {
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
          lastActionResponse,
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
              animationConfig: getCurrentAnimationConfig(
                (newState.map || state.map).getPlayer(nextResponse.next.player),
                animationSpeed,
              ),
              selectedPosition: null,
              selectedUnit: null,
            }
          : null),
      });
    }
  }
  return state;
}
