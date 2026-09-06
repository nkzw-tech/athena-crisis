import Entity, { isBuilding } from '@deities/athena/map/Entity.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import sprite from './lib/sprite.tsx';
import Tick from './Tick.tsx';

export default function Label({
  entity,
  hide,
  size,
}: {
  entity: Entity;
  hide: boolean;
  size: number;
}) {
  return entity.label !== null ? (
    <div
      className={cx(sprite('Label', entity.label), labelStyle, hide && hideStyle)}
      style={
        isBuilding(entity)
          ? { top: size / 2 - (entity.info.sprite.size === 'tall' ? labelSize / 1.5 + 1 : 1) }
          : undefined
      }
    />
  ) : null;
}

const labelSize = 12;
const labelStyle = css`
  background-position: calc(${Tick.vars.apply('unit')} * ${-labelSize}px);
  filter: brightness(1.1);
  height: ${labelSize}px;
  opacity: 1;
  position: absolute;
  right: -${labelSize / 2 + 1}px;
  top: -${labelSize / 2 - 1}px;
  transition: opacity ${applyVar('animation-duration-70')} ease-in-out;
  width: ${labelSize}px;
`;

const hideStyle = css`
  opacity: 0;
`;
