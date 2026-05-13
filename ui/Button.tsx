import { Route } from '@deities/apollo/Routes.tsx';
import { css, cx } from '@emotion/css';
import {
  AnchorHTMLAttributes,
  memo,
  ReactNode,
  RefCallback,
  RefObject,
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
import { PulseStyle } from './PulseStyle.tsx';

type OnClickFn = () => void;

export default memo(function Button({
  active,
  className: initialClassName,
  disabled,
  onClick,
  ref,
  selected,
  to,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'onClick'> & {
  active?: boolean;
  children?: ReactNode;
  disabled?: boolean;
  onClick?: OnClickFn;
  ref?: RefCallback<HTMLAnchorElement> | RefObject<HTMLAnchorElement | null>;
  selected?: boolean;
  to?: Route;
}) {
  const element = useRef<HTMLAnchorElement | null>(null);

  const click = useCallback(() => {
    if (!disabled) {
      AudioPlayer.playSound('UI/Accept');
      onClick?.();
    }
  }, [disabled, onClick]);

  const onActive = useCallback(() => {
    if (!disabled) {
      click();
      if (!to && props.href) {
        window.open(props.href);
      }
    }
  }, [click, disabled, props.href, to]);

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
  useActive(!disabled && active, onActive, to);

  const className = cx(
    'link',
    style,
    ButtonStyle,
    initialClassName,
    selected && 'hover',
    !active && selected && PulseStyle,
    active && 'active',
    disabled && disabledStyle,
    disabled && 'disabled',
  );

  return to && !disabled ? (
    <Link className={className} onClick={click} ref={setRefs} to={to} {...props} />
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

  &:not(.disabled).hover,
  &:not(.disabled):hover {
    transform: scale(1.05);
  }

  &:not(.disabled).active,
  &:not(.disabled):active {
    transform: scale(0.95);
  }

  &:not(.disabled).active:hover {
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

  &:not(.disabled).hover,
  &:not(.disabled):hover {
    transform: scaleX(1.05) scaleY(1.02);
  }

  &:not(.disabled).active,
  &:not(.disabled):active {
    transform: scaleX(0.95) scaleY(0.98);
  }

  &:not(.disabled).active:hover {
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

  &:not(.disabled).hover {
    ${pixelBorder(undefined, 2)}
  }

  &:not(.disabled).hover,
  &:not(.disabled):hover,
  &:not(.disabled).active,
  &:not(.disabled).active:hover {
    color: ${applyVar('text-color-active')};
  }
`;

const disabledStyle = css`
  color: ${applyVar('text-color-light')};
  opacity: 0.7;
`;
