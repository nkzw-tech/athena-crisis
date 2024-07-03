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

export const EffectObjectiveTitle = ({
  id,
  objectives,
}: {
  id: DynamicEffectObjectiveID;
  objectives?: Objectives;
}) => {
  switch (id) {
    case 'win':
      return <fbt desc="Game end effect name for winning">Won</fbt>;
    case 'lose':
      return <fbt desc="Game end effect name for losing.">Lost</fbt>;
    case 'draw':
      return <fbt desc="Game end effect name for draw.">Draw</fbt>;
    default: {
      const objective = objectives?.get(id);
      return objective ? (
        <ObjectiveTitle id={id} objective={objective} />
      ) : null;
    }
  }
};

export default memo(function EffectTitle({
  effect,
  effects,
  objectives,
  trigger,
}: {
  effect: Effect;
  effects?: Effects;
  objectives: Objectives | undefined;
  trigger: EffectTrigger;
}) {
  const effectList = effects?.get(trigger);
  const hasMany = (effectList?.size || 1) > 1;
  const index = hasMany && effectList ? [...effectList].indexOf(effect) : -1;
  const indexText = index >= 0 ? ` #${index + 1}` : '';
  const players = effect.players
    ? [...effect.players].map((id) => <MiniPlayerIcon id={id} key={id} />)
    : null;

  if (trigger === 'Start') {
    return (
      <div className={cx(titleStyle, ellipsis)}>
        <fbt desc="Label for 'Start' effect">Start</fbt>
        {indexText}
        {players}
      </div>
    );
  }

  if (trigger === 'GameEnd' || trigger === 'OptionalObjective') {
    const condition = effect.conditions?.find(
      (condition): condition is GameEndCondition | OptionalObjectiveCondition =>
        condition.type === trigger,
    );
    return (
      <div className={cx(titleStyle, ellipsis)}>
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
            <EffectObjectiveTitle
              id={condition.value}
              objectives={objectives}
            />
          </>
        )}
      </div>
    );
  }

  return (
    <div className={cx(titleStyle, ellipsis)}>
      {trigger}
      {indexText}
      {players}
    </div>
  );
});

const titleStyle = css`
  align-items: center;
  display: inline-flex;
  gap: 6px;
  padding: 0 2px 2px 0;
`;
