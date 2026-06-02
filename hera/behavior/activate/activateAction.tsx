import {
  ActivateCrystalAction,
  ActivatePowerAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import canActivatePower from '@deities/athena/lib/canActivatePower.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { Actions, PlayerEffectItem, State } from '../../Types.tsx';
import clientActivateCrystalAction from '../activateCrystal/clientActivateCrystalAction.tsx';
import clientActivatePowerAction from '../activatePower/clientActivatePowerAction.tsx';
import handleRemoteAction from '../handleRemoteAction.tsx';

const getActionMutator = (item: PlayerEffectItem, target: Vector | null) => {
  const itemType = item.type;
  switch (itemType) {
    case 'Skill':
      return ActivatePowerAction(item.skill, target);
    case 'Crystal':
      return ActivateCrystalAction(Crystal.Power);
    default: {
      itemType satisfies never;
      throw new UnknownTypeError('getActionMutator', itemType);
    }
  }
};

export const canActivate = (
  state: Pick<State, 'currentViewer' | 'map'>,
  item: PlayerEffectItem,
  target: Vector | null,
  { allowMissingTarget = false }: { allowMissingTarget?: boolean } = {},
) => {
  const { currentViewer, map } = state;
  const currentPlayer = map.getCurrentPlayer();
  if (currentViewer !== currentPlayer.id) {
    return false;
  }

  const itemType = item.type;
  switch (itemType) {
    case 'Skill': {
      const { requiresTarget } = getSkillConfig(item.skill);
      return (
        canActivatePower(currentPlayer, item.skill) &&
        (!requiresTarget || (target ? map.contains(target) : allowMissingTarget))
      );
    }
    case 'Crystal':
      return currentPlayer.isHumanPlayer() && currentPlayer.crystal === null;
    default: {
      itemType satisfies never;
      throw new UnknownTypeError('canActivate', itemType);
    }
  }
};

export default async function activateAction(
  actions: Actions,
  state: State,
  item: PlayerEffectItem,
  target: Vector | null,
) {
  const { action, update } = actions;
  if (!canActivate(state, item, target)) {
    return;
  }

  const [remoteAction, , actionResponse] = action(state, getActionMutator(item, target));
  if (actionResponse.type === 'ActivatePower' || actionResponse.type === 'ActivateCrystal') {
    await update({
      ...(await (actionResponse.type === 'ActivatePower'
        ? clientActivatePowerAction(actions, state, actionResponse)
        : clientActivateCrystalAction(actions, actionResponse))),
    });
    await handleRemoteAction(actions, remoteAction);
  }
}
