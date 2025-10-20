import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { PlayerIDs } from '@deities/athena/map/Player.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css } from '@emotion/css';
import Stack from '@nkzw/stack';
import { arrayToShuffled } from 'array-shuffle';
import { fbt } from 'fbtee';
import { motion } from 'framer-motion';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import Portrait, { PortraitHeight } from '../character/Portrait.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getUserDisplayName from '../lib/getUserDisplayName.tsx';
import isInvader from '../lib/isInvader.tsx';
import { Actions, State } from '../Types.tsx';

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

  const ids = arrayToShuffled(PlayerIDs);
  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: player,
        component: ({ duration, isVisible }) => (
          <Stack center className={portraitContainerStyle}>
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
                  player={ids[variant]}
                  unit={unit}
                  variant={variant}
                />
              </motion.div>
            ))}
          </Stack>
        ),
        direction: 'up',
        length: isInvader(state.map, player) ? 'medium' : 'long',
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
            fbt.param('user', getUserDisplayName(state.playerDetails, player)) +
              ' unlocked new unit portraits!',
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

  gap: ${TileSize}px;
  ${Breakpoints.sm} {
    gap: ${TileSize * 1.5}px;
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
