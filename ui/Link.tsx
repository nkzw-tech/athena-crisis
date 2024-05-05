import { Route } from '@deities/apollo/Routes.tsx';
import { ComponentProps, FC, Ref } from 'react';
import { Link } from 'react-router-dom';

export type LinkProps = Omit<ComponentProps<typeof Link>, 'to'> & {
  ref?: Ref<HTMLAnchorElement>;
  to: Route;
};

export default (process.env.IS_LANDING_PAGE
  ? function Link({ ref, to, ...props }: LinkProps) {
      return (
        <a
          href={`https://app.athenacrisis.com${to}`}
          ref={ref}
          rel="noreferrer"
          target="_blank"
          {...props}
        />
      );
    }
  : Link) as FC<LinkProps>;
