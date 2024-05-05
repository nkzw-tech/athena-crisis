import { css, cx } from '@emotion/css';
import { InputHTMLAttributes, memo } from 'react';
import { applyVar } from './cssVar.tsx';
import pixelBorder from './pixelBorder.tsx';

export default memo(function Slider({
  className,
  invert,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invert?: boolean }) {
  return (
    <input
      className={cx(sliderStyle, invert && invertStyle, className)}
      {...props}
    />
  );
});

const sliderStyle = css`
  -webkit-user-drag: none;
  background: hsla(0, 0%, 0%, 0);
  box-shadow: none;
  display: block;
  margin: 0;
  padding: 1px 0;

  &:focus {
    box-shadow: none;
  }

  &::-webkit-slider-runnable-track {
    height: 3px;
    cursor: pointer;
    background: ${applyVar('text-color')};
  }

  &::-webkit-slider-thumb {
    ${pixelBorder(applyVar('text-color'), 2.5)}

    -webkit-appearance: none;
    background-color: ${applyVar('text-color-active-light')};
    cursor: pointer;
    height: 24px;
    margin-top: -11px;
    width: 16px;

    transform: scale(1);
    transition:
      background-color 150ms ease,
      transform 150ms ease;

    &:hover {
      background-color: ${applyVar('text-color-active-light')};
      transform: scale(1.1);
    }
  }

  &:focus::-webkit-slider-thumb {
    background-color: ${applyVar('text-color-light')};
  }
`;

const invertStyle = css`
  &::-webkit-slider-runnable-track {
    background: ${applyVar('text-color-light')};
  }

  &::-webkit-slider-thumb {
    ${pixelBorder(applyVar('background-color-dark'), 2)}

    background-color: ${applyVar('text-color')};
    &:hover {
      background-color: ${applyVar('text-color')};
    }
  }

  &:focus::-webkit-slider-thumb {
    background-color: ${applyVar('text-color-active-light')};
  }
`;
