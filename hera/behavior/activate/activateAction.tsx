import {
  ActivateCrystalAction,
  ActivatePowerAction,
} from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { Actions, PlayerEffectItem, State } from '../../Types.tsx';
import activateCrystalAction from '../activateCrystal/activateCrystalAction.tsx';
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

export default async function activateAction(
  actions: Actions,
  state: State,
  item: PlayerEffectItem,
  target: Vector | null,
) {
  const [remoteAction, , actionResponse] = actions.action(
    state,
    getActionMutator(item, target),
  );
  if (
    actionResponse.type === 'ActivatePower' ||
    actionResponse.type === 'ActivateCrystal'
  ) {
    await actions.update({
      ...(await (actionResponse.type === 'ActivatePower'
        ? clientActivatePowerAction(actions, state, actionResponse)
        : activateCrystalAction(actions, actionResponse))),
    });
    await handleRemoteAction(actions, remoteAction);
  }
}
