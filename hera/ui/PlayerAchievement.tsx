import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { css } from '@emotion/css';
import Stack from '@nkzw/stack';
import usePerformanceResult from '../hooks/usePerformanceResult.tsx';
import usePlayerAchievement from '../hooks/usePlayerAchievement.tsx';
import { PlayerAchievement as PlayerAchievementT } from '../Types.tsx';
import StarIcon from './StarIcon.tsx';

export default function PlayerAchievement({
  achievement: { legendary, result, stars },
}: {
  achievement: PlayerAchievementT;
}) {
  const [playerPerformance, count] = usePlayerAchievement(result);
  const performance = usePerformanceResult(playerPerformance);
  const displayedStars = stars + (legendary ? 1 : 0);
  const displayedCount = count === '?' ? count : Number(count) + (legendary ? 1 : 0);

  return (
    <Stack alignCenter center className={nowrapStyle} gap wrap>
      <Stack gap={4}>
        {performance.map(([type, achieved]) => (
          <StarIcon key={type} size="small" type={achieved ? 'achieved' : 'missed'} />
        ))}
        {legendary && <StarIcon key="legendary" size="small" type="chaos" />}
      </Stack>
      <div className={countStyle}>
        {displayedStars} <span className={lightStyle}>/ {displayedCount}</span>
      </div>
    </Stack>
  );
}

const lightStyle = css`
  color: ${applyVar('text-color-light')};
`;

const countStyle = css`
  text-align: right;
  white-space: nowrap;
  width: 60px;
`;

const nowrapStyle = css`
  ${Breakpoints.lg} {
    flex-wrap: nowrap !important;
  }
`;
