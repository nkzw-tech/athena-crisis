import { BuySkillAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import { css } from '@emotion/css';
import More from '@iconify-icons/pixelarticons/more-horizontal.js';
import { fbt } from 'fbt';
import { useState } from 'react';
import addFlashAnimation from '../lib/addFlashAnimation.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import { State, StateLike, StateWithActions } from '../Types.tsx';
import ActionWheel, {
  ActionWheelFunds,
  LargeActionButton,
} from '../ui/ActionWheel.tsx';
import { SkillIcon } from '../ui/SkillDialog.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import buySkillAction from './buySkill/buySkillAction.tsx';

const MAX_SKILLS = 8;

export default class BuySkills {
  public readonly type = 'buySkills' as const;
  public readonly navigate = true;

  activate(state: State): StateLike | null {
    const { animations, selectedBuilding, selectedPosition } = state;
    if (
      selectedBuilding &&
      selectedPosition &&
      !selectedBuilding.skills?.size
    ) {
      return {
        animations: addFlashAnimation(animations, {
          children: fbt('No available skills!', 'Error message'),
          color: 'error',
          position: selectedPosition,
        }),
        ...resetBehavior(),
      };
    }
    return null;
  }

  select = selectFallback;

  component = ({ actions, state }: StateWithActions) => {
    const { showGameInfo, update } = actions;
    const [cursor, setCursor] = useState(0);

    const {
      animationConfig,
      currentViewer,
      map,
      navigationDirection,
      selectedBuilding,
      selectedPosition,
      tileSize,
      zIndex,
    } = state;
    if (
      currentViewer &&
      selectedBuilding &&
      selectedPosition &&
      selectedBuilding.skills?.size
    ) {
      const currentPlayer = map.getCurrentPlayer();
      const funds = currentPlayer.funds;
      const skillCosts = new Map(
        [...selectedBuilding.skills].map((skill) => [
          skill,
          getSkillConfig(skill).cost,
        ]),
      );

      const skills = sortBy(
        [...selectedBuilding.skills],
        (skill) => skillCosts.get(skill) || Number.POSITIVE_INFINITY,
      ).filter(
        (skill) =>
          (skillCosts.get(skill) || Number.POSITIVE_INFINITY) <
          Number.POSITIVE_INFINITY,
      );

      const skillsToDisplay =
        skills.length > MAX_SKILLS
          ? skills.slice(cursor, cursor + MAX_SKILLS - 1)
          : skills;
      const entityCount =
        skillsToDisplay.length +
        (skillsToDisplay.length < skills.length ? 1 : 0);
      let position = 0;
      return (
        <ActionWheel
          actions={actions}
          animationConfig={animationConfig}
          color={map.getCurrentPlayer().id}
          entityCount={entityCount}
          position={selectedPosition}
          tileSize={tileSize}
          zIndex={zIndex}
        >
          <ActionWheelFunds funds={funds} />
          {skillsToDisplay.map((skill) => {
            const cost = skillCosts.get(skill)!;
            const isDisabled = funds < cost || currentPlayer.skills.has(skill);
            const buy = async () => {
              if (!isDisabled && selectedPosition) {
                const actionResponse = actions.optimisticAction(
                  state,
                  BuySkillAction(selectedPosition, skill),
                );
                if (actionResponse.type === 'BuySkill') {
                  update(await buySkillAction(actions, actionResponse));
                }
              }
            };
            return (
              <LargeActionButton
                detail={String(cost)}
                disabled={isDisabled}
                entityCount={entityCount}
                icon={(highlight) => (
                  <div className={skillIconStyle}>
                    <SkillIcon disabled={isDisabled} hideDialog skill={skill} />
                  </div>
                )}
                key={skill}
                navigationDirection={navigationDirection}
                onClick={buy}
                onLongPress={(event) =>
                  showGameInfo({
                    action: isDisabled ? undefined : buy,
                    actionName: <fbt desc="Button to buy a skill">Buy</fbt>,
                    currentSkill: skill,
                    origin: toTransformOrigin(event),
                    showCost: true,
                    type: 'skill',
                  })
                }
                position={position++}
              />
            );
          })}
          {skillsToDisplay.length < skills.length && (
            <LargeActionButton
              detail={
                cursor === 0
                  ? fbt('More', 'Button to show more menu items')
                  : fbt('Back', 'Button to show previous menu items')
              }
              entityCount={entityCount}
              icon={(highlight, props) => <Icon icon={More} {...props} />}
              navigationDirection={navigationDirection}
              onClick={() =>
                setCursor((cursor) =>
                  cursor === 0 ? cursor + MAX_SKILLS - 1 : 0,
                )
              }
              position={position}
            />
          )}
        </ActionWheel>
      );
    }
    return null;
  };
}

const skillIconStyle = css`
  color: ${applyVar('text-color')};
  transform: scale(0.5);
`;
