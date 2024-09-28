import { Route } from '@deities/apollo/Routes.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import { useMatch, useResolvedPath } from 'react-router-dom';
import { applyVar } from './cssVar.tsx';
import Link, { LinkProps } from './Link.tsx';

export default memo(function ActiveLink({
  className,
  to,
  ...props
}: LinkProps & {
  to: Route;
}) {
  const match = useMatch({ end: true, path: useResolvedPath(to).pathname });
  return (
    <Link
      className={cx(match && highlightStyle, className)}
      to={to}
      {...props}
    />
  );
});

const highlightStyle = css`
  color: ${applyVar('text-color-active')};

  &:hover {
    text-decoration: none;
    color: ${applyVar('text-color-active')};
    text-shadow: none;
    background-color: transparent;
  }
`;
