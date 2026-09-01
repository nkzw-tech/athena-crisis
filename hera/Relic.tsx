import { RogueRelic, RogueRelicLevel, RogueRelics } from '@deities/athena/info/RogueRelic.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';

const RelicSize = 32;

export default function Relic({ level, relic }: { level: RogueRelicLevel; relic: RogueRelic }) {
  return (
    <div className={relicContainer}>
      <div
        aria-hidden
        className={cx(relicIcon, level === 4 && legendaryRelicIcon)}
        style={{
          backgroundPositionX: `${RogueRelics.indexOf(relic) * -RelicSize}px`,
          [vars.set('level-color')]: RelicLevelColors[level],
        }}
      />
    </div>
  );
}

const vars = new CSSVariables<'level-color'>('r');

const RelicLevelColors: Readonly<Record<RogueRelicLevel, string>> = {
  1: `rgb(${applyVar('color-gray')})`,
  2: `rgb(${applyVar('color-blue')})`,
  3: `rgb(${applyVar('color-purple')})`,
  4: applyVar('color-gold'),
};

const relicContainer = css`
  align-items: center;
  display: flex;
  flex: 0 0 48px;
  height: 48px;
  justify-content: center;
  width: 48px;
`;

const relicIcon = css`
  background-image: url('${Sprites.Relics}');
  background-repeat: no-repeat;
  filter: drop-shadow(0 0 5px ${vars.apply('level-color')});
  height: ${RelicSize}px;
  image-rendering: pixelated;
  pointer-events: none;
  width: ${RelicSize}px;
`;

const legendaryRelicIcon = css`
  animation: ${keyframes`
    0%, 100% {
      filter: drop-shadow(0 0 4px ${vars.apply('level-color')});
    }
    50% {
      filter: drop-shadow(0 0 8px ${vars.apply('level-color')});
    }
  `}
    1.5s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;
