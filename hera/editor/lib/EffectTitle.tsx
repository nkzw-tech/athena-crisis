import {
  GameEndCondition,
  OptionalCondition,
  WinConditionID,
} from '@deities/apollo/Condition.tsx';
import { Effect, Effects, EffectTrigger } from '@deities/apollo/Effects.tsx';
import { WinConditions } from '@deities/athena/WinConditions.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import MiniPlayerIcon from '../../ui/MiniPlayerIcon.tsx';
import WinConditionTitle from '../../win-conditions/WinConditionTitle.tsx';

export const EffectWinConditionTitle = ({
  id,
  winConditions,
}: {
  id: WinConditionID;
  winConditions?: WinConditions;
}) => {
  switch (id) {
    case 'win':
      return <fbt desc="Game end effect name for winning">Won</fbt>;
    case 'lose':
      return <fbt desc="Game end effect name for losing.">Lost</fbt>;
    case 'draw':
      return <fbt desc="Game end effect name for draw.">Draw</fbt>;
    default: {
      const condition = winConditions?.[id];
      return condition ? (
        <WinConditionTitle condition={condition} index={id} />
      ) : null;
    }
  }
};

export default memo(function EffectTitle({
  effect,
  effects,
  trigger,
  winConditions,
}: {
  effect: Effect;
  effects?: Effects;
  trigger: EffectTrigger;
  winConditions: WinConditions | undefined;
}) {
  const effectList = effects?.get(trigger);
  const hasMany = (effectList?.size || 1) > 1;
  const index = effectList ? [...effectList].indexOf(effect) : -1;
  const indexText = index >= 0 && hasMany ? ` #${index + 1}` : '';
  const players = effect.players
    ? [...effect.players].map((id) => <MiniPlayerIcon id={id} key={id} />)
    : null;

  if (trigger === 'Start') {
    return (
      <span className={cx(titleStyle, ellipsis)}>
        <fbt desc="Label for 'Start' effect">Start</fbt>
        {indexText}
        {players}
      </span>
    );
  }

  if (trigger === 'GameEnd' || trigger === 'OptionalCondition') {
    const condition = effect.conditions?.find(
      (condition): condition is GameEndCondition | OptionalCondition =>
        condition.type === 'GameEnd' || condition.type === 'Optional',
    );
    return (
      <span className={cx(titleStyle, ellipsis)}>
        {condition && (
          <span>
            {condition.type === 'GameEnd' ? (
              <fbt desc="Label for 'GameEnd' effect">Game End</fbt>
            ) : (
              <fbt desc="Label for 'Optional' effect">Optional Condition</fbt>
            )}
          </span>
        )}
        {players}
        {condition && (
          <>
            <span>-</span>
            <EffectWinConditionTitle
              id={condition.value}
              winConditions={winConditions}
            />
          </>
        )}
      </span>
    );
  }

  return (
    <span className={cx(titleStyle, ellipsis)}>
      {trigger}
      {indexText}
      {players}
    </span>
  );
});

const titleStyle = css`
  align-items: center;
  display: inline-flex;
  gap: 6px;
  padding: 0 2px 2px 0;
`;
