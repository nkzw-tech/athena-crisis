import { DetailedHTMLProps, FormEvent, FormHTMLAttributes, memo } from 'react';

const preventDefault = (event: FormEvent) => event.preventDefault();

export default memo(function Form({
  onSubmit,
  ...props
}: DetailedHTMLProps<FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>) {
  return <form {...props} onSubmit={onSubmit || preventDefault} />;
});
