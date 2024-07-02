import {
  DynamicEffectObjectiveID,
  GameEndCondition,
  OptionalObjectiveCondition,
} from '@deities/apollo/Condition.tsx';
import { Effect, Effects, EffectTrigger } from '@deities/apollo/Effects.tsx';
import { Objectives } from '@deities/athena/Objectives.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import ObjectiveTitle from '../../objectives/ObjectiveTitle.tsx';
import MiniPlayerIcon from '../../ui/MiniPlayerIcon.tsx';

export const EffectWinConditionTitle = ({
  id,
  winConditions,
}: {
  id: DynamicEffectObjectiveID;
  winConditions?: Objectives;
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
        <ObjectiveTitle index={id} objective={condition} />
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
  winConditions: Objectives | undefined;
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

  if (trigger === 'GameEnd' || trigger === 'OptionalObjective') {
    const condition = effect.conditions?.find(
      (condition): condition is GameEndCondition | OptionalObjectiveCondition =>
        condition.type === trigger,
    );
    return (
      <span className={cx(titleStyle, ellipsis)}>
        {condition && (
          <span>
            {condition.type === 'GameEnd' ? (
              <fbt desc="Label for 'GameEnd' effect">Game End</fbt>
            ) : (
              <fbt desc="Label for 'OptionalObjective' effect">
                Optional Objective
              </fbt>
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
