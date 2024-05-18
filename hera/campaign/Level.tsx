import type { Scenario } from '@deities/apollo/Effects.tsx';
import getMapRoute from '@deities/apollo/routes/getMapRoute.tsx';
import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import type MapData from '@deities/athena/MapData.tsx';
import type { WinCondition } from '@deities/athena/WinConditions.tsx';
import { WinCriteria } from '@deities/athena/WinConditions.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import toPlainLevelList from '@deities/hermes/toPlainLevelList.tsx';
import type {
  ClientLevelID,
  Level as LevelT,
  PlainLevel,
} from '@deities/hermes/Types.tsx';
import Box from '@deities/ui/Box.tsx';
import Button from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Link from '@deities/ui/Link.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import TagList from '@deities/ui/TagList.tsx';
import type { TypeaheadDataSource } from '@deities/ui/Typeahead.tsx';
import Typeahead from '@deities/ui/Typeahead.tsx';
import { css, cx } from '@emotion/css';
import ArrowLeftBox from '@iconify-icons/pixelarticons/arrow-left-box.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import Edit from '@iconify-icons/pixelarticons/edit.js';
import DialogueIcon from '@iconify-icons/pixelarticons/message-text.js';
import EmptyDialogueIcon from '@iconify-icons/pixelarticons/message.js';
import { fbt } from 'fbt';
import { useInView } from 'framer-motion';
import type { MouseEvent } from 'react';
import { memo, useCallback, useRef, useState } from 'react';
import Portrait from '../character/Portrait.tsx';
import ActionCard from '../editor/lib/ActionCard.tsx';
import EffectSelector from '../editor/selectors/EffectSelector.tsx';
import useEffects from '../hooks/useEffects.tsx';
import useMapData from '../hooks/useMapData.tsx';
import MapComponent from '../Map.tsx';
import WinConditionTitle from '../win-conditions/WinConditionTitle.tsx';
import useEffectCharacters from './hooks/useEffectCharacters.tsx';
import sortByDepth from './lib/sortByDepth.tsx';
import type {
  CampaignEditorSaveState,
  CampaignEditorSetMapFunction,
  MapNode,
} from './Types.tsx';

export default memo(function Level({
  depth = 0,
  depthMap,
  grandParentLevel,
  level,
  parentLevel,
  winConditionIndex,
  winConditions,
  ...commonProps
}: {
  dataSource: TypeaheadDataSource<MapNode>;
  depth?: number;
  depthMap: ReadonlyMap<string, number>;
  grandParentLevel?: LevelT<ClientLevelID>;
  level: LevelT<ClientLevelID>;
  maps: ReadonlyMap<ClientLevelID, MapNode>;
  parentLevel?: LevelT<ClientLevelID>;
  renderEntities?: boolean;
  replaceFirstLevel: (mapId: ClientLevelID) => void;
  setMap: CampaignEditorSetMapFunction;
  setSaveState: (state: CampaignEditorSaveState) => void;
  updateLevel: (
    level: PlainLevel<ClientLevelID> | ReadonlyArray<PlainLevel<ClientLevelID>>,
    newMap?: MapNode,
  ) => void;
  winConditionIndex?: number;
  winConditions?: ReadonlyArray<WinCondition>;
  zoom?: number;
}) {
  const {
    dataSource,
    maps,
    renderEntities = true,
    replaceFirstLevel,
    setMap,
    setSaveState,
    updateLevel,
    zoom = 1,
  } = commonProps;

  const ref = useRef(null);
  const isInView = useInView(ref);

  const condition =
    winConditionIndex != null && winConditions?.[winConditionIndex];
  const node = maps.get(level.mapId);
  const { alert } = useAlert();
  const map = useMapData(node?.state);
  const effects = useEffects(node?.effects);
  const characters = useEffectCharacters(effects);
  const startEffect = effects.get('Start');
  const [scenario, setScenario] = useState<Scenario>({
    effect: (startEffect && getFirst(startEffect)) || {
      actions: [{ type: 'Start' }],
    },
    trigger: 'Start',
  });

  const updateWinCondition = useCallback(
    (index: number | null) => {
      if (parentLevel) {
        updateLevel({
          ...parentLevel,
          next: [...(parentLevel.next || [])].map((entry) => {
            const isArray = Array.isArray(entry);
            const { mapId } = isArray ? entry[1] : entry;
            // Only mutate if the level id matches.
            if (mapId === level.mapId) {
              return index != null ? [index, mapId] : mapId;
            }
            return isArray ? [entry[0], mapId] : mapId;
          }),
        });
      }
    },
    [level.mapId, parentLevel, updateLevel],
  );

  const removeConnection = useCallback(
    (parentLevel: LevelT<ClientLevelID>) => {
      const next: ReadonlyArray<ClientLevelID | [number, ClientLevelID]> =
        parentLevel.next
          ? parentLevel.next
              .filter(
                (entry) =>
                  (Array.isArray(entry) ? entry[1] : entry).mapId !==
                  level.mapId,
              )
              .map((entry) =>
                Array.isArray(entry) ? [entry[0], entry[1].mapId] : entry.mapId,
              )
          : [];
      return {
        ...parentLevel,
        next: next.length ? next : undefined,
      };
    },
    [level.mapId],
  );

  if (!node || !map) {
    return null;
  }

  const next = level.next;
  return (
    <Stack alignCenter nowrap start>
      <Stack gap={16} padding vertical>
        <Box
          alignCenter
          className={mapCardStyle}
          gap={depth > 0 ? 16 : undefined}
          nowrap
          ref={ref}
        >
          <div className={selectorContainerStyle}>
            {condition && winConditionIndex != null ? (
              <WinConditionTitle
                condition={condition}
                index={winConditionIndex}
                short
              />
            ) : (
              depth > 0 && (
                <fbt desc="Short description for 'any win condition'">Win</fbt>
              )
            )}
            <Stack
              className={cx(selectorStyle, winConditionSelectorStyle)}
              vertical
            >
              {parentLevel && (
                <>
                  <InlineLink
                    className={winConditionSelectorItemStyle}
                    onClick={() => updateWinCondition(null)}
                    selectedText={
                      winConditionIndex == null ||
                      (condition && condition.type === WinCriteria.Default)
                    }
                  >
                    <fbt desc="Long description for 'any win condition'">
                      Win (in any way)
                    </fbt>
                  </InlineLink>
                  {winConditions
                    ?.map((condition, index) =>
                      condition.type !== WinCriteria.Default ? (
                        <InlineLink
                          className={winConditionSelectorItemStyle}
                          key={index}
                          onClick={() => updateWinCondition(index)}
                          selectedText={index === winConditionIndex}
                        >
                          <WinConditionTitle
                            condition={condition}
                            index={index}
                          />
                        </InlineLink>
                      ) : null,
                    )
                    .filter(isPresent)}
                </>
              )}
            </Stack>
          </div>
          <Stack gap vertical>
            <Stack>
              <h2>{node.name}</h2>
              <Stack gap>
                <InlineLink
                  className={iconStyle}
                  onClick={() => setMap(node.id, 'effects')}
                  selectedText
                >
                  <Icon
                    button
                    className={dialogueIconStyle}
                    icon={characters.length ? DialogueIcon : EmptyDialogueIcon}
                  />
                </InlineLink>
                {depth === 1 && parentLevel && (
                  <InlineLink
                    className={iconStyle}
                    onClick={() =>
                      alert({
                        onAccept: () => replaceFirstLevel(level.mapId),
                        text: fbt(
                          'Are you sure you want to replace the first level of the campaign with this map? All sibling maps will be dropped.',
                          'Confirmation dialog for replacing the first level of a Campaign',
                        ),
                      })
                    }
                    selectedText
                  >
                    <Icon button icon={ArrowLeftBox} />
                  </InlineLink>
                )}
                {depth > 1 && grandParentLevel && parentLevel && (
                  <InlineLink
                    className={iconStyle}
                    onClick={() => {
                      updateLevel([
                        removeConnection(parentLevel),
                        {
                          ...grandParentLevel,
                          next: [...(grandParentLevel.next || []), level].map(
                            (entry) =>
                              Array.isArray(entry)
                                ? [entry[0], entry[1].mapId]
                                : entry.mapId,
                          ),
                        },
                      ]);
                    }}
                    selectedText
                  >
                    <Icon button icon={ArrowLeftBox} />
                  </InlineLink>
                )}
                {depth !== 0 && parentLevel && (
                  <InlineLink
                    className={iconStyle}
                    onClick={() => updateLevel(removeConnection(parentLevel))}
                    selectedText
                  >
                    <Icon button icon={Close} />
                  </InlineLink>
                )}
              </Stack>
            </Stack>
            <TagList className={tagListStyle} tags={node.tags} />
            <MiniMap
              isInView={isInView}
              map={map}
              mapId={node.id}
              onClick={(event) => {
                if (!event.metaKey && event.button === 0) {
                  event.preventDefault();
                  setMap(node.id);
                }
              }}
              renderEntities={renderEntities}
              slug={node.slug}
              zoom={zoom}
            />
            <Stack className={mapBottomStyle} gap={16}>
              {characters.length ? (
                <Stack
                  className={cx(selectorContainerStyle, effectContainerStyle)}
                  gap
                  start
                >
                  {characters.map((action, index) => (
                    <Portrait
                      clip
                      key={index}
                      player={action.player}
                      scale={0.5}
                      unit={getUnitInfoOrThrow(action.unitId)}
                      variant={action.variant}
                    />
                  ))}
                  {isInView && effects && (
                    <Stack
                      className={cx(selectorStyle, effectPanelStyle)}
                      gap
                      nowrap
                      padding
                      vertical
                    >
                      <Stack alignCenter gap={16} nowrap>
                        <EffectSelector
                          effects={effects}
                          scenario={scenario}
                          setScenario={(scenario) => setScenario(scenario)}
                          winConditions={map.config.winConditions}
                        />
                        <Button
                          onClick={() => setMap(node.id, 'effects', scenario)}
                        >
                          <Icon className={iconActiveStyle} icon={Edit} />
                        </Button>
                      </Stack>
                      {scenario.effect.actions.map((action, index) => (
                        <ActionCard
                          action={action}
                          biome={map.config.biome}
                          hasContentRestrictions={false}
                          key={index}
                          scrollRef={null}
                          user={null}
                        />
                      ))}
                    </Stack>
                  )}
                </Stack>
              ) : null}
              <Typeahead
                dataSource={dataSource}
                onSelect={(result) => {
                  const next = toPlainLevelList(level.next);
                  if (
                    next.some(
                      (entry) =>
                        (Array.isArray(entry) ? entry[1] : entry) ===
                        result.value,
                    )
                  ) {
                    setSaveState({ id: 'duplicate' });
                    return '';
                  }
                  updateLevel(
                    {
                      ...level,
                      next: [...next, result.value],
                    },
                    result.data,
                  );
                  return '';
                }}
                placeholder={fbt(
                  'Continue on…',
                  'Placeholder text for adding a map to a level.',
                )}
              />
            </Stack>
          </Stack>
        </Box>
      </Stack>
      {next?.length ? (
        <>
          <div className={arrowStyle}>→</div>
          <Stack start vertical>
            {sortByDepth(next, depthMap).map((entry) => (
              <Level
                depth={depth + 1}
                depthMap={depthMap}
                grandParentLevel={parentLevel}
                key={(Array.isArray(entry) ? entry[1] : entry).mapId}
                parentLevel={level}
                winConditions={map.config.winConditions}
                {...commonProps}
                {...(Array.isArray(entry)
                  ? {
                      level: entry[1],
                      winConditionIndex: entry[0],
                    }
                  : { level: entry })}
              />
            ))}
          </Stack>
        </>
      ) : null}
    </Stack>
  );
});

const MiniMap = memo(function MiniMap({
  isInView,
  map,
  mapId,
  onClick,
  renderEntities = true,
  slug,
  zoom = 1,
}: {
  isInView: boolean;
  map: MapData;
  mapId: string;
  onClick: (event: MouseEvent) => void;
  renderEntities?: boolean;
  slug: string;
  zoom?: number;
}) {
  return (
    <Link
      className={miniMapStyle}
      onClick={onClick}
      style={{
        height: map.size.height * TileSize + 'px',
        width: map.size.width * TileSize + 'px',
        zoom,
      }}
      to={getMapRoute(slug, 'edit')}
    >
      <MapComponent
        animationConfig={AnimationConfig}
        behavior={null}
        getLayer={() => 100}
        key={`${mapId}-${map.size.height}-${map.size.width}`}
        map={map}
        paused
        renderEntities={renderEntities && isInView}
        style="floating"
        tileSize={TileSize}
        vision={map.createVisionObject(map.getCurrentPlayer())}
      />
    </Link>
  );
});

const mapCardStyle = css`
  min-width: 240px;
`;

const mapBottomStyle = css`
  margin-top: 8px;
`;

const arrowStyle = css`
  margin: 0 ${TileSize / 2}px;
`;

const tagListStyle = css`
  margin: 0 0 12px;
`;

const selectorContainerStyle = css`
  cursor: pointer;
  position: relative;

  & > div {
    transition-delay: 150ms;
  }
  &:hover > div {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
    transition-delay: 0;
  }
`;

const effectContainerStyle = css`
  & > div {
    transition-delay: 250ms;
  }
`;

const selectorStyle = css`
  ${pixelBorder(applyVar('background-color-light'))}
  background: ${applyVar('background-color-light')};

  cursor: initial;
  opacity: 0;
  pointer-events: none;
  position: absolute;
  transform: scale(0.9);
  transition:
    opacity 150ms ease,
    transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 102;
`;

const winConditionSelectorStyle = css`
  left: -4px;
  overflow-y: auto;
  top: -4px;
`;

const winConditionSelectorItemStyle = css`
  margin: 4px;
  white-space: nowrap;
`;

const effectPanelStyle = css`
  ${pixelBorder(applyVar('background-color-dark'))}

  background: ${applyVar('background-color-dark')};
  left: -12px;
  max-height: min(480px, 90vh);
  overflow: scroll;
  overscroll-behavior: contain;
  position: absolute;
  top: -${TileSize * 6}px;
`;

const miniMapStyle = css`
  cursor: pointer;
  position: relative;
`;

const iconActiveStyle = css`
  color: ${applyVar('text-color-active')};
`;

const iconStyle = css`
  cursor: pointer;
`;

const dialogueIconStyle = css`
  margin-top: 1px;
`;
