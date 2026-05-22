import { InputHTMLAttributes } from 'react';
import Input from '../Input.tsx';

export default function NumberInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'inputMode' | 'pattern' | 'type'> & {
    invalid?: boolean;
    validateOnBlur?: boolean;
  },
) {
  return <Input inputMode="numeric" pattern="[0-9]*" type="text" {...props} />;
}
