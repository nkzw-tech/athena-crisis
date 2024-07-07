import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { fbt } from 'fbt';
import { motion } from 'framer-motion';
import Portrait, { PortraitHeight } from '../../character/Portrait.tsx';
import AnimationKey from '../../lib/AnimationKey.tsx';
import getTranslatedFactionName from '../../lib/getTranslatedFactionName.tsx';
import { Actions, State } from '../../Types.tsx';
import { resetBehavior } from '../Behavior.tsx';
import NullBehavior from '../NullBehavior.tsx';

export default async function receivePortraitAnimation(
  { requestFrame, update }: Actions,
  state: State,
  actionResponse: ReceiveRewardActionResponse,
): Promise<State> {
  const { player } = actionResponse;
  const unit =
    actionResponse.reward.type === 'UnitPortraits'
      ? actionResponse.reward.unit
      : null;

  if (!unit) {
    return state;
  }

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: player,
        component: ({ duration, isVisible }) => (
          <Stack center className={portraitContainerStyle} nowrap>
            {[0, 1, 2].map((variant) => (
              <motion.div
                animate={{
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : PortraitHeight,
                }}
                className={portraitStyle}
                initial={{
                  opacity: 0,
                  y: PortraitHeight,
                }}
                key={variant}
                style={{ position: 'relative' }}
                transition={{
                  delay:
                    duration * 5 * (variant === 0 ? 1 : variant === 1 ? 0 : 2),
                  duration: duration * 10,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                <Portrait
                  animate
                  clip={false}
                  player={player}
                  unit={unit}
                  variant={variant}
                />
              </motion.div>
            ))}
          </Stack>
        ),
        direction: 'up',
        length: 'long',
        onComplete: (state) => {
          requestFrame(() =>
            resolve({
              ...state,
              ...resetBehavior(),
            }),
          );
          return null;
        },
        padding: 'small',
        player,
        sound: 'UI/Start',
        style: 'flashy',
        text: String(
          fbt(
            fbt.param(
              'player',
              getTranslatedFactionName(state.factionNames, player),
            ) + ' unlocked new unit portraits!',
            'Receive reward message',
          ),
        ),
        type: 'banner',
      }),
      map: applyActionResponse(state.map, state.vision, actionResponse),
      ...resetBehavior(NullBehavior),
    })),
  );
}

const portraitContainerStyle = css`
  padding: 32px 0 12px;

  gap: 24px;
  ${Breakpoints.sm} {
    gap: 40px;
  }
`;

const portraitStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)}
  width: fit-content;

  filter: drop-shadow(0 0 8px #fff);
  ${Breakpoints.sm} {
    filter: drop-shadow(0 0 12px #fff);
  }
`;
