import { css, cx } from '@emotion/css';
import {
  DetailedHTMLProps,
  FocusEvent,
  InputHTMLAttributes,
  memo,
  RefCallback,
  RefObject,
  useCallback,
  useState,
} from 'react';
import { applyVar } from './cssVar.tsx';
import getColor from './getColor.tsx';
import pixelBorder from './pixelBorder.tsx';

type InputProps = Omit<
  DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'ref'
> & {
  invalid?: boolean;
  ref?: RefCallback<HTMLInputElement> | RefObject<HTMLInputElement | null>;
  validateOnBlur?: boolean;
};

export default memo(function Input({
  className,
  invalid,
  onBlur,
  ref,
  type,
  validateOnBlur = true,
  ...props
}: InputProps) {
  const [validate, setValidate] = useState(false);
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLInputElement>) => {
      if (validateOnBlur) {
        setValidate(true);
      }
      onBlur?.(event);
    },
    [onBlur, validateOnBlur],
  );

  return (
    <input
      {...props}
      className={
        type === 'hidden'
          ? className
          : cx(inputStyle, validate && validateStyle, invalid && invalidStyle, className)
      }
      onBlur={handleBlur}
      ref={ref}
      type={type}
    />
  );
});

export const inputStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)};

  -webkit-appearance: none;
  background: ${applyVar('background-color-light')};
  border-radius: 0;
  border: none;
  color: ${applyVar('text-color')};
  font-family: inherit;
  font-size: 1em;
  font-weight: normal;
  margin: 4px 0;
  outline: none;
  padding: 6px 8px;
  user-select: auto;
  vertical-align: baseline;

  &:focus,
  &.focus {
    ${pixelBorder(getColor('pink'), 2)}
  }

  &::-webkit-input-placeholder {
    color: #a2a2a2;
  }
`;

export const invalidStyle = css`
  ${pixelBorder('#e06068')};
`;

export const validateStyle = css`
  &:invalid {
    ${pixelBorder('#e06068')};
  }
`;
