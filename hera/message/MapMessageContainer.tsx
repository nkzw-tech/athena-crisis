import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID, toPlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { isSafari } from '@deities/ui/Browser.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { ReactNode, RefObject, useLayoutEffect, useRef } from 'react';
import MiniPortrait from '../character/MiniPortrait.tsx';
import { UserLikeWithID } from '../hooks/useUserMap.tsx';
import maskClassName from '../lib/maskClassName.tsx';
import Tick from '../Tick.tsx';
import { ClientMapMessage, PlayerDetails } from '../Types.tsx';
import { ScrollContainerWithNavigation } from '@deities/ui/ScrollContainer.tsx';

export const getMessagePlayer = (
  user: UserLikeWithID,
  player: PlayerID | null,
  playerDetails: PlayerDetails,
) => {
  return player && playerDetails.get(player)?.id === user.id
    ? player
    : toPlayerID(user.character.color);
};

export default function MapMessageContainer({
  animationConfig,
  button,
  children,
  isValuable,
  maskRef,
  player,
  playerDetails,
  scale,
  scroll,
  user,
  vector,
  zIndex,
}: {
  animationConfig: AnimationConfig;
  button?: ReactNode;
  children: ReactNode;
  isValuable?: boolean;
  maskRef: RefObject<HTMLDivElement | null>;
  player: PlayerID | null;
  playerDetails: PlayerDetails;
  scale: number;
  scroll?: true;
  user: ClientMapMessage['user'];
  vector: Vector;
  zIndex: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (ref.current && maskRef.current) {
      const position = maskRef.current
        ?.querySelector(`.${maskClassName(vector)}`)
        ?.getBoundingClientRect();

      if (position) {
        const currentScale = isSafari ? scale : 1;
        const inverseScale = isSafari ? 1 : scale;
        const left = window.scrollX + position.width + position.x - 2;
        const top =
          window.scrollY +
          position.y +
          position.height -
          (inverseScale / 4) * TileSize;

        ref.current.style.left = `${left * currentScale}px`;
        ref.current.style.top = `${top * currentScale}px`;
        ref.current.style.opacity = '1';
      }
    }
  }, [maskRef, scale, vector]);

  const isPresent = !!(player && playerDetails.get(player)?.id === user.id);
  const playerID = isPresent ? player : toPlayerID(user.character.color);

  return (
    <div className={containerStyle} ref={ref} style={{ zIndex }}>
      <div
        className={maskStyle}
        style={{
          bottom: -TileSize * 0.5,
          height: scale * TileSize * 1.5,
          width: TileSize * scale,
        }}
      />
      <div
        className={cx(messageStyle, isValuable && valuableStyle)}
        style={{
          [vars.set('color')]: getColor(playerID),
        }}
      >
        <Stack gap={scroll ? undefined : true} vertical>
          <ScrollContainerWithNavigation
            className={relativeStyle}
            key="message"
            navigate={!!scroll}
            scrollContainerClassName={cx(
              paddingStyle,
              isValuable && offsetStyle,
              scroll && scrollContainerStyle,
            )}
            scrollDownClassName={scrollDownClassName}
          >
            <Tick animationConfig={animationConfig}>{children}</Tick>
          </ScrollContainerWithNavigation>
          <Stack alignCenter className={bottomStyle} gap nowrap>
            <Stack alignCenter gap nowrap start>
              <MiniPortrait
                animate
                human
                player={playerID}
                portraitClip
                user={user}
              />
              <div className={cx(nameStyle, ellipsis)}>{user.displayName}</div>
            </Stack>
            {button}
          </Stack>
        </Stack>
      </div>
    </div>
  );
}

const vars = new CSSVariables<'color'>('mm');

const containerStyle = css`
  opacity: 0;
  padding-left: 24px;
  position: absolute;
  transform: translate3d(0, -55%, 0);
  transition: opacity 150ms ease-in-out;
`;

const relativeStyle = css`
  position: relative;
`;

const maskStyle = css`
  position: absolute;
  left: 0;
`;

const messageStyle = css`
  ${vars.set('color', applyVar('background-color-light'))}

  backdrop-filter: blur(4px);
  background-color: ${applyVar('background-color-light')};
  filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5));
  border-radius: 10px;
  border: 4px solid ${vars.apply('color')};
  bottom: 0;
  left: 24px;
  max-width: 408px;
  min-width: 360px;
  position: absolute;

  &:after {
    border: 24px solid transparent;
    border-bottom: 0;
    border-left: 0;
    border-right-color: ${vars.apply('color')};
    content: '';
    height: 0;
    left: 0;
    margin-left: -24px;
    margin-top: -12px;
    position: absolute;
    bottom: 9px;
    width: 0;
  }
`;

const valuableStyle = css`
  filter: drop-shadow(0 0 10px rgba(${applyVar('color-gold-base')}, 0.8));
`;

const paddingStyle = css`
  padding: 12px 12px 4px;
`;

const offsetStyle = css`
  padding-right: 40px;
`;

const scrollContainerStyle = css`
  overflow-y: auto;
  height: 320px;
`;

const bottomStyle = css`
  background-color: ${vars.apply('color')};
  border: 4px solid ${vars.apply('color')};
  border-bottom-width: 2px;
  color: #fff;
  margin-bottom: -1px;
`;

const nameStyle = css`
  line-height: 24px;
  max-width: 180px;
`;

const scrollDownClassName = css`
  bottom: 42px;
`;
