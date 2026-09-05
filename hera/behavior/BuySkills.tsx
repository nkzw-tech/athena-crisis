import { getSkillConfig } from '@deities/athena/info/Skill.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Info from '@deities/ui/icons/Info.tsx';
import { css } from '@emotion/css';
import sortBy from '@nkzw/core/sortBy.js';
import { fbt } from 'fbtee';
import addFlashAnimation from '../lib/addFlashAnimation.tsx';
import getSkillConfigForDisplay from '../lib/getSkillConfigForDisplay.tsx';
import toTransformOrigin, { ClientCoordinates } from '../lib/toTransformOrigin.tsx';
import { State, StateLike, StateWithActions } from '../Types.tsx';
import { actionWheelInfoIconStyle, LargeActionButton } from '../ui/ActionWheel.tsx';
import PaginatedActionWheel from '../ui/PaginatedActionWheel.tsx';
import { SkillIcon } from '../ui/SkillDialog.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import clientBuySkillAction from './buySkill/clientBuySkillAction.tsx';

export default class BuySkills {
  public readonly type = 'buySkills' as const;
  public readonly navigate = true;

  activate(state: State): StateLike | null {
    const { animations, selectedBuilding, selectedPosition } = state;
    if (selectedBuilding && selectedPosition && !selectedBuilding.skills?.size) {
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
    const { showGameInfo } = actions;

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
    if (currentViewer && selectedBuilding && selectedPosition && selectedBuilding.skills?.size) {
      const currentPlayer = map.getCurrentPlayer();
      const funds = currentPlayer.funds;
      const skillCosts = new Map(
        [...selectedBuilding.skills].map((skill) => [skill, getSkillConfig(skill).cost]),
      );

      const skills = sortBy(
        [...selectedBuilding.skills],
        (skill) => skillCosts.get(skill) || Number.POSITIVE_INFINITY,
      ).filter(
        (skill) => (skillCosts.get(skill) || Number.POSITIVE_INFINITY) < Number.POSITIVE_INFINITY,
      );

      return (
        <PaginatedActionWheel
          actions={actions}
          animationConfig={animationConfig}
          color={map.getCurrentPlayer().id}
          funds={funds}
          items={skills}
          navigationDirection={navigationDirection}
          position={selectedPosition}
          tileSize={tileSize}
          zIndex={zIndex}
        >
          {(skill, position, entityCount) => {
            const cost = skillCosts.get(skill)!;
            const { name } = getSkillConfigForDisplay(skill);
            const isDisabled = funds < cost || currentPlayer.skills.has(skill);
            const buy = async () => {
              if (!isDisabled && selectedPosition) {
                await clientBuySkillAction(actions, state, selectedPosition, skill);
              }
            };

            const showInfo = (
              event: MouseEvent | LongPressReactEvents<Element> | ClientCoordinates,
            ) =>
              showGameInfo({
                action: isDisabled ? undefined : buy,
                actionName: <fbt desc="Button to buy a skill">Buy</fbt>,
                charges: null,
                currentItem: { skill, type: 'Skill' },
                origin: toTransformOrigin(event),
                showCost: true,
                type: 'player-effect',
              });

            return (
              <LargeActionButton
                detail={String(cost)}
                disabled={isDisabled}
                entityCount={entityCount}
                icon={() => (
                  <>
                    <div className={skillIconStyle}>
                      <SkillIcon disabled={isDisabled} hideDialog skill={skill} />
                    </div>
                    <Icon
                      className={actionWheelInfoIconStyle}
                      icon={Info}
                      onClick={(event) => {
                        event.stopPropagation();
                        showInfo(event);
                      }}
                    />
                  </>
                )}
                key={skill}
                label={name}
                navigationDirection={navigationDirection}
                onClick={buy}
                onLongPress={showInfo}
                position={position}
              />
            );
          }}
        </PaginatedActionWheel>
      );
    }
    return null;
  };
}

const skillIconStyle = css`
  color: ${applyVar('text-color')};
  transform: scale(0.5);
`;
