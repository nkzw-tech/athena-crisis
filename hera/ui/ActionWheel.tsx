import type { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import { Charge, TileSize } from '@deities/athena/map/Configuration.tsx';
import vec from '@deities/athena/map/vec.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import { BoxStyle } from '@deities/ui/Box.tsx';
import { isIPhone } from '@deities/ui/Browser.tsx';
import type { NavigationDirection } from '@deities/ui/controls/Input.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import cssVar, { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import ellipsis from '@deities/ui/ellipsis.tsx';
import type { BaseColor } from '@deities/ui/getColor.tsx';
import getColor from '@deities/ui/getColor.tsx';
import type { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import usePress from '@deities/ui/hooks/usePress.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Crosshair from '@deities/ui/icons/Crosshair.tsx';
import DropUnit from '@deities/ui/icons/DropUnit.tsx';
import Fold from '@deities/ui/icons/Fold.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Rescue from '@deities/ui/icons/Rescue.tsx';
import Sabotage from '@deities/ui/icons/Sabotage.tsx';
import StopCapture from '@deities/ui/icons/StopCapture.tsx';
import Supply from '@deities/ui/icons/Supply.tsx';
import Track from '@deities/ui/icons/Track.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import ChargeIcon from '@iconify-icons/pixelarticons/ac.js';
import Buildings from '@iconify-icons/pixelarticons/buildings.js';
import Complete from '@iconify-icons/pixelarticons/clock.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import Flag from '@iconify-icons/pixelarticons/flag.js';
import Unfold from '@iconify-icons/pixelarticons/flatten.js';
import Load from '@iconify-icons/pixelarticons/login.js';
import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { resetBehavior } from '../behavior/Behavior.tsx';
import type { ClientCoordinates } from '../lib/toTransformOrigin.tsx';
import Tick from '../Tick.tsx';
import type { Actions } from '../Types.tsx';
import getClientCoordinates from './lib/getClientCoordinates.tsx';

export default function ActionWheel({
  actions: { resetPosition, scrollIntoView },
  animationConfig,
  children,
  color,
  entityCount,
  position,
  tileSize,
  zIndex,
}: {
  actions: Actions;
  animationConfig?: AnimationConfig;
  children: ReactNode;
  color: BaseColor;
  entityCount?: number;
  position: Vector;
  tileSize: number;
  zIndex: number;
}) {
  const hasEntities = entityCount && entityCount > 0;
  // Arrangements look more organized if we even out the number of entries.
  const count = hasEntities
    ? entityCount < 4
      ? 4
      : entityCount + (entityCount % 2)
    : 0;
  const [paused, setPaused] = useState(true);

  useEffect(() => {
    if (hasEntities) {
      scrollIntoView([position]);
    }
  }, [hasEntities, position, scrollIntoView]);

  const translate = hasEntities
    ? `translate3d(${vars.apply('x')}, ${vars.apply('y')}, 0) `
    : '';
  return (
    <motion.div
      animate={{
        opacity: 1,
        transform: `${translate}scale(1)`,
      }}
      className={cx(style, hasEntities ? radiusStyle : null)}
      initial={{
        opacity: 0,
        transform: `${translate}scale(0)`,
      }}
      key={String(position)}
      onAnimationComplete={() => setPaused(false)}
      onAnimationStart={() => setPaused(true)}
      onMouseEnter={resetPosition}
      style={{
        [cssVar('highlight-color')]: getColor(color),
        [vars.set('count')]: count,
        [vars.set('offset')]: count > 4 ? 2 : 1,
        [vars.set('tan')]: hasEntities
          ? Math.tan(Math.PI / Math.max(5, count)).toFixed(2)
          : undefined,
        left: (position.x - 2) * tileSize,
        top: (position.y - 2) * tileSize,
        zIndex,
        ...(hasEntities
          ? {
              [vars.set('radius-size')]:
                count === 9 ? 1.5 : count > 7 ? 1.45 : 1.6,
            }
          : null),
      }}
      transition={{
        duration: 0.3,
        ease: [0.34, 1.56, 0.64, 1],
      }}
    >
      {hasEntities && animationConfig ? (
        <Tick animationConfig={animationConfig} paused={paused}>
          {children}
        </Tick>
      ) : (
        children
      )}
    </motion.div>
  );
}

const icons = {
  attack: Crosshair,
  capture: Flag,
  close: Close,
  complete: Complete,
  confirm: DropUnit,
  createBuildings: Buildings,
  createTracks: Track,
  drop: DropUnit,
  fold: Fold,
  heal: Heart,
  load: Load,
  rescue: Rescue,
  sabotage: Sabotage,
  stopCapture: StopCapture,
  supply: Supply,
  unfold: Unfold,
} as const;

export type ActionButtonType = keyof typeof icons;

export function ActionButton({
  type,
  icon = type,
  navigationDirection,
  onClick,
  hasShift,
  shift,
}: {
  hasShift?: boolean;
  icon?: ActionButtonType;
  navigationDirection: NavigationDirection | null;
  onClick: () => void;
  shift?: boolean;
  type: ActionButtonType;
}) {
  const matchesDirection =
    navigationPositions[type].equals(navigationDirection);
  const matchesPrevious =
    navigationDirection?.previousX != null &&
    navigationDirection?.previousY != null &&
    navigationPositions[type].equals({
      x: navigationDirection?.previousX || 0,
      y: navigationDirection?.previousY || 0,
    });

  const highlight =
    matchesDirection &&
    ((!shift && (!matchesPrevious || !hasShift)) || (matchesPrevious && shift));

  const click = useCallback(() => {
    AudioPlayer.playSound('UI/Accept');
    onClick();
  }, [onClick]);

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (highlight) {
          event.preventDefault();
          click();
        }
      },
      [highlight, click],
    ),
    'menu',
  );

  return (
    <a
      className={cx(
        itemStyle,
        positions[type],
        highlight && 'highlight',
        shift && 'shift',
      )}
      onClick={click}
    >
      <div className={cx(BoxStyle, iconStyle)}>
        <Icon
          className={
            type === 'drop'
              ? dropUnitStyle
              : type === 'complete'
                ? completeUnitStyle
                : undefined
          }
          height={`${iconSize}px`}
          horizontalFlip={type === 'load'}
          icon={icons[icon]}
          width={`${iconSize}px`}
        />
      </div>
    </a>
  );
}

const cancelAction = ({ update }: Actions) => update(resetBehavior());

export const CancelActionButton = ({
  actions,
  navigationDirection,
}: {
  actions: Actions;
  navigationDirection: NavigationDirection | null;
}) => (
  <ActionButton
    navigationDirection={navigationDirection}
    onClick={() => cancelAction(actions)}
    type="close"
  />
);

const smallCircle = [vec(0, -1), vec(1, 0), vec(0, 1), vec(-1, 0)];
const largeCircle = [
  vec(0, -1),
  vec(1, -1),
  vec(1, 0),
  vec(1, 1),
  vec(0, 1),
  vec(-1, 1),
  vec(-1, 0),
  vec(-1, -1),
];

const isHighlighted = (
  count: number,
  position: number,
  navigationDirection: NavigationDirection | null,
) => {
  if (!navigationDirection) {
    return false;
  }

  if (
    (count > 4 ? largeCircle : smallCircle)
      .at(position)
      ?.equals(navigationDirection)
  ) {
    return true;
  }

  // Allow nearby vectors to match too.
  if (count === 5 || count === 6) {
    if (position === 0) {
      return vec(-1, -1).equals(navigationDirection);
    } else if (position === count - 1) {
      return vec(-1, count === 5 ? 1 : 0).equals(navigationDirection);
    }
  }

  return false;
};

export function LargeActionButton({
  detail,
  disabled,
  entityCount,
  icon,
  navigationDirection,
  onClick,
  onLongPress: initialOnLongPress,
  position,
}: {
  detail: ReactNode;
  disabled?: boolean;
  entityCount: number;
  icon: (highlight: boolean, { className }: { className: string }) => ReactNode;
  navigationDirection: NavigationDirection | null;
  onClick: () => void;
  onLongPress?: (
    event: LongPressReactEvents<Element> | ClientCoordinates,
  ) => void;
  position: number;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const onLongPress = useCallback(
    (event: LongPressReactEvents<Element> | ClientCoordinates) => {
      if (initialOnLongPress) {
        AudioPlayer.playSound('UI/LongPress');
        initialOnLongPress(event);
      }
    },
    [initialOnLongPress],
  );

  const click = useCallback(() => {
    AudioPlayer.playSound('UI/Accept');
    onClick();
  }, [onClick]);

  const onPress = useCallback(() => {
    if (!disabled) {
      click();
    }
  }, [disabled, click]);
  const props = usePress({
    onLongPress,
    onPress,
  })();

  const highlighted = isHighlighted(entityCount, position, navigationDirection);

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (highlighted) {
          event.preventDefault();
          click();
        }
      },
      [highlighted, click],
    ),
    'menu',
  );

  const showInfo = useCallback(
    (event: Event) => {
      event.preventDefault();
      if (highlighted) {
        onLongPress(getClientCoordinates(ref.current));
      }
    },
    [highlighted, onLongPress],
  );

  useInput('info', showInfo, 'menu');
  useInput('detail', showInfo, 'menu');

  const [highlight, setHighlight] = useState(false);
  return (
    <a
      className={cx(
        itemStyle,
        radiusItemStyle,
        disabled && disabledStyle,
        (highlight || highlighted) && 'highlight',
      )}
      style={{
        [vars.set('position')]: position,
      }}
      {...props}
      onPointerEnter={() => {
        if (!disabled) {
          setHighlight(true);
        }
      }}
      onPointerLeave={(event) => {
        setHighlight(false);
        if (
          'onPointerLeave' in props &&
          typeof props.onPointerLeave === 'function'
        ) {
          props.onPointerLeave(event);
        }
      }}
      ref={ref}
    >
      <Stack
        alignCenter
        className={cx(BoxStyle, iconStyle, entityStyle, bottomAlignedStyle)}
        end
        gap={4}
        nowrap
        vertical
      >
        <div>
          {icon?.(highlighted || highlight, { className: centerIconStyle })}
        </div>
        {detail}
      </Stack>
    </a>
  );
}

function CenterElement({ children }: { children: ReactNode }) {
  return (
    <div className={cx(itemStyle, radiusItemStyle, centerStyle)}>
      <Stack
        alignCenter
        center
        className={cx(BoxStyle, iconStyle, entityStyle, ellipsis)}
        gap={4}
        nowrap
        vertical
      >
        {children}
      </Stack>
    </div>
  );
}

export function ActionWheelFunds({ funds }: { funds: number }) {
  return (
    <CenterElement>
      <Icon className={centerIconStyle} icon={Coin} />
      {funds.toLocaleString()}
    </CenterElement>
  );
}

export function ActionWheelCharge({
  charge,
  requiredCharge,
}: {
  charge: number;
  requiredCharge: number;
}) {
  return (
    <CenterElement>
      <Icon className={centerIconStyle} icon={ChargeIcon} />
      {Math.floor(charge / Charge)} / {requiredCharge}
    </CenterElement>
  );
}

const vars = new CSSVariables<
  | 'container-size'
  | 'count'
  | 'item-size'
  | 'offset'
  | 'position'
  | 'radius-size'
  | 'radius'
  | 'rotation'
  | 'scale'
  | 'size'
  | 'tan'
  | 'transform'
  | 'x'
  | 'y'
>('w');

const size = TileSize;
const style = css`
  height: ${size * 3}px;
  line-height: 0;
  pointer-events: none;
  position: absolute;
  width: ${size * 3}px;
`;

const iconSize = (TileSize / 3) * 2 - 2;
const itemStyle = css`
  ${vars.set('transform', `translate3d(0, 0, 0)`)}
  ${vars.set('scale', `1`)}

  align-items: center;
  color: ${applyVar('text-color')};
  cursor: pointer;
  display: block;
  display: flex;
  height: ${size}px;
  justify-content: center;
  pointer-events: auto;
  position: absolute;
  width: ${size}px;
  transition:
    transform 150ms ease,
    color 150ms ease;
  transform: ${vars.apply('transform')} scale(${vars.apply('scale')});

  &:hover,
  &.highlight {
    ${vars.set('scale', '1.1')}

    color: ${applyVar('highlight-color')};
  }

  &:active {
    ${vars.set('scale', '0.9')}
  }
`;

const disabledStyle = css`
  ${cssVar('text-color', applyVar('text-color-inactive'))}

  &:hover,
  &:active {
    ${vars.set('scale', '1')}
    color: ${applyVar('text-color')};
  }
`;

const iconStyle = css`
  ${vars.set('size', `${iconSize}px`)}

  ${pixelBorder(applyVar('background-color-light'), 1)};

  -webkit-text-size-adjust: 100%;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.6));
  font-size: ${vars.apply('size')};
  height: ${vars.apply('size')};
  width: ${vars.apply('size')};
`;

const leftStyle = css`
  left: 3px;
  top: ${size}px;
  width: ${size - 3}px;
`;

const bottomStyle = css`
  align-items: start;
  bottom: 3px;
  height: ${size - 3}px;
  left: ${size}px;

  &.shift {
    ${vars.set('transform', `translate3d(0, 100%, 0)`)}
  }
`;

const topStyle = css`
  align-items: end;
  height: ${size - 3}px;
  left: ${size}px;
  top: 3px;
`;

const rightStyle = css`
  right: 3px;
  top: ${size}px;
  width: ${size - 3}px;
`;

const positions: Record<ActionButtonType, string> = {
  attack: bottomStyle,
  capture: rightStyle,
  close: leftStyle,
  complete: topStyle,
  confirm: rightStyle,
  createBuildings: bottomStyle,
  createTracks: rightStyle,
  drop: rightStyle,
  fold: leftStyle,
  heal: rightStyle,
  load: rightStyle,
  rescue: leftStyle,
  sabotage: rightStyle,
  stopCapture: rightStyle,
  supply: bottomStyle,
  unfold: leftStyle,
};

const top = vec(0, -1);
const right = vec(1, 0);
const bottom = vec(0, 1);
const left = vec(-1, 0);

const navigationPositions: Record<ActionButtonType, Vector> = {
  attack: bottom,
  capture: right,
  close: left,
  complete: top,
  confirm: right,
  createBuildings: bottom,
  createTracks: right,
  drop: right,
  fold: left,
  heal: right,
  load: right,
  rescue: left,
  sabotage: right,
  stopCapture: right,
  supply: bottom,
  unfold: left,
};

const dropUnitStyle = css`
  transform: translate3d(0.5px, 0, 0) rotate(-45deg);
`;

const completeUnitStyle = css`
  transform: scaleX(-1);
`;

const radiusStyle = css`
  ${vars.set('item-size', TileSize * 1.5 + 'px')}
  ${vars.set('radius-size', 1.6)}
  ${vars.set(
    'radius',
    `calc(
    0.5 * ${vars.apply('radius-size')} * ${vars.apply(
      'item-size',
    )} / ${vars.apply('tan')}
  )`,
  )}
  ${vars.set(
    'container-size',
    `calc(2 * ${vars.apply('radius')} + ${vars.apply('item-size')})`,
  )}
  ${vars.set('offset', 1)}

  height: ${vars.apply('container-size')};
  position: relative;
  width: ${vars.apply('container-size')};

  ${vars.set(
    'x',
    `calc(${vars.apply('radius')} * -1 + ${vars.apply('item-size')} / 2)`,
  )}
  ${vars.set(
    'y',
    `calc(
    ${vars.apply('radius')} * -1 + ${vars.apply('item-size')} / 2 - 4px
  )`,
  )}
`;

const entityStyle = css`
  ${vars.set('size', `${TileSize * 1.5}px`)}

  font-size: calc(${isIPhone ? applyVar('scale') : 1} * 8px);
`;

const bottomAlignedStyle = css`
  padding-bottom: 6px;
`;

const radiusItemStyle = css`
  ${vars.set(
    'rotation',
    `calc((${vars.apply('position')} - ${vars.apply(
      'offset',
    )}) * 1turn / ${vars.apply('count')})`,
  )}
  ${vars.set(
    'transform',
    `rotate(${vars.apply('rotation')}) translate(${vars.apply(
      'radius',
    )}) rotate(calc(-1 * ${vars.apply('rotation')}))`,
  )}

  height: ${vars.apply('item-size')};
  left: 50%;
  margin: calc(-0.5 * ${vars.apply('item-size')});
  position: absolute;
  top: 50%;
  width: ${vars.apply('item-size')};
`;

const centerStyle = css`
  &:hover {
    ${vars.set('scale', `1`)}
    color: ${applyVar('text-color')};
  }
`;

const centerIconStyle = css`
  height: 16px;
  width: 16px;
`;
