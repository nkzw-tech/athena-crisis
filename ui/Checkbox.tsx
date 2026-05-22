import { css, cx } from '@emotion/css';
import { DetailedHTMLProps, InputHTMLAttributes, memo, RefCallback, RefObject } from 'react';
import { applyVar } from './cssVar.tsx';
import getColor from './getColor.tsx';
import pixelBorder from './pixelBorder.tsx';

type CheckboxProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'ref' | 'type'
> & {
  checkmark?: boolean;
  ref?: RefCallback<HTMLInputElement> | RefObject<HTMLInputElement | null>;
};

export default memo(function Checkbox({
  checkmark,
  className,
  disabled,
  ref,
  ...props
}: CheckboxProps) {
  return (
    <input
      {...props}
      className={cx(checkboxStyle, checkmark && checkmarkStyle, className)}
      disabled={disabled}
      ref={ref}
      type="checkbox"
    />
  );
});

const checkboxStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)};

  -webkit-appearance: none;
  background: ${applyVar('background-color-light')};
  border: none;
  border-radius: 0;
  color: ${applyVar('text-color')};
  cursor: pointer;
  font-family: inherit;
  height: 24px;
  line-height: initial;
  margin: 0;
  min-width: 24px;
  outline: none;
  padding: 0;
  position: relative;
  transform: scale(1);
  transition: transform 150ms ease;
  user-select: auto;
  vertical-align: middle;
  width: 24px;

  &:not(.disabled):not(:disabled):active {
    transform: scale(0.9);
  }

  &:before {
    color: rgba(0, 0, 0, 0);
    content: 'X';
    font-size: 28px;
    left: 2.1px;
    position: absolute;
    top: -6.1px;
    transition: color 350ms ease;
  }

  &:checked:before {
    color: ${applyVar('text-color')};
  }

  &:focus,
  &.focus {
    ${pixelBorder(getColor('pink'), 2)}
  }

  @media (hover: hover) {
    &:not(.disabled):not(:disabled):hover {
      transform: scale(1.1);
    }

    &:not(.disabled):not(:disabled):active {
      transform: scale(0.9);
    }

    &:hover:not(:checked):not(.disabled):not(:disabled):before {
      color: ${applyVar('text-color')};
      opacity: 0.35;
    }
  }
`;

const checkmarkStyle = css`
  &:before {
    content: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none'%3E%3Cpath fill='currentColor' fill-rule='evenodd' d='M18 6h2v2h-2V6Zm-2 4V8h2v2h-2Zm-2 2v-2h2v2h-2Zm-2 2h2v-2h-2v2Zm-2 2h2v-2h-2v2Zm-2 0v2h2v-2H8Zm-2-2h2v2H6v-2Zm0 0H4v-2h2v2Z' clip-rule='evenodd'/%3E%3C/svg%3E");
    left: 0;
    top: -3px;
  }

  @media (prefers-color-scheme: dark) {
    &:before {
      filter: invert(1);
    }
  }

  html.dark &:before {
    filter: invert(1);
  }
`;
