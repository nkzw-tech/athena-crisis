import { HealAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import getHealableVectors from '@deities/athena/lib/getHealableVectors.tsx';
import getHealCost from '@deities/athena/lib/getHealCost.tsx';
import { HealAmount, MaxHealth } from '@deities/athena/map/Configuration.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import { css } from '@emotion/css';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import getFirst from '@nkzw/core/getFirst.js';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import FlashFlyout from '../ui/FlashFlyout.tsx';
import { FlyoutItem } from '../ui/Flyout.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import ConfirmAction from './confirm/ConfirmAction.tsx';
import healAction from './heal/healAction.tsx';

export default class Heal {
  public readonly type = 'heal' as const;

  select(
    vector: Vector,
    state: State,
    actions: Actions,
    editor?: unknown,
    subVector?: unknown,
    shouldConfirm?: boolean,
  ): StateLike | null {
    const { confirmAction, map, radius, selectedPosition } = state;
    const unitB = radius?.fields.has(vector) && map.units.get(vector);

    if (confirmAction) {
      return confirmAction.position.equals(vector)
        ? confirmAction.onAction(state)
        : selectFallback(vector, state, actions);
    }

    if (
      selectedPosition &&
      radius &&
      unitB &&
      vector.distance(selectedPosition) === 1
    ) {
      const currentPlayer = map.getCurrentPlayer();
      const cost = getHealCost(unitB, currentPlayer);
      if (map.getCurrentPlayer().funds >= cost) {
        const onAction = (state: State): StateLike | null => {
          const actionResponse = actions.optimisticAction(
            state,
            HealAction(selectedPosition, vector),
          );
          return {
            confirmAction: null,
            ...(actionResponse.type === 'Heal'
              ? healAction(actionResponse, state)
              : null),
          };
        };

        return shouldConfirm
          ? {
              confirmAction: {
                icon: 'heal',
                onAction,
                position: vector,
              },
              radius: {
                ...radius,
                locked: true,
              },
            }
          : onAction(state);
      }
    }
    return selectFallback(vector, state, actions);
  }

  activate(state: State): StateLike | null {
    const { map, selectedPosition, selectedUnit } = state;
    if (selectedUnit && selectedPosition) {
      const fields = new Map(
        [...getHealableVectors(map, selectedPosition)].map((vector) => [
          vector,
          RadiusItem(vector),
        ]),
      );
      const first = getFirst(fields.keys());
      return {
        position: first,
        radius: {
          fields,
          path: first ? [first] : null,
          type: RadiusType.Defense,
        },
      };
    }
    return resetBehavior();
  }

  component = ({ actions, state }: StateWithActions) => {
    const {
      animationConfig,
      confirmAction,
      map,
      radius,
      selectedPosition,
      tileSize,
      zIndex,
    } = state;
    const position = confirmAction?.position || state.position;
    const unitB =
      position && radius?.fields.has(position) && map.units.get(position);
    if (selectedPosition && unitB) {
      const currentPlayer = map.getCurrentPlayer();
      const cost = getHealCost(unitB, currentPlayer);
      const hasEnoughFunds = currentPlayer.funds >= cost;
      return (
        <>
          <FlashFlyout
            align="top"
            animationConfig={animationConfig}
            items={[
              <FlyoutItem center disabled={!hasEnoughFunds} key="coin">
                <Icon className={coinIconStyle} icon={Coin} />
                {cost}
              </FlyoutItem>,
              hasEnoughFunds ? (
                <FlyoutItem key="change">
                  <span>
                    {unitB.health}{' '}
                    <span>
                      +{' '}
                      {Math.min(MaxHealth, unitB.health + HealAmount) -
                        unitB.health}{' '}
                    </span>
                    {' → '}
                    {Math.min(MaxHealth, unitB.health + HealAmount)}
                    <Icon className={iconStyle} icon={Heart} />
                  </span>
                </FlyoutItem>
              ) : (
                <FlyoutItem color="red" key="change">
                  <fbt desc="Not enough funds label">Not enough funds!</fbt>
                </FlyoutItem>
              ),
            ]}
            mini
            position={position}
            tileSize={tileSize}
            width={map.size.width}
            zIndex={zIndex}
          />
          {confirmAction && (
            <ConfirmAction state={state} {...confirmAction} actions={actions} />
          )}
        </>
      );
    }
    return null;
  };
}

const iconStyle = css`
  margin: 0 0 0 1.5px;
`;

const coinIconStyle = css`
  margin: 1px 1.5px 0 0;
`;
