import { PlayerID } from '@deities/athena/map/Player.tsx';
import {
  evaluatePlayerPerformance,
  getPowerValue,
  getStyleValue,
  maybeDecodePlayerPerformance,
  PerformanceStyleComparators,
  PerformanceType,
} from '@deities/athena/map/PlayerPerformance.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx, keyframes } from '@emotion/css';
import Close from '@iconify-icons/pixelarticons/close.js';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import usePerformanceResult from '../hooks/usePerformanceResult.tsx';
import getTranslatedPerformanceStyleTypeName from '../lib/getTranslatedPerformanceStyleTypeName.tsx';
import getTranslatedPerformanceTypeName from '../lib/getTranslatedPerformanceTypeName.tsx';
import { PlayerAchievement } from '../Types.tsx';
import StarIcon from './StarIcon.tsx';

const starDuration = 1600;
const cardDuration = 800;

const Description = ({
  map,
  player,
  type: performanceType,
}: {
  map: MapData;
  player: PlayerID;
  type: PerformanceType;
}) => {
  const { pace, power, style } = map.config.performance;
  const { stats } = map.getPlayer(player);

  switch (performanceType) {
    case 'pace':
      if (pace != null) {
        return map.round <= pace ? (
          <fbt desc="Number of rounds">
            Won in <fbt:param name="rounds">{map.round}</fbt:param> of{' '}
            <fbt:param name="total">{pace}</fbt:param>{' '}
            <fbt:plural count={pace} many="rounds">
              round
            </fbt:plural>
          </fbt>
        ) : (
          <fbt desc="Number of rounds">
            Win in <fbt:param name="total">{pace}</fbt:param>{' '}
            <fbt:plural count={pace} many="rounds">
              round
            </fbt:plural>
          </fbt>
        );
      }
      break;
    case 'power':
      return (
        <Stack gap vertical>
          <div>
            <fbt desc="Achieved power metric">
              Achieved:{' '}
              <fbt:param name="power">
                {Math.round(getPowerValue(stats) * 100) / 100}
              </fbt:param>
            </fbt>
          </div>
          <div>
            <fbt desc="Required power metric">
              Required: <fbt:param name="expectedPower">{power}</fbt:param>
            </fbt>
          </div>
        </Stack>
      );
    case 'style': {
      if (style) {
        const [styleType, value] = style;
        return (
          <>
            {getTranslatedPerformanceStyleTypeName(styleType)}{' '}
            {getStyleValue(styleType, stats)}{' '}
            <span className={comparatorStyle}>
              {PerformanceStyleComparators[styleType]}
            </span>{' '}
            {value}
          </>
        );
      }
      break;
    }
    case 'bonus':
      return <fbt desc="Label for optional objective">Optional Objective</fbt>;
    default: {
      performanceType satisfies never;
      throw new UnknownTypeError('performance', performanceType);
    }
  }

  return null;
};

const Card = ({
  achieved,
  description,
  onComplete,
  type,
}: {
  achieved: boolean;
  description?: ReactNode;
  onComplete: () => void;
  type: PerformanceType;
}) => {
  const [isComplete, setIsComplete] = useState(false);
  return (
    <motion.div
      animate={{
        opacity: 1,
        x: 0,
      }}
      className={fullStyle}
      exit={{
        opacity: 0,
        x: '-100%',
      }}
      initial={{
        opacity: 0,
        x: '100%',
      }}
      onAnimationComplete={() => {
        if (!isComplete) {
          setTimeout(onComplete, starDuration);
          setIsComplete(true);
        }
      }}
      transition={{
        delay: (cardDuration * (isComplete ? 1 : 1.5)) / 1000,
        duration: cardDuration / 1000 / 2,
        ease: [0.34, 1.26, 0.64, 1],
      }}
    >
      <Stack
        alignCenter
        className={cx(fullStyle, innerStyle)}
        gap={24}
        nowrap
        stretch
      >
        <Stack gap vertical>
          <h2 className={textStyle}>
            {getTranslatedPerformanceTypeName(type)}
          </h2>
          {description && (
            <div
              className={cx(
                fadeStyle,
                descriptionStyle,
                type === 'bonus' && descriptionBonusStyle,
              )}
            >
              {description}
            </div>
          )}
        </Stack>
        <StarIcon
          achieved={achieved}
          className={achieved ? achievedAnimationStyle : missedAnimationStyle}
          starClassName={achieved ? achievedStarAnimationStyle : undefined}
        />
      </Stack>
    </motion.div>
  );
};

const SummaryCard = ({
  instant,
  onComplete,
  result,
}: {
  instant: boolean;
  onComplete: () => void;
  result: ReadonlyArray<readonly [PerformanceType, boolean]>;
}) => {
  return (
    <motion.div
      animate={{
        opacity: 1,
        x: 0,
      }}
      className={fullStyle}
      exit={{
        opacity: 0,
        x: '-100%',
      }}
      initial={{
        opacity: 0,
        x: '100%',
      }}
      onAnimationComplete={() =>
        setTimeout(() => onComplete(), starDuration * 1.5)
      }
      transition={{
        delay: instant ? 0 : (cardDuration * 1.5) / 1000,
        duration: instant ? 0 : cardDuration / 1000 / 2,
        ease: [0.34, 1.26, 0.64, 1],
      }}
    >
      <Stack
        alignCenter
        className={cx(fullStyle, summaryInnerStyle)}
        gap={24}
        nowrap
        stretch
      >
        <h2 className={textStyle}>
          <fbt desc="Label for summary headline">Summary</fbt>
        </h2>
        <Stack
          alignCenter
          center
          className={summaryStyle}
          flex1
          nowrap
          style={{
            [vars.set('results')]: result.length,
          }}
        >
          {result.map(([type, achieved]) => (
            <StarIcon
              achieved={achieved}
              className={cx(summaryStarStyle, instant && instantStyle)}
              key={type}
            />
          ))}
        </Stack>
      </Stack>
    </motion.div>
  );
};

export default function MapPerformanceMetrics({
  map,
  player,
  playerAchievement,
  scrollIntoView,
  zIndex,
}: {
  map: MapData;
  player: PlayerID;
  playerAchievement: PlayerAchievement | null;
  scrollIntoView: (vectors: ReadonlyArray<Vector>) => void;
  zIndex: number;
}) {
  const performance = evaluatePlayerPerformance(map, player);
  const [visibleCard, setVisibleCard] = useState<number>(0);
  const [isDone, setIsDone] = useState(false);
  const [wasHidden, setWasHidden] = useState(false);
  const [hide, setHide] = useState(false);
  const previousPlayerPerforamnce = maybeDecodePlayerPerformance(
    playerAchievement?.result,
  );
  const previousResult = usePerformanceResult(
    previousPlayerPerforamnce || null,
  );

  const showNextVisibleCard = useCallback(() => {
    setVisibleCard((visibleCard) => visibleCard + 1);
  }, []);

  const result = usePerformanceResult(performance);
  const cards = useMemo(
    () =>
      result.map(([type, achieved]) => (
        <Card
          achieved={achieved}
          description={<Description map={map} player={player} type={type} />}
          key={type}
          onComplete={showNextVisibleCard}
          type={type}
        />
      )),
    [map, player, result, showNextVisibleCard],
  );

  const center = vec(
    Math.floor(map.size.width / 2),
    Math.floor(map.size.height / 2),
  );
  useEffect(() => {
    if (cards.length) {
      scrollIntoView([center]);
    }
  }, [cards.length, center, scrollIntoView]);

  if (!cards.length) {
    return null;
  }

  const hasPreviousResult = !!(
    playerAchievement &&
    playerAchievement.stars <
      result.filter(([, achieved]) => achieved).length &&
    previousResult?.length
  );

  return (
    <motion.div
      animate={{
        opacity: 1,
        transform: 'scale(1)',
      }}
      className={cx(wrapperStyle, hide && wrapperHideStyle)}
      exit={{
        opacity: 0,
        transform: 'scale(0)',
      }}
      initial={{
        opacity: 0,
        transform: 'scale(0)',
      }}
      style={{
        transformOrigin: 'center center',
        zIndex: zIndex + 1,
      }}
      transition={{
        duration: cardDuration / 1000,
        ease: [0.34, 1.26, 0.64, 1],
      }}
    >
      <Box
        className={cx(fullStyle, mapPerformanceStyle)}
        style={{ zIndex: zIndex + 2 }}
        vertical
      >
        {hide ? (
          <>
            <Stack alignCenter center className={fadeStyle}>
              <InlineLink onClick={() => setHide(false)}>
                <fbt desc="Button to show a stats dialog">Show Stats</fbt>
              </InlineLink>
            </Stack>
          </>
        ) : (
          <>
            <AnimatePresence>
              {cards[visibleCard] || (
                <SummaryCard
                  instant={isDone}
                  onComplete={() => setIsDone(true)}
                  result={result}
                />
              )}
            </AnimatePresence>
            {isDone && (
              <>
                <InlineLink
                  className={cx(
                    fadeStyle,
                    hideButtonStyle,
                    hasPreviousResult && !wasHidden && delayHideButtonStyle,
                  )}
                  onClick={() => {
                    setWasHidden(true);
                    setHide(true);
                  }}
                >
                  <Icon icon={Close} />
                </InlineLink>
                {hasPreviousResult ? (
                  <Stack
                    alignCenter
                    center
                    className={cx(fadeStyle, bottomStyle)}
                    gap={16}
                  >
                    <div>
                      <fbt desc="Label for previous result">Previous Best</fbt>
                    </div>
                    <Stack>
                      {previousResult.map(([type, achieved]) => (
                        <StarIcon
                          achieved={achieved}
                          className={cx(
                            previousStarStyle,
                            wasHidden && instantStyle,
                          )}
                          key={type}
                          small
                        />
                      ))}
                    </Stack>
                  </Stack>
                ) : null}
              </>
            )}
          </>
        )}
      </Box>
    </motion.div>
  );
}

const vars = new CSSVariables<'results'>('mp');

const wrapperStyle = css`
  backdrop-filter: blur(4px);
  bottom: 45%;
  min-height: 192px;
  position: absolute;
  top: 35%;

  left: calc(50% - 240px);
  width: 480px;
  zoom: 0.8;
  ${Breakpoints.sm} {
    zoom: 1;
  }

  transition:
    top 300ms ease-in-out,
    bottom 300ms ease-in-out,
    min-height 300ms ease-in-out,
    height 300ms ease-in-out;
`;

const wrapperHideStyle = css`
  height: 42px;
  min-height: 42px;
  top: calc(100% + 72px);
`;

const mapPerformanceStyle = css`
  ${pixelBorder(applyVar('border-color-light'))}

  overflow: hidden;
`;

const fullStyle = css`
  position: absolute;
  inset: 0;
`;

const innerStyle = css`
  padding: 48px;
`;

const summaryInnerStyle = css`
  padding: 48px 32px 48px 48px;
`;

const textStyle = css`
  font-size: 1.4em;
`;

const achievedAnimationStyle = css`
  transform: scale(0);
  animation: ${keyframes`
    0% {
      transform: scale(0) rotate(0deg);
    }
    50% {
      transform: scale(0.5) rotate(0deg);
    }
    75% {
      transform: scale(0.75) rotate(30deg);
    }
    100% {
      transform: scale(1) rotate(0deg);
    }
  `} ${starDuration}ms 1 cubic-bezier(0.34, 1.67, 0.63, 1.1) ${starDuration}ms
    forwards;
`;

const achievedStarAnimationStyle = css`
  color: #ebebeb;
  animation: ${keyframes`
    0% {
      color: #ebebeb;
    }
    50% {
      color: #ebebeb;
    }
    75% {
      color: #e9b301;
    }
    100% {
      color: #e9b301;
    }
  `} ${starDuration}ms 1 cubic-bezier(0.34, 1.67, 0.63, 1.1) ${starDuration}ms
    forwards;
`;

const missedAnimationStyle = css`
  animation: ${keyframes`
    0% {
      opacity: 0;
      transform: scale(0);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  `} ${starDuration / 2}ms 1 cubic-bezier(0.34, 1.1, 0.64, 1) ${starDuration}ms
    forwards;
  color: #433612;
  opacity: 0;
  transform: scale(0);
`;

const summaryStyle = css`
  width: 144px;
  transform: translate3d(0, calc(-4.5% * ${vars.apply('results')} + 2%), 0);
`;

const summaryStarStyle = css`
  animation: ${keyframes`
    0% {
      opacity: 0;
      transform: translate3d(100%, 0, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  `} ${starDuration / 2}ms 1 cubic-bezier(0.34, 1.1, 0.64, 1) ${starDuration}ms
    forwards;

  opacity: 0;
  position: relative;
  transform: translade3d(100%, 0, 0);

  &:nth-child(2) {
    animation-delay: ${starDuration * 1.2}ms;
    margin-left: -60px;
    top: 12px;
  }

  &:nth-child(3) {
    animation-delay: ${starDuration * 1.4}ms;
    margin-left: -60px;
    top: 24px;
  }

  &:nth-child(4) {
    animation-delay: ${starDuration * 1.6}ms;
    margin-left: -60px;
    top: 36px;
  }
`;

const instantStyle = css`
  &:nth-child(1),
  &:nth-child(2),
  &:nth-child(3),
  &:nth-child(4) {
    animation-delay: 0ms;
    animation-duration: 0ms;
  }
`;

const fadeStyle = css`
  animation: ${keyframes`
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  `} ${starDuration / 2}ms 1 cubic-bezier(0.34, 1.1, 0.64, 1) 300ms forwards;
  opacity: 0;
`;

const hideButtonStyle = css`
  position: absolute;
  right: 8px;
  top: 8px;
  color: ${applyVar('text-color')};
`;

const delayHideButtonStyle = css`
  animation-delay: ${starDuration}ms;
`;

const descriptionStyle = css`
  animation-delay: ${cardDuration / 2 + starDuration * 1.2}ms;
`;

const descriptionBonusStyle = css`
  animation-delay: ${cardDuration / 2 + starDuration * 0.8}ms;
`;

const bottomStyle = css`
  animation-delay: 0;
  bottom: 12px;
  left: 0;
  position: absolute;
  right: 0;
`;

const comparatorStyle = css`
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 200;
  text-align: center;
  width: 16px;
`;

const previousStarStyle = css`
  animation: ${keyframes`
    0% {
      opacity: 0;
      transform: translate3d(100%, 0, 0);
    }
    100% {
      opacity: 1;
      transform: translate3d(0, 0, 0);
    }
  `} ${starDuration / 2}ms 1 cubic-bezier(0.34, 1.1, 0.64, 1) 0ms forwards;

  opacity: 0;
  position: relative;
  transform: translade3d(100%, 0, 0);

  &:nth-child(2) {
    animation-delay: ${starDuration * 0.2}ms;
    margin-left: -14px;
  }

  &:nth-child(3) {
    animation-delay: ${starDuration * 0.4}ms;
    margin-left: -14px;
  }

  &:nth-child(4) {
    animation-delay: ${starDuration * 0.6}ms;
    margin-left: -14px;
  }
`;
