import type { DetailedHTMLProps, FormHTMLAttributes } from 'react';
import { memo, useEffect, useRef } from 'react';

export default memo(function Form(
  props: DetailedHTMLProps<
    FormHTMLAttributes<HTMLFormElement>,
    HTMLFormElement
  >,
) {
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const form = formRef.current;
    if (form) {
      const listener = (event: FocusEvent) => {
        (event.target as HTMLElement)?.classList.add('validate');
      };
      form.addEventListener('blur', listener, true);
      return () => form.removeEventListener('blur', listener, true);
    }
  });
  return <form ref={formRef} {...props} />;
});
