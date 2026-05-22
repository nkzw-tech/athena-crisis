import { css, cx } from '@emotion/css';
import { ButtonHTMLAttributes, DetailedHTMLProps, memo, RefCallback, RefObject } from 'react';
import { applyVar } from './cssVar.tsx';
import getColor from './getColor.tsx';
import pixelBorder from './pixelBorder.tsx';

type FormButtonProps = Omit<
  DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>,
  'ref'
> & {
  ref?: RefCallback<HTMLButtonElement> | RefObject<HTMLButtonElement | null>;
};

export default memo(function FormButton({ className, ref, ...props }: FormButtonProps) {
  return <button {...props} className={cx(buttonStyle, className)} ref={ref} />;
});

const buttonStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)};

  -webkit-appearance: none;
  background: ${applyVar('background-color-light')};
  border-radius: 0;
  border: none;
  color: ${applyVar('text-color')};
  cursor: pointer;
  font-family: inherit;
  font-size: 1em;
  font-weight: normal;
  margin: 4px 0;
  outline: none;
  padding: 6px 8px;
  user-select: auto;
  vertical-align: baseline;
  width: fit-content;

  &:hover,
  &:focus,
  &:active {
    color: ${getColor('pink')};
  }

  &:focus,
  &.focus {
    ${pixelBorder(getColor('pink'), 2)}
  }

  &:active {
    margin-bottom: 2px;
    margin-top: 6px;
  }
`;
