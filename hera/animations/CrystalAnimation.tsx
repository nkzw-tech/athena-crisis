import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, keyframes } from '@emotion/css';
import { useCallback, useEffect, useState } from 'react';
import { crystalToSound } from '../audio/Music.tsx';
import CrystalSprite from '../invasions/CrystalSprite.tsx';
import { Actions, StateToStateLike } from '../Types.tsx';

export default function CrystalAnimation({
  crystal,
  onComplete,
  onConvert,
  scale,
  update,
}: {
  crystal: Crystal;
  onComplete: () => void;
  onConvert: StateToStateLike;
  scale: number;
  update: Actions['update'];
}) {
  const [showCircle, setShowCircle] = useState(false);
  const complete = useCallback(() => {
    setShowCircle(true);
    const timer = setTimeout(() => update(onConvert), 750);
    return () => clearTimeout(timer);
  }, [onConvert, update]);

  useEffect(() => AudioPlayer.playSound(crystalToSound(crystal)), [crystal]);

  return (
    <Portal>
      <div className={crystalStyle}>
        {showCircle ? (
          <div className={circleStyle} onAnimationEnd={onComplete} />
        ) : (
          <div className={spriteStyle}>
            <CrystalSprite animate crystal={crystal} onComplete={complete} portal scale={scale} />
          </div>
        )}
      </div>
    </Portal>
  );
}

const crystalStyle = css`
  position: fixed;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  z-index: 3000;
`;

const spriteStyle = css`
  filter: drop-shadow(0 10px 10px #111);
`;

const circleStyle = css`
  animation: ${keyframes`
    0% {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0);
    }
    1% {
      opacity: 1;
    }
    80% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(300);
    }
    99% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(0);
    }
    100% {
      opacity: 0;
    }
  `} 1500ms forwards;

  transform-origin: center center;
  background-color: #111;
  border-radius: 50%;
  height: 10px;
  opacity: 0;
  width: 10px;
`;
