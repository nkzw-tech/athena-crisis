import {
  BuildingInfo,
  getAllBuildings,
  ResearchLab,
} from '@deities/athena/info/Building.tsx';
import { Skill } from '@deities/athena/info/Skill.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import getAttributeRange, {
  getAttributeRangeValue,
} from '@deities/athena/lib/getAttributeRange.tsx';
import withModifiers from '@deities/athena/lib/withModifiers.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import Building from '@deities/athena/map/Building.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import vec from '@deities/athena/map/vec.tsx';
import MapData from '@deities/athena/MapData.tsx';
import minBy from '@deities/hephaestus/minBy.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Heart from '@deities/ui/icons/Heart.tsx';
import Label from '@deities/ui/icons/Label.tsx';
import StopCapture from '@deities/ui/icons/StopCapture.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import Buildings from '@iconify-icons/pixelarticons/buildings.js';
import CloseBox from '@iconify-icons/pixelarticons/close-box.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import Flag from '@iconify-icons/pixelarticons/flag.js';
import Shield from '@iconify-icons/pixelarticons/shield.js';
import TrendingUp from '@iconify-icons/pixelarticons/trending-up.js';
import ImmutableMap from '@nkzw/immutable-map';
import { memo, useMemo } from 'react';
import getHealthColor from '../behavior/attack/getHealthColor.tsx';
import BuildingTile from '../Building.tsx';
import getAnyBuildingTileField from '../lib/getAnyBuildingTileField.tsx';
import getAnyUnitTile from '../lib/getAnyUnitTile.tsx';
import getTranslatedEntityName from '../lib/getTranslatedEntityName.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import Tick from '../Tick.tsx';
import { FactionNames } from '../Types.tsx';
import MiniPlayerIcon from '../ui/MiniPlayerIcon.tsx';
import { SkillIcon } from '../ui/SkillDialog.tsx';
import UILabel from '../ui/UILabel.tsx';
import { AttributeGridBox } from './AttributeGrid.tsx';
import CardTitle, { CardInfoHeading } from './CardTitle.tsx';
import InlineTileList from './InlineTileList.tsx';
import Range from './Range.tsx';
import TileBox from './TileBox.tsx';
import TilePreview from './TilePreview.tsx';

const vector = vec(1, 1);

const buildings = getAllBuildings();

const createableBuildings = buildings.filter(
  ({ configuration: { canBeCreated } }) => canBeCreated,
);
const extractCost = ({ configuration: { cost } }: BuildingInfo) => cost;
const costRange = getAttributeRange(
  createableBuildings.filter(
    ({ configuration: { cost } }) => cost < Number.POSITIVE_INFINITY,
  ),
  extractCost,
  minBy(createableBuildings, extractCost)?.configuration.cost || 0,
);
const defenseRange = getAttributeRange(
  buildings,
  ({ defense }) => defense,
  0.01,
);

export default memo(function BuildingCard({
  building,
  factionNames,
  map,
  unit,
}: {
  building: Building;
  factionNames: FactionNames;
  map: MapData;
  unit?: Unit | null;
}) {
  const { biome } = map.config;
  const { info, player } = building;
  const {
    configuration: { canBeCreated, cost, funds, isAccessible, limit },
    sprite: { size },
  } = info;
  const [entity, previewMap] = useMemo(() => {
    const entity = building.copy({ label: null }).recover();
    return [
      entity,
      withModifiers(
        MapData.createMap({
          config: {
            biome,
          },
          map: [getAnyBuildingTileField(info)],
          modifiers: [0],
        }).copy({
          buildings: ImmutableMap([[vector, entity]]),
        }),
      ),
    ];
  }, [biome, building, info]);

  return (
    <>
      <Stack alignCenter gap nowrap start>
        <TilePreview map={previewMap} size={size}>
          <BuildingTile
            animationConfig={AnimationConfig}
            biome={biome}
            building={entity}
            position={vector}
            requestFrame={requestAnimationFrame}
            scheduleTimer={(fn, delay) =>
              Promise.resolve(setTimeout(fn, delay))
            }
            size={TileSize}
          />
        </TilePreview>
        <Stack gap start vertical>
          <CardTitle style={{ color: getColor(building.player) }}>
            {info.name}
          </CardTitle>
          {getTranslatedEntityName(info.type)}
        </Stack>
      </Stack>
      <Stack gap={16} vertical>
        <AttributeGridBox>
          <Stack nowrap start>
            <Icon icon={Heart} />
            <fbt desc="Label for health">Health</fbt>
          </Stack>
          <div
            style={{
              color: getHealthColor(building.health),
            }}
          >
            {building.health}%
          </div>
          <div />
          {funds > 0 ? (
            <>
              <Stack nowrap start>
                <Icon icon={TrendingUp} />
                <fbt desc="Label for limit">Funds</fbt>
              </Stack>
              <div>{funds}</div>
              <div />
            </>
          ) : null}
          <Stack nowrap start>
            <Icon icon={Shield} />
            <fbt desc="Label for defense">Defense</fbt>
          </Stack>
          <div>{info.defense}</div>
          <Range
            end
            value={getAttributeRangeValue(defenseRange, info.defense)}
          />
          {limit > 0 ? (
            <>
              <Stack nowrap start>
                <Icon icon={Buildings} />
                <fbt desc="Label for limit">Limit</fbt>
              </Stack>
              <div>{limit}</div>
              <div />
            </>
          ) : null}
          {!isAccessible && (
            <>
              <Stack start>
                <Icon icon={CloseBox} />
                <fbt desc="Label for inaccessible buildings">Inaccessible</fbt>
              </Stack>
              <div />
              <div />
            </>
          )}
          {info.isStructure() && (
            <>
              <Stack nowrap start>
                <Icon icon={StopCapture} />
                <fbt desc="Label for neutral only buildings">
                  Not capturable
                </fbt>
              </Stack>
              <div />
              <div />
            </>
          )}
          {canBeCreated && cost < Number.POSITIVE_INFINITY && (
            <>
              <Stack nowrap start>
                <Icon icon={Coin} />
                <fbt desc="Label for build cost">Build Cost</fbt>
              </Stack>
              <div>{cost}</div>
              <Range
                end
                invert
                value={getAttributeRangeValue(costRange, cost)}
              />
            </>
          )}
          {unit?.isCapturing() && (
            <>
              <Stack nowrap start>
                <Icon icon={Flag} />
                <fbt desc="Label for in progress capture (text has to be short)">
                  Capture…
                </fbt>
              </Stack>
              <Stack alignCenter className={wideColumnStyle} end gap>
                <MiniPlayerIcon id={unit.player} />
                {getTranslatedFactionName(factionNames, unit.player)}
              </Stack>
            </>
          )}
          {building.label != null && (
            <>
              <Stack nowrap start>
                <Icon className={iconStyle} icon={Label} />
                <fbt desc="Label for label">Label</fbt>
              </Stack>
              <div>
                <UILabel color={building.label} />
              </div>
            </>
          )}
        </AttributeGridBox>
        <Stack gap vertical>
          <CardInfoHeading player={building.player}>
            <fbt desc="About building headline">About</fbt>
          </CardInfoHeading>
          <p>{info.description}</p>
        </Stack>
        <BuildableUnits
          biome={biome}
          building={building}
          map={map}
          player={player}
        />
        {building.id === ResearchLab.id && building.skills?.size ? (
          <ResearchSkills player={player} skills={building.skills} />
        ) : null}
        <PlaceOnTiles biome={biome} building={info} player={player} />
      </Stack>
    </>
  );
});

const ResearchSkills = memo(function ResearchSkills({
  player,
  skills,
}: {
  player: PlayerID;
  skills: ReadonlySet<Skill>;
}) {
  return (
    <Stack gap vertical>
      <CardInfoHeading player={player}>
        <fbt desc="Headline for buyable skills">Buyable Skills</fbt>
      </CardInfoHeading>
      <Stack gap={16} start>
        {Array.from(skills).map((skill) => (
          <SkillIcon hideDialog key={skill} showName skill={skill} />
        ))}
      </Stack>
    </Stack>
  );
});

const PlaceOnTiles = memo(function PlaceOnTiles({
  biome,
  building,
  player,
}: {
  biome: Biome;
  building: BuildingInfo;
  player: PlayerID;
}) {
  const {
    configuration: { placeOn },
  } = building;
  return placeOn ? (
    <Stack gap vertical>
      <CardInfoHeading player={player}>
        <fbt desc="Headline for which tiles a building can be placed on">
          Tiles
        </fbt>
      </CardInfoHeading>
      <TileBox>
        <InlineTileList biome={biome} size="tall" tiles={[...placeOn]} />
      </TileBox>
    </Stack>
  ) : null;
});

const BuildableUnits = memo(function BuildableUnits({
  biome,
  building,
  map,
  player,
}: {
  biome: Biome;
  building: Building;
  map: MapData;
  player: PlayerID;
}) {
  const {
    config: { blocklistedUnits },
    currentPlayer,
  } = map;
  const units = [...building.getBuildableUnits(map.getPlayer(player))]
    .filter((unit) => !blocklistedUnits.has(unit.id))
    .map((unit) => unit.create(player === 0 ? currentPlayer : player));

  if (!units.length) {
    return null;
  }

  return (
    <Stack gap vertical>
      <CardInfoHeading player={player}>
        <fbt desc="Headline for which units a building can create">Units</fbt>
      </CardInfoHeading>
      <TileBox>
        <Tick animationConfig={AnimationConfig}>
          <InlineTileList
            biome={biome}
            tiles={units.map((unit) => getAnyUnitTile(unit.info) || Plain)}
            units={units}
          />
        </Tick>
      </TileBox>
    </Stack>
  );
});

const wideColumnStyle = css`
  grid-column: 2 / 4;
`;

const iconStyle = css`
  margin-bottom: -2px;
  margin-top: 2px;
`;
