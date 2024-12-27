import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { fbt } from 'fbtee';
import { motion } from 'framer-motion';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import CrystalSprite from '../invasions/CrystalSprite.tsx';
import getTranslatedCrystalName from '../invasions/getTranslatedCrystalName.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getUserDisplayName from '../lib/getUserDisplayName.tsx';
import isInvader from '../lib/isInvader.tsx';
import { Actions, State } from '../Types.tsx';

export default async function receiveCrystalAnimation(
  { requestFrame, update }: Actions,
  state: State,
  actionResponse: ReceiveRewardActionResponse,
): Promise<State> {
  const { player } = actionResponse;
  const crystal =
    actionResponse.reward.type === 'Crystal'
      ? actionResponse.reward.crystal
      : null;

  return crystal === null
    ? state
    : new Promise((resolve) =>
        update((state) => ({
          animations: state.animations.set(new AnimationKey(), {
            color: player,
            component: ({ duration, isVisible }) => (
              <Stack center className={containerStyle} nowrap>
                <motion.div
                  animate={{
                    opacity: isVisible ? 1 : 0,
                    y: isVisible ? 0 : TileSize,
                  }}
                  className={crystalStyle}
                  initial={{
                    opacity: 0,
                    y: TileSize,
                  }}
                  style={{ position: 'relative' }}
                  transition={{
                    delay: duration * 5,
                    duration: duration * 10,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  <CrystalSprite animate crystal={crystal} />
                </motion.div>
              </Stack>
            ),
            direction: 'up',
            length: isInvader(state.map, player) ? 'short' : 'medium',
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
                  'user',
                  getUserDisplayName(state.playerDetails, player),
                ) +
                  ' received a ' +
                  fbt.param('crystal', getTranslatedCrystalName(crystal)),
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

const containerStyle = css`
  padding: 32px 0 12px;

  gap: ${TileSize / 2}px;
  ${Breakpoints.sm} {
    gap: ${TileSize}px;
  }
`;

const crystalStyle = css`
  filter: drop-shadow(0 0 8px #fff);
  ${Breakpoints.sm} {
    filter: drop-shadow(0 0 12px #fff);
  }
`;
