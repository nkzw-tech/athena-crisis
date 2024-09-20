import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import convertBiome from '@deities/athena/lib/convertBiome.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { css, keyframes } from '@emotion/css';
import { useCallback, useState } from 'react';
import CrystalSprite from '../invasions/CrystalSprite.tsx';
import { Actions } from '../Types.tsx';

export default function CrystalAnimation({
  biome,
  crystal,
  onComplete,
  scale,
  update,
}: {
  biome?: Biome;
  crystal: Crystal;
  onComplete: () => void;
  scale: number;
  update: Actions['update'];
}) {
  const [showCircle, setShowCircle] = useState(false);
  const complete = useCallback(() => {
    setShowCircle(true);

    if (biome != null) {
      const timer = setTimeout(
        () => update((state) => ({ map: convertBiome(state.map, biome) })),
        750,
      );
      return () => clearTimeout(timer);
    }
  }, [biome, update]);

  return (
    <Portal>
      <div className={crystalStyle}>
        {showCircle ? (
          <div className={circleStyle} onAnimationEnd={onComplete} />
        ) : (
          <div className={spriteStyle}>
            <CrystalSprite
              animate
              crystal={crystal}
              onComplete={complete}
              portal
              scale={scale}
            />
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
