import getAverageVector from '@deities/athena/lib/getAverageVector.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import { resolveDynamicPlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import { ActionResponse } from '../ActionResponse.tsx';

export default function getActionResponseVectors(
  map: MapData,
  actionResponse: ActionResponse,
): ReadonlyArray<Vector> {
  const { type } = actionResponse;
  switch (type) {
    case 'AttackBuilding':
    case 'AttackUnit':
    case 'CreateUnit':
    case 'DropUnit':
    case 'Heal':
    case 'Move':
    case 'Rescue':
    case 'Sabotage': {
      const { from, to } = actionResponse;
      return from ? [from, to] : [to];
    }
    case 'BuySkill':
    case 'Capture':
    case 'CreateBuilding':
    case 'CreateTracks':
    case 'Fold':
    case 'HiddenTargetAttackBuilding':
    case 'HiddenTargetAttackUnit':
    case 'Supply':
    case 'Unfold':
      return [actionResponse.from];
    case 'HiddenDestroyedBuilding':
    case 'HiddenSourceAttackBuilding':
    case 'HiddenSourceAttackUnit':
    case 'ToggleLightning': {
      return [actionResponse.to];
    }
    case 'Spawn':
      return actionResponse.units.keySeq().toArray();
    case 'HiddenMove':
      return [...actionResponse.path];
    case 'ActivatePower':
    case 'EndTurn': {
      const player =
        actionResponse.type === 'EndTurn'
          ? actionResponse.next.player
          : map.getCurrentPlayer();

      const match = (entity: Entity) => map.matchesPlayer(entity, player);
      let vectors = map.units.filter(match).keySeq().toArray();
      if (!vectors.length) {
        vectors = map.buildings.filter(match).keySeq().toArray();
      }
      // Average the vectors beforehand because the vectors in this list
      // are not useful for calculating boundaries.
      return vectors.length ? [getAverageVector(vectors)] : [];
    }
    case 'CharacterMessage': {
      const { player: dynamicPlayer, unitId } = actionResponse;
      const player = resolveDynamicPlayerID(map, dynamicPlayer);
      const position = map.units.findKey(
        (unit) =>
          unit.id === unitId &&
          unit.isLeader() &&
          map.matchesPlayer(unit, player),
      );
      // Select the position above if possible because it shows the character name.
      return position
        ? [map.contains(position.up()) ? position.up() : position]
        : [];
    }
    // These actions have vectors attached to them, but they are not animated
    // and not interesting to scroll them into view.
    case 'CompleteBuilding':
    case 'CompleteUnit':
    case 'MoveUnit':
      break;
    // These actions have no vectors attached to them.
    case 'AttackUnitGameOver':
    case 'BeginGame':
    case 'BeginTurnGameOver':
    case 'CaptureGameOver':
    case 'GameEnd':
    case 'HiddenFundAdjustment':
    case 'Message':
    case 'OptionalObjective':
    case 'PreviousTurnGameOver':
    case 'ReceiveReward':
    case 'SecretDiscovered':
    case 'SetViewer':
    case 'Start':
      break;
    default: {
      actionResponse satisfies never;
      throw new UnknownTypeError('getActionResponseVectors', type);
    }
  }
  return [];
}
