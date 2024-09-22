import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import { CSSVariables } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx, keyframes } from '@emotion/css';
import { MouseEvent } from 'react';
import CrystalSprite from '../invasions/CrystalSprite.tsx';
import crystalToColor from '../invasions/crystalToColor.tsx';

export default function CrystalIcon({
  active,
  animate,
  crystal,
  onClick,
}: {
  active?: boolean;
  animate: boolean;
  crystal: Crystal;
  onClick?: (event: MouseEvent) => void;
}) {
  const isInteractive = !!onClick;
  return (
    <div
      className={cx(
        crystalStyle,
        isInteractive && SquareButtonStyle,
        active && activeStyle,
      )}
      style={{
        [vars.set('background-color')]: crystalToColor(crystal, 0.3),
        [vars.set('color')]: crystalToColor(crystal),
      }}
    >
      <div
        className={cx(
          innerCrystalStyle,
          additionalStyles[crystal as unknown as keyof typeof additionalStyles],
        )}
        onClick={onClick}
      >
        <CrystalSprite animate={animate} crystal={crystal} scale={1} />
      </div>
    </div>
  );
}

const vars = new CSSVariables<'background-color' | 'color'>('ci');

const crystalStyle = css`
  ${pixelBorder(vars.apply('color'), 2)}

  background-color: ${vars.apply('background-color')};
  height: 24px;
  position: relative;
  width: 24px;
`;

const activeStyle = css`
  animation: ${keyframes`
    0%, 100% {
      ${pixelBorder(vars.apply('color'), 2)}
    }
    50% {
      ${pixelBorder(vars.apply('background-color'), 2)}
    }
    75% {
      ${pixelBorder(vars.apply('color'), 3)}
    }
  `} 4s infinite;
`;

const innerCrystalStyle = css`
  left: 0;
  position: absolute;
  top: -2px;
`;

const additionalStyles = {
  [Crystal.Power]: css`
    top: -3px;
    left: -2px;
  `,
  [Crystal.Help]: css`
    top: -1px;
  `,
  [Crystal.Super]: css`
    top: -3px;
  `,
};
