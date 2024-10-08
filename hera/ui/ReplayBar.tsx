import Player, { PlayerID } from '@deities/athena/map/Player.tsx';
import dateNow from '@deities/hephaestus/dateNow.tsx';
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
import useRelativeTime from '@nkzw/use-relative-time';
import { getShortLocale } from '../i18n/getLocale.tsx';
import { Actions, ReplayState } from '../Types.tsx';
import ActionBar from './ActionBar.tsx';
import MiniPlayerIcon from './MiniPlayerIcon.tsx';

const TurnTimer = ({
  player,
  timeout,
}: {
  player: PlayerID;
  timeout: number;
}) => {
  const relativeTime = useRelativeTime(timeout, getShortLocale(), dateNow);

  return timeout < dateNow() ? null : (
    <Stack alignCenter center flex1 gap nowrap>
      <span className={textStyle}>
        <div className={miniIconStyle}>
          <MiniPlayerIcon gap id={player} />
        </div>{' '}
        <fbt desc="Turn timer with relative time, example: 'Turn ends in 15 seconds'">
          Turn ends <fbt:param name="relativeTime">{relativeTime}</fbt:param>
        </fbt>
      </span>
    </Stack>
  );
};

export default function ReplayBar({
  actions,
  currentPlayer,
  currentViewer,
  inlineUI,
  replayState,
  timeout,
}: {
  actions: Actions;
  currentPlayer: Player;
  currentViewer: PlayerID | null;
  inlineUI: boolean;
  replayState: ReplayState;
  timeout: number | null;
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
          <TurnTimer player={currentPlayer.id} timeout={timeout} />
        ) : null}
        {replayIsVisible && (
          <Stack alignCenter stretch>
            {currentViewer !== currentPlayer.id ? (
              <span
                className={cx(
                  labelStyle,
                  !isPaused && replayLabelStyle,
                  isLive && replayLiveStyle,
                  isWaiting && waitingLabelStyle,
                )}
              >
                <Icon icon={icon} />
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
            {!replayState.isWaiting ? (
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
            ) : (
              <span />
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
    margin-top: 4px;
  }
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
  margin-top: -2px;
  vertical-align: top;
`;
