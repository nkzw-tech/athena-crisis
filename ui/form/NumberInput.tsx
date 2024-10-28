import { InputHTMLAttributes } from 'react';

export default function NumberInput(
  props: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>,
) {
  return <input type="number" {...props} />;
}
