import { css, cx } from '@emotion/css';
import {
  DetailedHTMLProps,
  InputHTMLAttributes,
  memo,
  MouseEvent,
  useRef,
} from 'react';

export default memo(function ClearableInput({
  className,
  hidden,
  onClear,
  ...props
}: DetailedHTMLProps<
  InputHTMLAttributes<HTMLInputElement>,
  HTMLInputElement
> & { hidden?: boolean; onClear?: () => string }) {
  const ref = useRef<HTMLInputElement | null>(null);
  return (
    <div className={containerStyle}>
      <input {...props} className={cx(clearableStyle, className)} ref={ref} />
      <div
        className={cx(buttonStyle, hidden && hiddenStyle)}
        onClick={(event) => {
          if (ref.current) {
            ref.current.value = onClear?.() || '';
            props.onChange?.({
              ...(event as MouseEvent<HTMLInputElement>),
              target: ref.current,
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
