import { ReceiveRewardActionResponse } from '@deities/apollo/ActionResponse.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { generateRandomMap } from '@deities/athena/generator/MapGenerator.tsx';
import { Plain, TileInfo } from '@deities/athena/info/Tile.tsx';
import convertBiome from '@deities/athena/lib/convertBiome.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { css } from '@emotion/css';
import Stack from '@nkzw/stack';
import { fbt } from 'fbtee';
import { motion } from 'framer-motion';
import { resetBehavior } from '../behavior/Behavior.tsx';
import NullBehavior from '../behavior/NullBehavior.tsx';
import InlineTileList from '../card/InlineTileList.tsx';
import AnimationKey from '../lib/AnimationKey.tsx';
import getTranslatedBiomeName from '../lib/getTranslatedBiomeName.tsx';
import getUserDisplayName from '../lib/getUserDisplayName.tsx';
import isInvader from '../lib/isInvader.tsx';
import { Actions, State } from '../Types.tsx';

export default async function receiveBiomeAnimation(
  { requestFrame, update }: Actions,
  state: State,
  actionResponse: ReceiveRewardActionResponse,
): Promise<State> {
  const { player } = actionResponse;
  const biome = actionResponse.reward.type === 'Biome' ? actionResponse.reward.biome : null;

  if (biome == null) {
    return state;
  }

  const map = convertBiome(withModifiers(generateRandomMap(new SizeVector(5, 5))), biome);
  const tiles = [
    ...map.reduceEachField(
      (field, vector) => field.add(map.getTileInfo(vector)),
      new Set<TileInfo>(),
    ),
  ];

  return new Promise((resolve) =>
    update((state) => ({
      animations: state.animations.set(new AnimationKey(), {
        color: player,
        component: ({ duration, isVisible }) => (
          <Stack center className={biomeContainerStyle}>
            {[0, 1, 2].map((variant) => (
              <motion.div
                animate={{
                  opacity: isVisible ? 1 : 0,
                  y: isVisible ? 0 : TileSize,
                }}
                className={biomeStyle}
                initial={{
                  opacity: 0,
                  y: TileSize,
                }}
                key={variant}
                style={{ position: 'relative' }}
                transition={{
                  delay: duration * 5 * (variant === 0 ? 1 : variant === 1 ? 0 : 2),
                  duration: duration * 10,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
              >
                <InlineTileList biome={biome} tiles={[tiles[variant] || Plain]} />
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
              ' received the ' +
              fbt.param('biome', getTranslatedBiomeName(biome)) +
              ' biome!',
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

const biomeContainerStyle = css`
  padding: 32px 0 12px;

  gap: ${TileSize / 2}px;
  ${Breakpoints.sm} {
    gap: ${TileSize}px;
  }
`;

const biomeStyle = css`
  filter: drop-shadow(0 0 8px #fff);
  ${Breakpoints.sm} {
    filter: drop-shadow(0 0 12px #fff);
  }
`;
