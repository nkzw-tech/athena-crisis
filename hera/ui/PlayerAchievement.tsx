import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { css } from '@emotion/css';
import Stack from '@nkzw/stack';
import usePerformanceResult from '../hooks/usePerformanceResult.tsx';
import usePlayerAchievement from '../hooks/usePlayerAchievement.tsx';
import { PlayerAchievement as PlayerAchievementT } from '../Types.tsx';
import StarIcon from './StarIcon.tsx';

export default function PlayerAchievement({
  achievement: { result, stars },
}: {
  achievement: PlayerAchievementT;
}) {
  const [playerPerformance, count] = usePlayerAchievement(result);
  const performance = usePerformanceResult(playerPerformance);
  return (
    <Stack alignCenter center className={nowrapStyle} gap wrap>
      <Stack between gap={4} wrap>
        {performance.map(([type, achieved]) => (
          <StarIcon
            key={type}
            size="small"
            type={achieved ? 'achieved' : 'missed'}
          />
        ))}
      </Stack>
      <div className={countStyle}>
        {stars} <span className={lightStyle}>/ {count}</span>
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
    flex-wrap: nowrap;
  }
`;
