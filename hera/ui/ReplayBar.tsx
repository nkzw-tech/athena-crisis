import dateNow from '@deities/apollo/lib/dateNow.tsx';
import {
  GameTimerValue,
  isTimeBankTimer,
} from '@deities/apollo/lib/GameTimerValue.tsx';
import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Live from '@deities/ui/icons/Live.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Android from '@iconify-icons/pixelarticons/android.js';
import Pause from '@iconify-icons/pixelarticons/pause.js';
import Play from '@iconify-icons/pixelarticons/play.js';
import Reload from '@iconify-icons/pixelarticons/reload.js';
import useRelativeTime from '@nkzw/use-relative-time';
import { ReactNode } from 'react';
import { getShortLocale } from '../i18n/getLocale.tsx';
import { Actions, ReplayState } from '../Types.tsx';
import ActionBar from './ActionBar.tsx';
import MiniPlayerIcon from './MiniPlayerIcon.tsx';
import TimeBankTimer from './TimeBankTimer.tsx';

const reload = () => location.reload();

const TimeCard = ({
  children,
  player,
}: {
  children: ReactNode;
  player: Player;
}) => (
  <Stack alignCenter center className={textStyle} flex1 gap nowrap>
    <div className={miniIconStyle}>
      <MiniPlayerIcon gap id={player.id} />
    </div>
    {children}
  </Stack>
);

const TimeBankRemainingTime = ({
  player,
  timeout,
}: {
  player: Player;
  timeout: number;
}) => (
  <TimeCard player={player}>
    <fbt desc="Turn timer with relative time, example: '4:23 remaining'">
      <fbt:param name="relativeTime">
        <TimeBankTimer key={timeout} time={timeout} />
      </fbt:param>{' '}
      remaining
    </fbt>
  </TimeCard>
);

const TurnTimer = ({
  player,
  timeout,
}: {
  player: Player;
  timeout: number;
}) => {
  const relativeTime = useRelativeTime(timeout, getShortLocale(), dateNow);

  return timeout >= dateNow() ? (
    <TimeCard player={player}>
      <fbt desc="Turn timer with relative time, example: 'Turn ends in 15 seconds'">
        Turn ends <fbt:param name="relativeTime">{relativeTime}</fbt:param>
      </fbt>
    </TimeCard>
  ) : null;
};

export default function ReplayBar({
  actions,
  currentPlayer,
  currentViewer,
  inlineUI,
  replayState,
  timeout,
  timer,
}: {
  actions: Actions;
  currentPlayer: Player;
  currentViewer: PlayerID | null;
  inlineUI: boolean;
  replayState: ReplayState;
  timeout: number | null;
  timer: GameTimerValue;
}) {
  const { isLive, isPaused, isReplaying, isWaiting } = replayState;
  const isBot = currentPlayer.isBot();
  const icon = isPaused ? Pause : isBot ? Android : Live;
  const replayIsVisible =
    (isLive || isReplaying || isWaiting) && currentViewer !== currentPlayer.id;
  const hasTimeout = timeout != null && timeout >= dateNow();

  return (
    <ActionBar
      inlineUI={inlineUI}
      visible={replayIsVisible || (hasTimeout && !isBot)}
    >
      <Stack flex1 gap vertical>
        {hasTimeout && !isBot ? (
          isTimeBankTimer(timer) ? (
            <TimeBankRemainingTime player={currentPlayer} timeout={timeout} />
          ) : (
            <TurnTimer key={timeout} player={currentPlayer} timeout={timeout} />
          )
        ) : null}
        {replayIsVisible && (
          <Stack alignCenter nowrap stretch>
            {currentViewer !== currentPlayer.id ? (
              <span
                className={cx(
                  labelStyle,
                  !isPaused && replayLabelStyle,
                  isLive && replayLiveStyle,
                  isWaiting && waitingLabelStyle,
                )}
              >
                <Icon className={iconStyle} icon={icon} />
                {isPaused ? (
                  <fbt desc="Replay is paused">paused</fbt>
                ) : isLive ? (
                  isBot ? (
                    <fbt desc="Bot is moving">bot</fbt>
                  ) : (
                    <fbt desc="Game is live">live</fbt>
                  )
                ) : isWaiting ? (
                  <fbt desc="Game is waiting for actions">
                    waiting for player moves
                  </fbt>
                ) : isReplaying ? (
                  <fbt desc="Game is replaying">replay</fbt>
                ) : null}
              </span>
            ) : (
              <span />
            )}
            {isWaiting ? (
              currentViewer !== currentPlayer.id && !isBot ? (
                <InlineLink className={labelStyle} onClick={reload}>
                  <Icon icon={Reload} />
                  <fbt desc="Button to reload">reload</fbt>
                </InlineLink>
              ) : (
                <span />
              )
            ) : (
              <InlineLink
                className={labelStyle}
                onClick={() =>
                  replayState.isPaused
                    ? actions.resumeReplay()
                    : actions.pauseReplay()
                }
              >
                <Icon icon={replayState.isPaused ? Play : Pause} />
                {replayState.isPaused ? (
                  <fbt desc="Button to play">play</fbt>
                ) : (
                  <fbt desc="Button to pause">pause</fbt>
                )}
              </InlineLink>
            )}
          </Stack>
        )}
      </Stack>
    </ActionBar>
  );
}

const labelStyle = css`
  align-items: center;
  display: inline-flex;
  gap: 4px;

  & > svg {
    flex-shrink: 0;
    margin-top: 4px;
  }
`;

const iconStyle = css`
  flex-shrink: 0;
`;

const replayLabelStyle = css`
  color: ${getColor('green')};

  animation-name: ${keyframes`
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0.5;
    }
  `};
  animation-iteration-count: infinite;
  animation-direction: alternate;
  animation-timing-function: ease-in-out;
  animation-duration: 750ms;
`;

const waitingLabelStyle = css`
  color: ${getColor('orange')};
`;

const replayLiveStyle = css`
  color: ${applyVar('error-color')};
`;

const textStyle = css`
  text-align: center;
`;

const miniIconStyle = css`
  display: inline-block;
  margin-right: 4px;
  margin-top: -2px;
  vertical-align: top;
`;
