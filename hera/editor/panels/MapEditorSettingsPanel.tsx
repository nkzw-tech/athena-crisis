import type { ResizeOrigin } from '@deities/athena/lib/resizeMap.tsx';
import {
  DoubleSize,
  MaxSize,
  MinSize,
} from '@deities/athena/map/Configuration.tsx';
import { SizeVector } from '@deities/athena/MapData.tsx';
import parseInteger from '@deities/hephaestus/parseInteger.tsx';
import Box from '@deities/ui/Box.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Stack from '@deities/ui/Stack.tsx';
import Tag from '@deities/ui/Tag.tsx';
import TagInput from '@deities/ui/TagInput.tsx';
import { css } from '@emotion/css';
import { fbt } from 'fbt';
import { useState } from 'react';
import useTagDataSource, {
  DEFAULT_TAGS,
} from '../../hooks/useTagDataSource.tsx';
import type { StateWithActions } from '../../Types.tsx';
import BiomeSelector from '../selectors/BiomeSelector.tsx';
import type { MapObject, SaveMapFunction, SetMapFunction } from '../Types.tsx';

export default function MapEditorSettingsPanel({
  actions,
  isAdmin,
  mapName,
  mapObject,
  resize,
  saveMap,
  setMap,
  setMapName,
  setTags,
  state,
  tags,
}: StateWithActions & {
  isAdmin?: boolean;
  mapName: string;
  mapObject?: MapObject | null;
  resize: (size: SizeVector, origin: Set<ResizeOrigin>) => void;
  saveMap: SaveMapFunction;
  setMap: SetMapFunction;
  setMapName: (name: string) => void;
  setTags: (tags: ReadonlyArray<string>) => void;
  tags: ReadonlyArray<string>;
}) {
  const dataSource = useTagDataSource();
  const [width, setWidth] = useState(state.map.size.width);
  const [height, setHeight] = useState(state.map.size.height);

  return (
    <Stack className={marginStyle} gap={24} vertical verticalPadding>
      <BiomeSelector
        hasContentRestrictions={!isAdmin}
        onBiomeChange={(map) => setMap('biome', map)}
        state={state}
      />
      <Box gap vertical>
        <h2>
          <fbt desc="Map settings headline">Map Settings</fbt>
        </h2>
        <Stack alignCenter gap>
          <label>
            <Stack gap>
              <input
                checked={state.map.config.fog}
                onChange={() => {
                  const { map } = state;
                  actions.update({
                    map: map.copy({
                      config: map.config.copy({
                        fog: !map.config.fog,
                      }),
                    }),
                  });
                }}
                type="checkbox"
              />
              <span className="input-label">
                <fbt desc="Label for fog">Fog</fbt>
              </span>
            </Stack>
          </label>
          <label>
            <Stack alignCenter gap>
              <span className="input-label">
                <fbt desc="Starting funds for a game">Starting Funds</fbt>
              </span>
              <input
                onChange={({ target: { value } }) => {
                  const seedCapital = parseInteger(value || '0');
                  if (seedCapital == null) {
                    return;
                  }
                  const { map } = state;
                  actions.update({
                    map: map.copy({
                      config: map.config.copy({
                        seedCapital,
                      }),
                    }),
                  });
                }}
                style={{ width: 70 }}
                type="text"
                value={state.map.config.seedCapital}
              />
            </Stack>
          </label>
        </Stack>
      </Box>
      <Box gap vertical>
        <h2>
          <fbt desc="Map size headline">Map Size</fbt>
        </h2>
        <Stack gap={16} start>
          <label>
            <Stack alignCenter gap>
              <span className="input-label">
                <fbt desc="Map size input field width">Width</fbt>
              </span>
              <input
                onChange={({ target: { value } }) => {
                  const width = parseInteger(value);
                  if (width != null) {
                    setWidth(width);
                  }
                }}
                style={{ width: 50 }}
                type="text"
                value={width}
              />
            </Stack>
          </label>
          <label>
            <Stack alignCenter gap>
              <span className="input-label">
                <fbt desc="Map size input field height">Height</fbt>
              </span>
              <input
                onChange={({ target: { value } }) => {
                  const height = parseInteger(value);
                  if (height != null) {
                    setHeight(height);
                  }
                }}
                style={{ width: 50 }}
                type="text"
                value={height}
              />
            </Stack>
          </label>
          <button
            onClick={() =>
              resize(
                new SizeVector(
                  Math.max(MinSize, Math.min(MaxSize, width)),
                  Math.max(MinSize, Math.min(MaxSize, height)),
                ),
                new Set(['bottom', 'right']),
              )
            }
          >
            <fbt desc="Map resize button">Resize</fbt>
          </button>
        </Stack>
      </Box>
      <Box gap vertical>
        <label>
          <Stack gap start vertical>
            <span className="input-label">
              <fbt desc="Map name label">Name</fbt>
            </span>
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
          <span>
            <fbt desc="Label for map tags">Tags</fbt>
          </span>
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
                <Tag tag="published" />
              </fbt:param>{' '}
              and{' '}
              <fbt:param name="pvp-tag-name">
                <Tag tag="pvp" />
              </fbt:param>{' '}
              tags will be visible in the community map list and on your
              profile.
            </fbt>
          </p>
        </Stack>
      </Box>
      <Box gap={16}>
        <InlineLink onClick={() => saveMap(state.map)}>
          <fbt desc="Button to save a map">Save Map</fbt>
        </InlineLink>
        {mapObject?.id && (
          <InlineLink onClick={() => saveMap(state.map, 'New')}>
            <fbt desc="Button to save as a new map">Save as new Map</fbt>
          </InlineLink>
        )}
        {mapObject?.id && isAdmin ? (
          <>
            {process.env.NODE_ENV === 'development' && (
              <InlineLink onClick={() => saveMap(state.map, 'Disk')}>
                <fbt desc="Button to save the map to disk">Save to Disk</fbt>
              </InlineLink>
            )}
            <InlineLink onClick={() => saveMap(state.map, 'Export')}>
              <fbt desc="Button to export a map">Save and Export</fbt>
            </InlineLink>
          </>
        ) : null}
      </Box>
    </Stack>
  );
}

const inputStyle = css`
  max-width: 320px;
`;

const marginStyle = css`
  margin-bottom: ${DoubleSize * 1.5}px;
`;
