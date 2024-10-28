import { ResizeOrigin } from '@deities/apollo/lib/resizeMap.tsx';
import getUserRoute from '@deities/apollo/routes/getUserRoute.tsx';
import getActivePlayers from '@deities/athena/lib/getActivePlayers.tsx';
import hasBonusObjective from '@deities/athena/lib/hasBonusObjective.tsx';
import {
  DoubleSize,
  MaxCharges,
  MaxSize,
  MinSize,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import {
  PerformanceStyle,
  PerformanceStyleComparators,
  PerformanceStyleType,
  PerformanceStyleTypes,
} from '@deities/athena/map/PlayerPerformance.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import Box from '@deities/ui/Box.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import NumberInput from '@deities/ui/form/NumberInput.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Select from '@deities/ui/Select.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import TagInput from '@deities/ui/TagInput.tsx';
import { css, cx } from '@emotion/css';
import Pace from '@iconify-icons/pixelarticons/speed-fast.js';
import Subscriptions from '@iconify-icons/pixelarticons/subscriptions.js';
import Trophy from '@iconify-icons/pixelarticons/trophy.js';
import Zap from '@iconify-icons/pixelarticons/zap.js';
import { fbt } from 'fbt';
import { useCallback, useState } from 'react';
import useTagDataSource, {
  DEFAULT_TAGS,
} from '../../hooks/useTagDataSource.tsx';
import { UserWithUnlocks } from '../../hooks/useUserMap.tsx';
import getTranslatedPerformanceStyleTypeName from '../../lib/getTranslatedPerformanceStyleTypeName.tsx';
import getTranslatedPerformanceTypeName from '../../lib/getTranslatedPerformanceTypeName.tsx';
import { StateWithActions } from '../../Types.tsx';
import BiomeSelector from '../selectors/BiomeSelector.tsx';
import {
  EditorState,
  MapObject,
  MapPerformanceMetricsEstimation,
  MapPerformanceMetricsEstimationFunction,
  SaveMapFunction,
  SetMapFunction,
} from '../Types.tsx';

export default function MapEditorSettingsPanel({
  actions,
  canEditPerformance,
  estimateMapPerformance,
  isAdmin,
  mapName,
  mapObject,
  resize,
  saveMap,
  setEditorState,
  setMap,
  setMapName,
  setTags,
  state,
  tags,
  user,
}: StateWithActions & {
  canEditPerformance: boolean;
  estimateMapPerformance?: MapPerformanceMetricsEstimationFunction;
  isAdmin?: boolean;
  mapName: string;
  mapObject?: MapObject | null;
  resize: (size: SizeVector, origin: Set<ResizeOrigin>) => void;
  saveMap: SaveMapFunction;
  setEditorState: (setEditorState: Partial<EditorState>) => void;
  setMap: SetMapFunction;
  setMapName: (name: string) => void;
  setTags: (tags: ReadonlyArray<string>) => void;
  tags: ReadonlyArray<string>;
  user: UserWithUnlocks;
}) {
  const { update } = actions;
  const { map } = state;
  const { config } = map;
  const { performance } = config;
  const dataSource = useTagDataSource();
  const [width, setWidth] = useState(map.size.width);
  const [height, setHeight] = useState(map.size.height);
  const [metrics, setMetrics] = useState<
    MapPerformanceMetricsEstimation | null | undefined
  >(undefined);

  const setMetric = useCallback(
    (metric: 'pace' | 'power', value: number | null) =>
      update({
        map: map.copy({
          config: config.copy({
            performance: {
              ...performance,
              [metric]: value,
            },
          }),
        }),
      }),
    [config, map, performance, update],
  );

  const setStyle = useCallback(
    (style: PerformanceStyle | null) =>
      update({
        map: map.copy({
          config: config.copy({
            performance: {
              ...performance,
              style,
            },
          }),
        }),
      }),
    [config, map, performance, update],
  );

  const hasBonus = hasBonusObjective(map, getActivePlayers(map)[0]);
  return (
    <Stack className={marginStyle} gap={24} vertical verticalPadding>
      <Box center>
        <BiomeSelector
          hasContentRestrictions={!isAdmin}
          map={state.map}
          navigate
          onBiomeChange={(map) => setMap('biome', map)}
          user={user}
        />
      </Box>
      <Box gap={16} vertical>
        <h2>
          <fbt desc="Map settings headline">Map Settings</fbt>
        </h2>
        <Stack gap>
          <label>
            <Stack alignCenter gap>
              <input
                checked={config.fog}
                onChange={() =>
                  update({
                    map: map.copy({
                      config: config.copy({
                        fog: !config.fog,
                      }),
                    }),
                  })
                }
                type="checkbox"
              />
              <span>
                <fbt desc="Label for fog">Fog</fbt>
              </span>
            </Stack>
          </label>
          <Stack gap vertical>
            <label>
              <Stack alignCenter gap>
                <span>
                  <fbt desc="Starting funds for a game">Starting Funds</fbt>
                </span>
                <NumberInput
                  min={0}
                  onChange={({ target: { value } }) => {
                    const seedCapital = parseInteger(value || '0');
                    if (seedCapital != null) {
                      update({
                        map: map.copy({
                          config: config.copy({
                            seedCapital,
                          }),
                        }),
                      });
                    }
                  }}
                  style={{ width: 100 }}
                  value={config.seedCapital}
                />
              </Stack>
            </label>
            <label>
              <Stack alignCenter gap>
                <span>
                  <fbt desc="Starting charges for a game">Starting Charges</fbt>
                </span>
                <NumberInput
                  max={MaxCharges}
                  min={0}
                  onChange={({ target: { value } }) => {
                    const initialCharge = parseInteger(value || '0');
                    if (initialCharge != null) {
                      update({
                        map: map.copy({
                          config: config.copy({
                            initialCharge: Math.max(
                              0,
                              Math.min(initialCharge, MaxCharges),
                            ),
                          }),
                        }),
                      });
                    }
                  }}
                  style={{ width: 100 }}
                  value={config.initialCharge}
                />
              </Stack>
            </label>
          </Stack>
        </Stack>
      </Box>
      <Box className={performanceMetricsStyle} gap={16} vertical>
        <Stack
          className={cx(!canEditPerformance && disabledStyle)}
          gap={16}
          vertical
        >
          <Stack gap vertical>
            <h2>
              <fbt desc="Label for player performance">
                Player Performance Metrics
              </fbt>
            </h2>
          </Stack>
          <Stack alignCenter gap={24} start>
            <label>
              <Stack alignCenter gap nowrap>
                <span>{getTranslatedPerformanceTypeName('pace')}</span>
                <NumberInput
                  disabled={!canEditPerformance}
                  min={1}
                  onChange={({ target: { value } }) =>
                    setMetric('pace', parseInteger(value || '0'))
                  }
                  placeholder={metrics?.pace ? String(metrics.pace) : ''}
                  style={{ width: 80 }}
                  value={performance.pace ?? ''}
                />
              </Stack>
            </label>
            <label>
              <Stack alignCenter gap nowrap>
                <span>{getTranslatedPerformanceTypeName('power')}</span>
                <NumberInput
                  disabled={!canEditPerformance}
                  min={0}
                  onChange={({ target: { value } }) =>
                    setMetric('power', Number.parseFloat(value || '0'))
                  }
                  placeholder={metrics?.power ? String(metrics.power) : ''}
                  style={{ width: 80 }}
                  value={performance.power ?? ''}
                />
              </Stack>
            </label>
            <label>
              <Stack alignCenter className={styleGapStyle} nowrap>
                <span>{getTranslatedPerformanceTypeName('style')}</span>
                <Stack alignCenter gap={16}>
                  <Select
                    outline
                    selectedItem={
                      <div className={selectedItemStyle}>
                        {performance.style ? (
                          getTranslatedPerformanceStyleTypeName(
                            performance.style[0],
                          )
                        ) : (
                          <span className={lightStyle}>
                            <fbt desc="Select a performance style metric">
                              Select one
                            </fbt>
                          </span>
                        )}
                      </div>
                    }
                    size="small"
                  >
                    {PerformanceStyleTypes.map((type) => (
                      <InlineLink
                        key={type}
                        onClick={() =>
                          setStyle([type, performance.style?.[1] || 0])
                        }
                        selectedText={type === performance.style?.[0]}
                      >
                        {getTranslatedPerformanceStyleTypeName(type)}
                      </InlineLink>
                    ))}
                    {performance.style && (
                      <InlineLink
                        className={lightStyle}
                        onClick={() => setStyle(null)}
                      >
                        <fbt desc="Label to remove the performance style metric">
                          Remove
                        </fbt>
                      </InlineLink>
                    )}
                  </Select>
                  <div className={comparatorStyle}>
                    {performance.style != null
                      ? PerformanceStyleComparators[performance.style?.[0]]
                      : ' '}
                  </div>
                  <NumberInput
                    disabled={!canEditPerformance}
                    min={0}
                    onChange={({ target: { value } }) =>
                      setStyle([
                        performance.style?.[0] ||
                          PerformanceStyleType.LostUnits,
                        Number.parseFloat(value || '0'),
                      ])
                    }
                    style={{ width: 80 }}
                    value={performance.style?.[1] ?? ''}
                  />
                </Stack>
              </Stack>
            </label>
            <Stack alignCenter gap nowrap start>
              <input
                checked={hasBonus}
                className={cx('disabled', hasBonus && 'checkmark')}
                disabled
                type="checkbox"
              />
              <InlineLink
                onClick={() => setEditorState({ mode: 'objectives' })}
              >
                <fbt desc="Label for a map's bonus objective">
                  Bonus Objective
                </fbt>
              </InlineLink>
            </Stack>
          </Stack>
          {metrics || metrics === null ? (
            <Stack gap={16}>
              <h2>
                <fbt desc="Headline for estimate map performance metrics">
                  Estimated Performance Metrics
                </fbt>
              </h2>
              {metrics === null ? (
                <Stack start>
                  <p>
                    <fbt desc="Description for missing estimated performance metrics">
                      We are still learning about this map. Please try again
                      after more people have successfully played this map.
                    </fbt>
                  </p>
                </Stack>
              ) : (
                <Stack className={fullWidthStyle} gap={24} vertical>
                  <div className={gridStyle}>
                    <div />
                    <div>
                      <fbt desc="Label for p20 metric">p20</fbt>
                    </div>
                    <div>
                      <fbt desc="Label for average metric">Average</fbt>
                    </div>
                    <div />

                    <Stack alignCenter gap start>
                      <Icon icon={Pace} />
                      <div>{getTranslatedPerformanceTypeName('pace')}</div>
                    </Stack>
                    <div>{metrics.pace}</div>
                    <div>{metrics.avgPace}</div>
                    <Stack start>
                      <InlineLink
                        onClick={() => setMetric('pace', metrics.pace)}
                      >
                        <fbt desc="Button to apply the estimated metric">
                          apply
                        </fbt>
                      </InlineLink>
                    </Stack>

                    <Stack alignCenter className={paddingStyle} gap start>
                      <fbt desc="Label for metrics distribution">
                        Distribution
                      </fbt>
                    </Stack>
                    <Stack className={wideColumnStyle} nowrap>
                      <Histogram histogram={metrics.histogram} />
                    </Stack>

                    <Stack alignCenter gap start>
                      <Icon icon={Zap} />
                      <div>{getTranslatedPerformanceTypeName('power')}</div>
                    </Stack>
                    <div>{metrics.power}</div>
                    <div>{metrics.avgPower}</div>
                    <Stack start>
                      <InlineLink
                        onClick={() => setMetric('power', metrics.power)}
                      >
                        <fbt desc="Button to apply the estimated metric">
                          apply
                        </fbt>
                      </InlineLink>
                    </Stack>

                    <Stack alignCenter gap start>
                      <Icon icon={Subscriptions} />
                      <div>{getTranslatedPerformanceTypeName('style')}</div>
                    </Stack>
                    <div />
                    <div />
                    <div />

                    <div className={paddingStyle}>
                      {getTranslatedPerformanceStyleTypeName(
                        PerformanceStyleType.LostUnits,
                      )}
                    </div>
                    <div>{metrics.lostUnits}</div>
                    <div>{metrics.avgLostUnits}</div>
                    <Stack start>
                      <InlineLink
                        onClick={() =>
                          setStyle([
                            PerformanceStyleType.LostUnits,
                            Math.floor(metrics.lostUnits),
                          ])
                        }
                      >
                        <fbt desc="Button to apply the estimated metric">
                          apply
                        </fbt>
                      </InlineLink>
                    </Stack>

                    <div className={paddingStyle}>
                      {getTranslatedPerformanceStyleTypeName(
                        PerformanceStyleType.CapturedBuildings,
                      )}
                    </div>
                    <div>{metrics.capturedBuildings}</div>
                    <div>{metrics.avgCapturedBuildings}</div>
                    <Stack start>
                      <InlineLink
                        onClick={() =>
                          setStyle([
                            PerformanceStyleType.CapturedBuildings,
                            Math.floor(metrics.capturedBuildings),
                          ])
                        }
                      >
                        <fbt desc="Button to apply the estimated metric">
                          apply
                        </fbt>
                      </InlineLink>
                    </Stack>

                    <div className={paddingStyle}>
                      {getTranslatedPerformanceStyleTypeName(
                        PerformanceStyleType.OneShots,
                      )}
                    </div>
                    <div>{metrics.oneShots}</div>
                    <div>{metrics.avgOneShots}</div>
                    <Stack start>
                      <InlineLink
                        onClick={() =>
                          setStyle([
                            PerformanceStyleType.OneShots,
                            Math.floor(metrics.oneShots),
                          ])
                        }
                      >
                        <fbt desc="Button to apply the estimated metric">
                          apply
                        </fbt>
                      </InlineLink>
                    </Stack>
                  </div>
                  <Stack alignCenter gap start>
                    <Icon className={iconStyle} icon={Trophy} />
                    <div>
                      <fbt desc="Map metrics summary">
                        Total (excluding invasions):
                        <fbt:param name="won">{metrics.won}</fbt:param>{' '}
                        <fbt:plural
                          count={metrics.won}
                          many="won games"
                          name="number of games"
                          showCount="no"
                        >
                          won game
                        </fbt:plural>,{' '}
                        <fbt:param name="lost">{metrics.lost}</fbt:param>{' '}
                        <fbt:plural
                          count={metrics.lost}
                          many="lost games"
                          name="number of games"
                          showCount="no"
                        >
                          lost game
                        </fbt:plural>,{' '}
                        <fbt:param name="winRatio">
                          {(metrics.won / (metrics.won + metrics.lost)).toFixed(
                            2,
                          )}
                        </fbt:param>{' '}
                        win ratio.
                      </fbt>
                    </div>
                  </Stack>
                </Stack>
              )}
            </Stack>
          ) : (
            mapObject?.id &&
            estimateMapPerformance && (
              <Stack start>
                <InlineLink
                  onClick={async () =>
                    setMetrics(await estimateMapPerformance())
                  }
                >
                  <fbt desc="Button to estimate player performance metrics for this map">
                    Estimate performance metrics for this map
                  </fbt>
                </InlineLink>
              </Stack>
            )
          )}
        </Stack>{' '}
        {!canEditPerformance && (
          <>
            <div className={performanceMetricsOverlayBackgroundStyle} />
            <Box alignCenter center className={performanceMetricsOverlayStyle}>
              <p>
                <fbt desc="Explanation for why map player performance metrics cannot be changed">
                  Player performance metrics are only available for campaign
                  maps.
                </fbt>
              </p>
            </Box>
          </>
        )}
      </Box>
      <Box gap vertical>
        <h2>
          <fbt desc="Map size headline">Map Size</fbt>
        </h2>
        <Stack gap={24} start>
          <label>
            <Stack alignCenter gap>
              <span>
                <fbt desc="Map size input field width">Width</fbt>
              </span>
              <NumberInput
                max={MaxSize}
                min={MinSize}
                onChange={({ target: { value } }) => {
                  const width = parseInteger(value);
                  setWidth(width || 0);
                }}
                style={{ width: 70 }}
                value={width === 0 ? '' : width}
              />
            </Stack>
          </label>
          <label>
            <Stack alignCenter gap>
              <span>
                <fbt desc="Map size input field height">Height</fbt>
              </span>
              <NumberInput
                max={MaxSize}
                min={MinSize}
                onChange={({ target: { value } }) => {
                  const height = parseInteger(value);
                  setHeight(height || 0);
                }}
                style={{ width: 70 }}
                value={height === 0 ? '' : height}
              />
            </Stack>
          </label>
          <button
            onClick={() => {
              const size = new SizeVector(
                Math.max(MinSize, Math.min(MaxSize, width)),
                Math.max(MinSize, Math.min(MaxSize, height)),
              );
              setHeight(size.height);
              setWidth(size.width);
              resize(size, new Set(['bottom', 'right']));
            }}
          >
            <fbt desc="Map resize button">Resize</fbt>
          </button>
        </Stack>
      </Box>
      <Box gap vertical>
        <label>
          <Stack gap start vertical>
            <h2>
              <fbt desc="Map name label">Name</fbt>
            </h2>
            <input
              className={inputStyle}
              onBlur={(event) => event.target.classList.add('validate')}
              onChange={(event) => setMapName(event.target.value)}
              placeholder={String(fbt('map name', 'placeholder for map name'))}
              required
              type="text"
              value={mapName}
            />
          </Stack>
        </label>
      </Box>
      <Box gap vertical>
        <Stack gap vertical>
          <h2>
            <fbt desc="Label for map tags">Tags</fbt>
          </h2>
          <TagInput
            dataSource={dataSource}
            emptySuggestions={DEFAULT_TAGS}
            freeform
            setTags={setTags}
            tags={tags}
          />
          <p>
            <fbt desc="Explanation for tags">
              Maps with the
              <fbt:param name="published-tag-name">
                <span className={tagBackgroundStyle}>
                  <Tag tag="published" />
                </span>
              </fbt:param>{' '}
              and{' '}
              <fbt:param name="pvp-tag-name">
                <span className={tagBackgroundStyle}>
                  <Tag tag="pvp" />
                </span>
              </fbt:param>{' '}
              tags will be visible in the community map list and on your
              profile.
            </fbt>
          </p>
        </Stack>
      </Box>
      <Box gap={16}>
        <InlineLink onClick={() => saveMap(map)}>
          <fbt desc="Button to save a map">Save Map</fbt>
        </InlineLink>
        {mapObject?.id && (
          <InlineLink onClick={() => saveMap(map, 'New')}>
            <fbt desc="Button to save as a new map">Save as new Map</fbt>
          </InlineLink>
        )}
        {!process.env.IS_LANDING_PAGE && (
          <InlineLink to={`${getUserRoute(user.username)}?view=maps#maps`}>
            <fbt desc="Button to save as a new map">Load Map</fbt>
          </InlineLink>
        )}
        {mapObject?.id && isAdmin ? (
          <>
            {process.env.NODE_ENV === 'development' && (
              <InlineLink onClick={() => saveMap(map, 'Disk')}>
                <fbt desc="Button to save the map to disk">Save to Disk</fbt>
              </InlineLink>
            )}
            <InlineLink onClick={() => saveMap(map, 'Export')}>
              <fbt desc="Button to export a map">Save and Export</fbt>
            </InlineLink>
          </>
        ) : null}
      </Box>
    </Stack>
  );
}

const Histogram = ({ histogram }: { histogram: string }) => (
  <span>
    {histogram.split('').map((character, index) =>
      character === '|' ? (
        <span className={lightStyle} key={index}>
          {'\u2581'}
        </span>
      ) : (
        character
      ),
    )}
  </span>
);

const inputStyle = css`
  max-width: 320px;
`;

const marginStyle = css`
  margin-bottom: ${DoubleSize * 1.5}px;
`;

const performanceMetricsStyle = css`
  position: relative;
`;

const performanceMetricsOverlayBackgroundStyle = css`
  ${pixelBorder(applyVar('background-color-dark'))}
  background-color: ${applyVar('background-color-dark')};
  filter: blur(2px);
  inset: 0;
  opacity: 0.3;
  position: absolute;
`;
const performanceMetricsOverlayStyle = css`
  position: absolute;
  inset: ${TileSize}px;
`;

const disabledStyle = css`
  filter: blur(2px);
  opacity: 0.7;
  pointer-events: none;
`;

const lightStyle = css`
  color: ${applyVar('text-color-light')};
`;

const iconStyle = css`
  margin: 1px 0 -1px 0;
`;

const styleGapStyle = css`
  gap: 12px;
`;

const selectedItemStyle = css`
  width: 140px;
`;

const comparatorStyle = css`
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-size: 32px;
  font-weight: 200;
  line-height: 32px;
  text-align: center;
  width: 20px;
`;

const fullWidthStyle = css`
  width: 100%;
`;

const gridStyle = css`
  column-gap: 8px;
  display: grid;
  grid-template-columns: auto auto auto auto;
  row-gap: 12px;
`;

const paddingStyle = css`
  padding-left: 28px;
`;

const wideColumnStyle = css`
  grid-column: 2 / 5;
  white-space: nowrap;
`;

const tagBackgroundStyle = css`
  ${clipBorder(2)}

  display: inline-block;
  background: ${applyVar('background-color-light')};
`;
