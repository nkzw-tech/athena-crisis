import { css, cx } from '@emotion/css';
import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  memo,
  MouseEvent,
  RefObject,
  useRef,
} from 'react';

export default memo(function ClearableInput({
  className,
  hidden,
  onClear,
  ref,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & {
  hidden?: boolean;
  onClear?: () => string;
  ref?: RefObject<HTMLInputElement | null>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <div className={containerStyle}>
      <input
        {...props}
        className={cx(clearableStyle, className)}
        ref={(element) => {
          inputRef.current = element;
          if (typeof ref === 'function') {
            ref(element);
          } else if (ref && typeof ref !== 'string') {
            ref.current = element;
          }
        }}
      />
      <div
        className={cx(buttonStyle, hidden && hiddenStyle)}
        onClick={(event) => {
          if (inputRef.current) {
            inputRef.current.value = onClear?.() || '';
            props.onChange?.({
              ...(event as MouseEvent<HTMLInputElement>),
              target: inputRef.current,
            });
          }
        }}
      >
        X
      </div>
    </div>
  );
});

const containerStyle = css`
  display: inline-block;
  position: relative;
`;

const clearableStyle = css`
  padding-right: 32px;
`;

const buttonStyle = css`
  bottom: 0;
  cursor: pointer;
  padding: 11.5px 8px;
  position: absolute;
  right: 0;
  top: 0;
  transform: scale(1);
  transition: transform 200ms ease-in-out;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const hiddenStyle = css`
  display: none;
`;
