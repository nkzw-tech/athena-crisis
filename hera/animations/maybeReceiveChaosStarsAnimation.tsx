import { ChaosStars } from '@deities/apollo/invasions/ChaosStars.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { fbt } from 'fbt';
import { motion } from 'framer-motion';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getUserDisplayName from '../lib/getUserDisplayName.tsx';
import { Actions, State } from '../Types.tsx';
import StarIcon from '../ui/StarIcon.tsx';

export default async function maybeReceiveChaosStarsAnimation(
  { requestFrame, update }: Actions,
  state: State,
  chaosStars: ChaosStars | undefined,
): Promise<State> {
  const { currentViewer } = state;
  const amount = currentViewer && chaosStars?.get(currentViewer);
  if (!currentViewer || amount == null || amount <= 0) {
    return state;
  }

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: currentViewer,
        component: ({ duration, isVisible }) => (
          <Stack center className={containerStyle} nowrap>
            {Array(amount)
              .fill(0)
              .map((_, index) => (
                <motion.div
                  animate={{
                    opacity: isVisible ? 1 : 0,
                    y: isVisible ? 0 : TileSize * 3,
                  }}
                  className={starStyle}
                  initial={{
                    opacity: 0,
                    y: TileSize * 3,
                  }}
                  key={index}
                  style={{ position: 'relative' }}
                  transition={{
                    delay:
                      duration * 2 * Math.abs(index - Math.floor(amount / 2)),
                    duration: duration * 10,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <StarIcon size="medium" type="chaos" />
                </motion.div>
              ))}
          </Stack>
        ),
        direction: 'up',
        length: 'medium',
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
        player: currentViewer,
        sound: 'UI/Start',
        style: 'flashy',
        text: String(
          fbt(
            fbt.param(
              'user',
              getUserDisplayName(state.playerDetails, currentViewer),
            ) +
              ' received ' +
              fbt.param('amount', amount) +
              ' ' +
              fbt.plural('chaos star', amount, {
                many: 'chaos stars',
              }) +
              '',
            'Receive chaos stars message',
          ),
        ),
        type: 'banner',
      }),
      ...resetBehavior(NullBehavior),
    })),
  );
}

const containerStyle = css`
  padding: 32px 0 12px;
  gap: ${TileSize / 1.5}px;
`;

const starStyle = css`
  filter: drop-shadow(0 0 8px #fff);

  ${Breakpoints.sm} {
    filter: drop-shadow(0 0 12px #fff);
  }
`;
