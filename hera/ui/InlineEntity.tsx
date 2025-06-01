import { BuildingInfo } from '@deities/athena/info/Building.tsx';
import { MovementType } from '@deities/athena/info/MovementType.tsx';
import { Plain, TileInfo, TileType } from '@deities/athena/info/Tile.tsx';
import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import getBiomeStyle from '@deities/athena/lib/getBiomeStyle.tsx';
import { Biome, Biomes } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import { BaseColor } from '@deities/ui/getColor.tsx';
import Tag from '@deities/ui/Tag.tsx';
import { css, cx } from '@emotion/css';
import { List } from 'fbtee';
import { ComponentProps } from 'react';
import BuildingTile from '../Building.tsx';
import InlineTileList from '../card/InlineTileList.tsx';
import getTranslatedTileTypeName from '../lib/getTranslatedTileTypeName.tsx';
import UnitTile from '../Unit.tsx';

type InlineTagProps = Pick<
  ComponentProps<typeof Tag>,
  'isMessage' | 'onRemove' | 'size'
>;

export const UnitName = ({
  color,
  size = 'small',
  unit,
  unitColor = 1,
  ...props
}: {
  color: BaseColor;
  unit: UnitInfo;
  unitColor?: PlayerID;
} & InlineTagProps) => (
  <span className={nowrapStyle}>
    <span className={inlineStyle}>
      <UnitTile
        animationConfig={AnimationConfig}
        biome={Biome.Grassland}
        firstPlayerID={1}
        size={TileSize}
        tile={Plain}
        unit={unit.create(unitColor)}
      />
    </span>
    <Tag color={color} size={size} tag={unit.name} {...props} />
  </span>
);

export function BuildingName({
  building,
  buildingColor = 1,
  color,
  size = 'small',
  ...props
}: {
  building: BuildingInfo;
  buildingColor?: PlayerID;
  color: BaseColor;
} & InlineTagProps) {
  return (
    <span className={nowrapStyle}>
      <span className={cx(inlineStyle, buildingStyle)}>
        <BuildingTile
          animationConfig={AnimationConfig}
          biome={Biome.Grassland}
          building={building.create(buildingColor)}
          position={new SpriteVector(1, 1.25)}
          size={TileSize}
        />
      </span>
      <Tag color={color} size={size} tag={building.name} {...props} />
    </span>
  );
}

export function MovementTypeName({
  movementType,
  size = 'small',
  ...props
}: {
  movementType: MovementType;
} & InlineTagProps) {
  return <Tag color="team" size={size} tag={movementType.name} {...props} />;
}

export function MovementTypeNames({
  movementTypes,
  size = 'small',
  ...props
}: {
  movementTypes: ReadonlyArray<MovementType>;
} & InlineTagProps) {
  return (
    <List
      items={movementTypes.map((movementType, index) => (
        <MovementTypeName
          key={index}
          movementType={movementType}
          size={size}
          {...props}
        />
      ))}
    />
  );
}

export function TileName({
  biome,
  size = 'small',
  tile,
  ...props
}: {
  biome: Biome;
  tile: TileInfo;
} & InlineTagProps) {
  const { tileRestrictions } = getBiomeStyle(biome);
  if (tileRestrictions?.has(tile)) {
    for (const b of Biomes) {
      if (!getBiomeStyle(b).tileRestrictions?.has(tile)) {
        biome = b;
        break;
      }
    }
  }

  return (
    <span className={nowrapStyle}>
      <span className={inlineStyle}>
        <div className={paddingStyle}>
          <InlineTileList biome={biome} scale={1} tiles={[tile]} />
        </div>
      </span>
      <Tag size={size} tag={tile.name} {...props} />
    </span>
  );
}

export function TileTypeName({
  size = 'small',
  tileType,
  ...props
}: {
  tileType: TileType;
} & InlineTagProps) {
  return (
    <Tag
      color="team"
      size={size}
      tag={getTranslatedTileTypeName(tileType)}
      {...props}
    />
  );
}

const nowrapStyle = css`
  white-space: nowrap;
`;

const inlineStyle = css`
  display: inline-block;
  image-rendering: pixelated;
  padding-right: 8px;
  white-space: nowrap;
  vertical-align: top;
`;

const paddingStyle = css`
  align-items: center;
  margin-top: 3.5px;
`;

const buildingStyle = css`
  height: ${TileSize}px;
`;
