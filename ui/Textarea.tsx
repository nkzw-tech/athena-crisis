import { css, cx } from '@emotion/css';
import {
  DetailedHTMLProps,
  FocusEvent,
  memo,
  RefCallback,
  RefObject,
  TextareaHTMLAttributes,
  useCallback,
  useState,
} from 'react';
import { inputStyle, invalidStyle, validateStyle } from './Input.tsx';

type TextareaProps = Omit<
  DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>,
  'ref'
> & {
  invalid?: boolean;
  ref?: RefCallback<HTMLTextAreaElement> | RefObject<HTMLTextAreaElement | null>;
  validateOnBlur?: boolean;
};

export default memo(function Textarea({
  className,
  invalid,
  onBlur,
  ref,
  validateOnBlur = true,
  ...props
}: TextareaProps) {
  const [validate, setValidate] = useState(false);
  const handleBlur = useCallback(
    (event: FocusEvent<HTMLTextAreaElement>) => {
      if (validateOnBlur) {
        setValidate(true);
      }
      onBlur?.(event);
    },
    [onBlur, validateOnBlur],
  );

  return (
    <textarea
      {...props}
      className={cx(
        inputStyle,
        textareaStyle,
        validate && validateStyle,
        invalid && invalidStyle,
        className,
      )}
      onBlur={handleBlur}
      ref={ref}
    />
  );
});

const textareaStyle = css`
  overflow: auto;
  resize: none;
  vertical-align: top;
  width: 100%;
`;
