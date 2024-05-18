import { TileSize } from '@deities/athena/map/Configuration.tsx';
import type Entity from '@deities/athena/map/Entity.tsx';
import { isBuilding } from '@deities/athena/map/Entity.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { css, cx } from '@emotion/css';
import sprite from './lib/sprite.tsx';
import Tick from './Tick.tsx';

export default function Label({
  entity,
  hide,
}: {
  entity: Entity;
  hide: boolean;
}) {
  return entity.label !== null ? (
    <div
      className={cx(
        sprite('Label', entity.label),
        labelStyle,
        isBuilding(entity)
          ? entity.info.sprite.size === 'tall'
            ? tallBuildingOffsetStyle
            : buildingOffsetStyle
          : null,
        hide && hideStyle,
      )}
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

const tallBuildingOffsetStyle = css`
  top: ${TileSize / 2 - labelSize / 1.5 - 1}px;
`;

const buildingOffsetStyle = css`
  top: ${TileSize / 2 - 1}px;
`;

const hideStyle = css`
  opacity: 0;
`;
