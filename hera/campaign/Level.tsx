import { Scenario } from '@deities/apollo/Effects.tsx';
import getMapRoute from '@deities/apollo/routes/getMapRoute.tsx';
import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import {
  AnimationConfig,
  TileSize,
} from '@deities/athena/map/Configuration.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import {
  hasPerformanceExpectation,
  PerformanceStyleComparators,
  PerformanceStyleTypeShortName,
} from '@deities/athena/map/PlayerPerformance.tsx';
import { Reward } from '@deities/athena/map/Reward.tsx';
import MapData from '@deities/athena/MapData.tsx';
import {
  Criteria,
  Objective,
  ObjectiveID,
  Objectives,
} from '@deities/athena/Objectives.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import isPresent from '@deities/hephaestus/isPresent.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import toPlainLevelList from '@deities/hermes/toPlainLevelList.tsx';
import {
  ClientLevelID,
  Level as LevelT,
  PlainLevel,
} from '@deities/hermes/Types.tsx';
import Box from '@deities/ui/Box.tsx';
import Button from '@deities/ui/Button.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Dropdown from '@deities/ui/Dropdown.tsx';
import useAlert from '@deities/ui/hooks/useAlert.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Link from '@deities/ui/Link.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import TagList from '@deities/ui/TagList.tsx';
import Typeahead, { TypeaheadDataSource } from '@deities/ui/Typeahead.tsx';
import { css } from '@emotion/css';
import ArrowLeftBox from '@iconify-icons/pixelarticons/arrow-left-box.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import Edit from '@iconify-icons/pixelarticons/edit.js';
import DialogueIcon from '@iconify-icons/pixelarticons/message-text.js';
import EmptyDialogueIcon from '@iconify-icons/pixelarticons/message.js';
import Pace from '@iconify-icons/pixelarticons/speed-fast.js';
import Subscriptions from '@iconify-icons/pixelarticons/subscriptions.js';
import Zap from '@iconify-icons/pixelarticons/zap.js';
import { fbt } from 'fbt';
import { useInView } from 'framer-motion';
import { memo, MouseEvent, useCallback, useRef, useState } from 'react';
import Portrait from '../character/Portrait.tsx';
import ActionCard from '../editor/lib/ActionCard.tsx';
import EffectSelector from '../editor/selectors/EffectSelector.tsx';
import useEffects from '../hooks/useEffects.tsx';
import useMapData from '../hooks/useMapData.tsx';
import MapComponent from '../Map.tsx';
import ObjectiveTitle from '../objectives/ObjectiveTitle.tsx';
import { SkillIcon } from '../ui/SkillDialog.tsx';
import useEffectCharacters from './hooks/useEffectCharacters.tsx';
import sortByDepth from './lib/sortByDepth.tsx';
import {
  CampaignEditorSaveState,
  CampaignEditorSetMapFunction,
  MapNode,
} from './Types.tsx';

export default memo(function Level({
  depth = 0,
  depthMap,
  grandParentLevel,
  level,
  objectiveId,
  objectives,
  parentLevel,
  ...commonProps
}: {
  dataSource: TypeaheadDataSource<MapNode>;
  depth?: number;
  depthMap: ReadonlyMap<string, number>;
  grandParentLevel?: LevelT<ClientLevelID>;
  level: LevelT<ClientLevelID>;
  maps: ReadonlyMap<ClientLevelID, MapNode>;
  objectiveId?: ObjectiveID;
  objectives?: Objectives;
  parentLevel?: LevelT<ClientLevelID>;
  renderEntities?: boolean;
  replaceFirstLevel: (mapId: ClientLevelID) => void;
  setMap: CampaignEditorSetMapFunction;
  setSaveState: (state: CampaignEditorSaveState) => void;
  updateLevel: (
    level: PlainLevel<ClientLevelID> | ReadonlyArray<PlainLevel<ClientLevelID>>,
    newMap?: MapNode,
  ) => void;
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

  const objective = objectiveId != null && objectives?.get(objectiveId);
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

  const updateObjective = useCallback(
    (objectiveId: ObjectiveID | null) => {
      if (parentLevel) {
        updateLevel({
          ...parentLevel,
          next: [...(parentLevel.next || [])].map((entry) => {
            const isArray = Array.isArray(entry);
            const { mapId } = isArray ? entry[1] : entry;
            // Only mutate if the level id matches.
            if (mapId === level.mapId) {
              return objectiveId != null ? [objectiveId, mapId] : mapId;
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

  const rewardObjectives = [
    ...map.config.objectives
      .filter(
        (objective): objective is Objective & Readonly<{ reward: Reward }> =>
          !!objective.reward,
      )
      .values(),
  ];

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
          <Dropdown
            dropdownClassName={objectiveSelectorStyle}
            title={
              objective && objectiveId != null ? (
                <ObjectiveTitle id={objectiveId} objective={objective} short />
              ) : (
                depth > 0 && (
                  <fbt desc="Short description for 'any objective'">Win</fbt>
                )
              )
            }
          >
            {parentLevel && (
              <>
                <InlineLink
                  className={objectiveSelectorItemStyle}
                  onClick={() => updateObjective(null)}
                  selectedText={
                    objectiveId == null ||
                    (objective && objective.type === Criteria.Default)
                  }
                >
                  <fbt desc="Long description for 'any objective'">
                    Win (in any way)
                  </fbt>
                </InlineLink>
                {[
                  ...(objectives
                    ?.map((objective, id) =>
                      objective.type !== Criteria.Default ? (
                        <InlineLink
                          className={objectiveSelectorItemStyle}
                          key={id}
                          onClick={() => updateObjective(id)}
                          selectedText={id === objectiveId}
                        >
                          <ObjectiveTitle id={id} objective={objective} />
                        </InlineLink>
                      ) : null,
                    )
                    .filter(isPresent)
                    .values() || []),
                ]}
              </>
            )}
          </Dropdown>
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
            <Stack className={mapDetailStyle} gap vertical>
              {hasPerformanceExpectation(map) && (
                <Stack alignCenter gap={16} start>
                  {map.config.performance.pace != null && (
                    <Stack gap start>
                      <Icon icon={Pace} />
                      <div>{map.config.performance.pace}</div>
                    </Stack>
                  )}
                  {map.config.performance.power != null && (
                    <Stack gap start>
                      <Icon icon={Zap} />
                      <div>{map.config.performance.power}</div>
                    </Stack>
                  )}
                  {map.config.performance.style != null && (
                    <Stack gap start>
                      <Icon icon={Subscriptions} />
                      <span>
                        {
                          PerformanceStyleTypeShortName[
                            map.config.performance.style[0]
                          ]
                        }{' '}
                        <span className={comparatorStyle}>
                          {
                            PerformanceStyleComparators[
                              map.config.performance.style[0]
                            ]
                          }
                        </span>{' '}
                        {map.config.performance.style[1]}
                      </span>
                    </Stack>
                  )}
                </Stack>
              )}
              {rewardObjectives.length ? (
                <Stack alignCenter gap start>
                  {rewardObjectives.length === 1 ? (
                    <fbt desc="Label for reward">Reward</fbt>
                  ) : (
                    <fbt desc="Label for rewards">Rewards</fbt>
                  )}
                  <Stack gap={16} start>
                    {rewardObjectives.map((objective, index) => (
                      <RewardDetail
                        key={index}
                        player={map.getFirstPlayerID()}
                        reward={objective.reward}
                      />
                    ))}
                  </Stack>
                </Stack>
              ) : null}
              {characters.length ? (
                <Dropdown
                  className={effectContainerStyle}
                  dropdownClassName={effectPanelStyle}
                  shouldRenderControls={isInView && !!effects}
                  title={
                    <Stack gap start>
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
                    </Stack>
                  }
                >
                  <Stack gap nowrap padding vertical>
                    <Stack alignCenter gap={16} nowrap>
                      <EffectSelector
                        effects={effects}
                        objectives={map.config.objectives}
                        scenario={scenario}
                        setScenario={(scenario) => setScenario(scenario)}
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
                </Dropdown>
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
                objectives={map.config.objectives}
                parentLevel={level}
                {...commonProps}
                {...(Array.isArray(entry)
                  ? {
                      level: entry[1],
                      objectiveId: entry[0],
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

const RewardDetail = ({
  player,
  reward,
}: {
  player: PlayerID;
  reward: Reward;
}) => {
  const { type: rewardType } = reward;
  switch (rewardType) {
    case 'Skill':
      return <SkillIcon skill={reward.skill} />;
    case 'UnitPortraits':
      return (
        <Portrait
          clip
          player={player}
          scale={0.5}
          unit={reward.unit}
          variant={0}
        />
      );
    default: {
      rewardType satisfies never;
      throw new UnknownTypeError('Level::Reward', rewardType);
    }
  }
};

const mapCardStyle = css`
  min-width: 240px;
`;

const mapDetailStyle = css`
  padding-top: 8px;
`;

const arrowStyle = css`
  margin: 0 ${TileSize / 2}px;
`;

const tagListStyle = css`
  margin: 0 0 12px;
`;

const effectContainerStyle = css`
  & > div {
    transition-delay: 250ms;
  }
`;

const objectiveSelectorStyle = css`
  ${pixelBorder(applyVar('background-color-light'))}

  backdrop-filter: blur(2px);
  background: ${applyVar('background-color-light')};
  left: -4px;
  overflow-y: auto;
  top: -4px;
  z-index: 102;
`;

const objectiveSelectorItemStyle = css`
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
  top: -${TileSize * 6}px;
  z-index: 102;
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

const comparatorStyle = css`
  font-family: ui-sans-serif, system-ui, sans-serif;
  font-weight: 200;
  text-align: center;
  width: 16px;
`;
