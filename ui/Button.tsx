import { Route } from '@deities/apollo/Routes.tsx';
import { css, cx } from '@emotion/css';
import {
  AnchorHTMLAttributes,
  memo,
  MutableRefObject,
  ReactNode,
  RefCallback,
  useCallback,
  useRef,
} from 'react';
import AudioPlayer from './AudioPlayer.tsx';
import clipBorder from './clipBorder.tsx';
import useActive from './controls/useActive.tsx';
import { applyVar } from './cssVar.tsx';
import useScrollIntoView from './hooks/useScrollIntoView.tsx';
import Link from './Link.tsx';
import pixelBorder from './pixelBorder.tsx';
import { PulseStyle } from './RainbowPulseStyle.tsx';

type OnClickFn = () => void;

export default memo(function Button({
  active,
  className: initialClassName,
  onClick,
  ref,
  selected,
  to,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> & {
  active?: boolean;
  children?: ReactNode;
  onClick?: OnClickFn;
  ref?:
    | RefCallback<HTMLAnchorElement>
    | MutableRefObject<HTMLAnchorElement | null>;
  selected?: boolean;
  to?: Route;
}) {
  const element = useRef<HTMLAnchorElement | null>(null);
  const click = useCallback(() => {
    AudioPlayer.playSound('UI/Accept');
    onClick?.();
  }, [onClick]);

  const setRefs = useCallback(
    (anchorElement: HTMLAnchorElement | null) => {
      if (typeof ref === 'function') {
        ref(anchorElement);
      } else if (ref) {
        ref.current = anchorElement;
      }
      element.current = anchorElement;
    },
    [ref],
  );

  useScrollIntoView(element, selected);
  useActive(active, click, to);

  const className = cx(
    'link',
    style,
    ButtonStyle,
    initialClassName,
    active && 'active',
    selected && 'hover',
    selected && PulseStyle,
  );

  return to ? (
    <Link
      className={className}
      onClick={click}
      ref={setRefs}
      to={to}
      {...props}
    />
  ) : (
    <a className={className} onClick={click} ref={ref} {...props} />
  );
});

export const SquareButtonStyle = css`
  -webkit-user-drag: none;
  cursor: pointer;
  user-select: none;

  transform: scale(1);
  transition:
    color 150ms ease,
    transform 150ms ease;

  &.hover,
  &:hover {
    transform: scale(1.05);
  }

  &.active,
  &:active {
    transform: scale(0.95);
  }

  &.active:hover {
    transform: scale(1);
  }
`;

export const ButtonStyle = css`
  -webkit-user-drag: none;
  cursor: pointer;
  user-select: none;

  transform: scaleX(1) scaleY(1);
  transition:
    box-shadow 150ms ease,
    color 150ms ease,
    transform 150ms ease;

  &.hover,
  &:hover {
    transform: scaleX(1.05) scaleY(1.02);
  }

  &.active,
  &:active {
    transform: scaleX(0.95) scaleY(0.98);
  }

  &.active:hover {
    transform: scaleX(1) scaleY(1);
  }
`;

const style = css`
  align-items: center;
  background: ${applyVar('background-color-light')};
  display: inline-flex;
  justify-content: center;
  line-height: 1.4em;
  min-height: 52px;
  min-width: 32px;
  padding: 4px 12px;
  text-align: center;

  &:not(.hover) {
    ${clipBorder()}
  }

  &.hover {
    ${pixelBorder(undefined, 2)}
  }

  &.hover,
  &:hover,
  &.active,
  &.active:hover {
    color: ${applyVar('text-color-active')};
  }
`;
