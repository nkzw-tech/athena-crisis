import { Route } from '@deities/apollo/Routes.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { BoxStyle } from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import useActive from '@deities/ui/controls/useActive.tsx';
import cssVar, { applyVar } from '@deities/ui/cssVar.tsx';
import getColor, { BaseColor } from '@deities/ui/getColor.tsx';
import { UsePressProps } from '@deities/ui/hooks/usePress.tsx';
import useScrollIntoView from '@deities/ui/hooks/useScrollIntoView.tsx';
import Link, { LinkProps } from '@deities/ui/Link.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';
import { Sprites } from 'athena-crisis:images';
import { memo, useCallback, useMemo, useRef } from 'react';

export type ModeSelectButtonProps = Omit<
  LinkProps,
  'color' | 'onClick' | 'to'
> &
  Partial<UsePressProps> & {
    active?: boolean;
    blur?: boolean;
    color?: BaseColor;
    colorfulDisabled?: boolean;
    disabled?: boolean;
    highlight?: boolean;
    onClick?: () => void;
    scaleDisabled?: boolean;
    selected?: boolean;
    size?: 'small' | 'medium' | 'large';
    to?: Route;
    wide?: true;
  };

export function useModeSelectButton({
  active,
  blur,
  className,
  color,
  colorfulDisabled,
  disabled,
  highlight,
  onClick,
  scaleDisabled,
  selected,
  size = 'large',
  wide,
  ...props
}: ModeSelectButtonProps) {
  const click = useCallback(() => {
    AudioPlayer.playSound('UI/Accept');
    onClick?.();
  }, [onClick]);

  return useMemo(
    () => ({
      ...props,
      className: cx(
        BoxStyle,
        style,
        className,
        blur && blurStyle,
        size === 'medium' && mediumStyle,
        size === 'large' && largeStyle,
        wide && wideStyle,
        disabled && disabledStyle,
        disabled && 'disabled',
        scaleDisabled && 'scale-disabled',
        selected && 'hover',
        active && 'active',
        highlight && 'highlight',
      ),
      onClick: disabled ? undefined : click,
      style:
        color != null
          ? {
              [cssVar('highlight-color')]: getColor(
                disabled && !colorfulDisabled ? 'neutral' : color,
                disabled && colorfulDisabled ? 0.6 : 1,
              ),
            }
          : undefined,
    }),
    [
      active,
      blur,
      className,
      click,
      color,
      colorfulDisabled,
      disabled,
      highlight,
      props,
      scaleDisabled,
      selected,
      size,
      wide,
    ],
  );
}

export default memo(function ModeSelectButton(allProps: ModeSelectButtonProps) {
  const { active, disabled, selected, to } = allProps;
  const element = useRef<HTMLAnchorElement>(null);
  const props = useModeSelectButton(allProps);

  useScrollIntoView(element, selected);
  useActive(!disabled && active, props?.onClick, to);

  return to ? (
    <Link ref={element} to={to} {...props} />
  ) : (
    <a ref={element} {...props} />
  );
});

const style = css`
  -webkit-user-drag: none;
  align-items: center;
  display: inline-flex;
  text-align: center;
  text-wrap: balance;
  justify-content: center;
  overflow: hidden;
  padding-bottom: 4px;
  position: relative;
  transform: scaleX(1) scaleY(1);
  transition:
    transform 300ms ease,
    color 300ms ease;
  z-index: 0;

  ${pixelBorder(undefined, 2)}
  clip-path: inset(-2px -2px -2px -2px);
  font-size: 1em;
  height: 2.3em;
  width: 250px;

  &:after {
    background: ${applyVar('highlight-color')};
    content: '';
    height: 0;
    left: 50%;
    mask-image: url('${Sprites.Noise}'),
      linear-gradient(
        to bottom right,
        rgba(0, 0, 0, 0.7) 0%,
        rgba(0, 0, 0, 0.7) 50%
      );
    mask-position: center center;
    opacity: 0;
    position: absolute;
    top: 50%;
    transform: translateX(-50%) translateY(-50%) rotate(-45deg);
    transition:
      height 300ms ease,
      opacity 300ms ease;
    width: 100%;
    z-index: -1;
  }

  & svg {
    margin: 2px 8px 0 0;
  }

  &:not(.disabled):not(.scale-disabled) {
    &.hover,
    &:hover,
    &:active {
      color: ${applyVar('text-color-bright')};
      transform: scaleX(1.05) scaleY(1.02);
    }

    &.active,
    &:active {
      transform: scaleX(0.95) scaleY(0.98);
    }

    &.hover:after,
    &:hover:after {
      opacity: 1;

      height: 340%;
      ${Breakpoints.xs} {
        height: 280%;
      }

      ${Breakpoints.sm} {
        height: 300%;
      }
    }

    &.active:after,
    &:active:after {
      height: 400%;
      opacity: 1;
    }
  }

  &:not(.disabled).highlight {
    color: ${applyVar('text-color-bright')};
    &:after {
      opacity: 1;
      height: 700%;
    }
  }
`;

const mediumStyle = css`
  ${Breakpoints.xs} {
    font-size: 1.3em;
    height: 2.4em;
    width: 340px;
  }

  ${Breakpoints.sm} {
    ${pixelBorder()}

    clip-path: inset(-3px -3px -3px -3px);
    font-size: 1.4em;
    width: 380px;
  }
`;

const largeStyle = css`
  ${Breakpoints.xs} {
    font-size: 1.3em;
    height: 2.4em;
    width: 340px;
  }

  ${Breakpoints.sm} {
    ${pixelBorder()}

    clip-path: inset(-4px -4px -4px -4px);
    font-size: 1.7em;
    width: 420px;
  }
`;

const wideStyle = css`
  line-height: 1.6em;
  text-wrap: balance;

  &:not(.disabled):not(.scale-disabled) {
    &.hover:after,
    &:hover:after {
      height: 14em;
    }

    &.active:after,
    &:active:after {
      height: 18em;
    }

    &.highlight:after {
      height: 22em;
    }
  }

  font-size: 1em;
  height: auto;
  max-width: 220px;
  padding: 8px;

  ${Breakpoints.xs} {
    font-size: 1.2em;
    height: auto;
    max-width: 480px;
    padding: 16px;
  }

  ${Breakpoints.sm} {
    ${pixelBorder(undefined, 2)}
    clip-path: inset(-2px -2px -2px -2px);
    width: 480px;
  }
`;

const disabledStyle = css`
  ${pixelBorder(applyVar('border-color-light'), 2)}

  ${Breakpoints.sm} {
    ${pixelBorder(applyVar('border-color-light'))}
  }
`;

const blurStyle = css`
  backdrop-filter: blur(4px);
`;
