import { InputHTMLAttributes } from 'react';

export default function NumberInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'inputMode' | 'pattern' | 'type'>,
) {
  return <input inputMode="numeric" pattern="[0-9]*" type="text" {...props} />;
}
