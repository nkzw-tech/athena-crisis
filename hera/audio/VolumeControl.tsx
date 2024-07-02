import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import AudioPlayer, { AudioVolumeType } from '@deities/ui/AudioPlayer.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Volume1Icon from '@deities/ui/icons/Volume1.tsx';
import Volume2Icon from '@deities/ui/icons/Volume2.tsx';
import VolumeXIcon from '@deities/ui/icons/VolumeX.tsx';
import Slider from '@deities/ui/Slider.tsx';
import { css } from '@emotion/css';
import Volume3Icon from '@iconify-icons/pixelarticons/volume-3.js';
import { ChangeEvent, useCallback, useRef, useState } from 'react';

export default function VolumeControl({
  invert,
  menuIsOpen,
  showPauseButton = true,
  type = 'master',
}: {
  invert?: boolean;
  menuIsOpen?: boolean;
  showPauseButton?: boolean;
  type?: AudioVolumeType;
}) {
  const [isPaused, setIsPaused] = useState(() => AudioPlayer.isPaused());
  const [volume, _setVolume] = useState(() => AudioPlayer.getVolume(type));
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>();

  const setVolume = useCallback(
    (volume: number) => {
      _setVolume(volume);
      AudioPlayer.setVolume(type, volume);

      if (type === 'master' || type === 'music') {
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => AudioPlayer.resume(), 300);
      }

      if (showPauseButton) {
        setIsPaused(AudioPlayer.isPaused());
      }
    },
    [showPauseButton, type],
  );

  useInput(
    'info',
    useCallback(() => {
      if (menuIsOpen && type === 'master') {
        setVolume(volume - 0.1);
      }
    }, [menuIsOpen, setVolume, type, volume]),
    'top',
  );

  useInput(
    'detail',
    useCallback(() => {
      if (menuIsOpen && type === 'master') {
        setVolume(volume + 0.1);
      }
    }, [menuIsOpen, setVolume, type, volume]),
    'top',
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
            setIsPaused(AudioPlayer.isPaused());
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
