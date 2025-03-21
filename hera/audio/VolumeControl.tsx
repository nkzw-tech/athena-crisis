import AudioPlayer, { AudioVolumeType } from '@deities/ui/AudioPlayer.tsx';
import { InputLayer } from '@deities/ui/controls/Input.tsx';
import { NativeTimeout } from '@deities/ui/controls/throttle.tsx';
import { useOptionalInput } from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Volume1Icon from '@deities/ui/icons/Volume1.tsx';
import Volume2Icon from '@deities/ui/icons/Volume2.tsx';
import VolumeXIcon from '@deities/ui/icons/VolumeX.tsx';
import Slider from '@deities/ui/Slider.tsx';
import { css } from '@emotion/css';
import Volume3Icon from '@iconify-icons/pixelarticons/volume-3.js';
import parseInteger from '@nkzw/core/parseInteger.js';
import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

export default function VolumeControl({
  enableInputControls,
  invert,
  layer,
  showPauseButton = true,
  type = 'master',
}: {
  enableInputControls?: boolean;
  invert?: boolean;
  layer?: InputLayer;
  showPauseButton?: boolean;
  type?: AudioVolumeType;
}) {
  const [volume, _setVolume] = useState(() => AudioPlayer.getVolume(type));
  const [isPaused, setPaused] = useState(AudioPlayer.isPaused());
  const timerRef = useRef<NativeTimeout>(null);

  // eslint-disable-next-line react-compiler/react-compiler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const audioPlayerIsPaused = AudioPlayer.isPaused();
    if (isPaused != audioPlayerIsPaused) {
      setPaused(audioPlayerIsPaused);
    }
  }, undefined);

  const setVolume = useCallback(
    (volume: number) => {
      _setVolume(volume);
      AudioPlayer.setVolume(type, volume);

      if (type === 'master' || type === 'music') {
        if (timerRef.current != null) {
          clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => AudioPlayer.resume(), 300);
      }
    },
    [type],
  );

  useOptionalInput(
    'navigate',
    useCallback(
      ({ detail: { x } }) => {
        if (enableInputControls) {
          if (x === -1) {
            setVolume(volume - 0.1);
          } else if (x === 1) {
            setVolume(volume + 0.1);
          }
        }
      },
      [enableInputControls, setVolume, volume],
    ),
    !!enableInputControls,
    layer || 'menu',
  );

  return (
    <div className={volumeControllerStyle}>
      {showPauseButton && (
        <Icon
          button
          className={iconStyle}
          icon={
            volume <= 0.01 || isPaused
              ? VolumeXIcon
              : volume <= 0.33
                ? Volume1Icon
                : volume <= 0.66
                  ? Volume2Icon
                  : Volume3Icon
          }
          onClick={() => {
            AudioPlayer.togglePause();
            setPaused(() => AudioPlayer.isPaused());
          }}
        />
      )}
      <Slider
        className={sliderStyle}
        invert={invert}
        max="100"
        min="0"
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          const volume = parseInteger(event.target.value);
          if (volume != null) {
            setVolume(volume / 100);
          }
        }}
        type="range"
        value={volume * 100}
      />
    </div>
  );
}

const volumeControllerStyle = css`
  align-items: center;
  display: flex;
  justify-content: center;
  margin: 0 8px 0;
`;

const sliderStyle = css`
  height: 18px;
`;

const iconStyle = css`
  margin: 0 8px 0 0;
  width: 33px;
  height: 33px;

  &:hover {
    color: ${applyVar('text-color-active')};
  }
`;
