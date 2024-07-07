import { Action } from '@deities/apollo/Action.tsx';
import { EffectTrigger } from '@deities/apollo/Effects.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { getUnitInfoOrThrow } from '@deities/athena/info/Unit.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import { Biome } from '@deities/athena/map/Biome.tsx';
import {
  AnimationConfig,
  MaxMessageLength,
} from '@deities/athena/map/Configuration.tsx';
import {
  DynamicPlayerIDs,
  encodeDynamicPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import Box from '@deities/ui/Box.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar, CSSVariables } from '@deities/ui/cssVar.tsx';
import Dropdown from '@deities/ui/Dropdown.tsx';
import Icon from '@deities/ui/Icon.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import ChevronDown from '@iconify-icons/pixelarticons/chevron-down.js';
import ChevronUp from '@iconify-icons/pixelarticons/chevron-up.js';
import Close from '@iconify-icons/pixelarticons/close.js';
import ImmutableMap from '@nkzw/immutable-map';
import { fbt } from 'fbt';
import { useInView } from 'framer-motion';
import { memo, RefObject, useRef, useState } from 'react';
import InlineTileList from '../../card/InlineTileList.tsx';
import Portrait from '../../character/Portrait.tsx';
import { DrawerPosition } from '../../drawer/Drawer.tsx';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';
import Tick from '../../Tick.tsx';
import { FactionNames } from '../../Types.tsx';
import formatCharacterText from '../../ui/lib/formatCharacterText.tsx';
import PlayerIcon from '../../ui/PlayerIcon.tsx';
import { ActionChangeFn } from '../panels/EffectsPanel.tsx';
import { SetMapFunction } from '../Types.tsx';
import UnitSelector from './UnitSelector.tsx';

const playerIDs = sortBy([...DynamicPlayerIDs], (id) => {
  if (id === 0) {
    return Number.POSITIVE_INFINITY;
  }

  const number = encodeDynamicPlayerID(id);
  return number < 0 ? 1 / number : number;
});

const TopBarIcons = ({
  first,
  index,
  last,
  onChange,
}: {
  first: boolean | undefined;
  index: number | undefined;
  last: boolean | undefined;
  onChange: ActionChangeFn | undefined;
}) =>
  onChange && index != null ? (
    <Stack nowrap>
      {!first && (
        <Icon
          button
          className={iconStyle}
          icon={ChevronUp}
          onClick={() => onChange(index, 'up')}
        />
      )}
      {!last && (
        <Icon
          button
          className={iconStyle}
          icon={ChevronDown}
          onClick={() => onChange(index, 'down')}
        />
      )}
      <Icon
        button
        className={iconStyle}
        icon={Close}
        onClick={() => onChange(index, 'delete')}
      />
    </Stack>
  ) : null;

export default memo(function ActionCard({
  action,
  biome,
  currentPlayer,
  factionNames,
  first,
  focused,
  formatText,
  hasContentRestrictions,
  index,
  last,
  map,
  onChange,
  position = 'bottom',
  scrollRef,
  setMap,
  trigger,
  user,
  userDisplayName,
}: {
  action: Action;
  biome: Biome;
  currentPlayer?: PlayerID;
  factionNames?: FactionNames;
  first?: boolean;
  focused?: true;
  formatText?: true;
  hasContentRestrictions: boolean;
  index?: number;
  last?: boolean;
  map?: MapData;
  onChange?: ActionChangeFn;
  position?: DrawerPosition;
  scrollRef: RefObject<HTMLElement> | null;
  setMap?: SetMapFunction;
  trigger?: EffectTrigger;
  user: UserWithFactionNameAndSkills | null;
  userDisplayName?: string;
}) {
  const ref = useRef(null);
  const isVisible = useInView(ref, {
    margin: '-100px 0px 100px 0px',
    root: scrollRef || undefined,
  });
  const canChange = onChange && index != null;
  const shouldRenderControls = (!scrollRef || isVisible) && canChange;
  const [animate, setAnimate] = useState(false);
  const hasCurrentPlayer = map && currentPlayer != null;

  if (action.type === 'CharacterMessageEffect') {
    const unit = getUnitInfoOrThrow(action.unitId);
    const portrait = unit?.sprite.portrait;
    const player = hasCurrentPlayer
      ? resolveDynamicPlayerID(map, action.player, currentPlayer)
      : action.player;
    const message =
      formatText && factionNames && map && userDisplayName
        ? formatCharacterText(
            action.message,
            unit,
            hasCurrentPlayer && currentPlayer === player
              ? 'characterName'
              : 'name',
            map,
            userDisplayName,
            player as PlayerID,
            factionNames,
          )
        : action.message;

    return (
      <Stack
        className={messageStyle}
        nowrap
        ref={ref}
        start
        style={{
          [vars.set('portraits')]: portrait.variants,
        }}
      >
        <Dropdown
          className={portraitStyle}
          dropdownClassName={cx(
            portraitSelectorStyle,
            position === 'bottom' &&
              cx(
                bottomPortraitSelectorStyle,
                portrait.variants > 3 && portraitWithManyVariantsStyle,
              ),
          )}
          shouldRenderControls={!!(canChange && shouldRenderControls)}
          title={
            <Portrait
              animate={isVisible && animate}
              player={player}
              unit={unit}
              variant={action.variant}
            />
          }
        >
          <Stack gap nowrap>
            {Array.from({ length: portrait.variants }, (_, index) => index).map(
              (variant) => (
                <div
                  className={cx(
                    selectPortraitStyle,
                    (action.variant || 0) === variant && selectedPortraitStyle,
                  )}
                  key={variant}
                  onClick={
                    canChange
                      ? () => onChange(index, 'update', { ...action, variant })
                      : undefined
                  }
                >
                  <Portrait
                    animate={isVisible}
                    player={player}
                    unit={unit}
                    variant={variant}
                  />
                </div>
              ),
            )}
          </Stack>
        </Dropdown>
        <Box className={boxMarginStyle} gap start vertical>
          <Stack className={headlineStyle} nowrap>
            <Stack gap nowrap start stretch>
              {!hasCurrentPlayer && (
                <Dropdown
                  dropdownClassName={playerSelectorStyle}
                  shouldRenderControls={!!(canChange && shouldRenderControls)}
                  title={<PlayerIcon id={player} inline />}
                >
                  <Stack className={playerSelectorListStyle} nowrap vertical>
                    {playerIDs.map((id) => (
                      <PlayerIcon
                        id={id}
                        key={id}
                        onClick={
                          canChange
                            ? () =>
                                onChange(index, 'update', {
                                  ...action,
                                  player: id,
                                })
                            : undefined
                        }
                        selected={player === id}
                      />
                    ))}
                  </Stack>
                </Dropdown>
              )}
              <UnitSelector
                currentPlayer={currentPlayer}
                hasContentRestrictions={hasContentRestrictions}
                isVisible={isVisible}
                map={map}
                onSelect={
                  canChange
                    ? ({ id }) =>
                        onChange(index, 'update', {
                          ...action,
                          unitId: id,
                          variant: undefined,
                        })
                    : undefined
                }
                selectedPlayer={action.player}
                selectedUnit={unit}
                user={user}
              />
            </Stack>
            <TopBarIcons
              first={first}
              index={index}
              last={last}
              onChange={onChange}
            />
          </Stack>
          {canChange ? (
            <textarea
              className={cx(textareaStyle, heightStyle)}
              maxLength={MaxMessageLength}
              onBlur={() => setAnimate(false)}
              onChange={(event) =>
                onChange(index, 'update', {
                  ...action,
                  message: event.target.value,
                })
              }
              onFocus={() => setAnimate(true)}
              placeholder={fbt(
                'Type a message…',
                'Placeholder for action message text',
              )}
              value={action.message}
            />
          ) : (
            <div className={cx(textareaStyle, selectableTextStyle)}>
              {message}
            </div>
          )}
        </Box>
      </Stack>
    );
  } else if (action.type === 'SpawnEffect') {
    const { player } = action;
    return (
      <Box className={boxStyle} gap={16} vertical>
        <Stack className={headlineStyle} nowrap>
          <h2>
            <fbt desc="Label for Spawn Effect">Spawn</fbt>
          </h2>
          {!focused && (
            <TopBarIcons
              first={first}
              index={index}
              last={last}
              onChange={onChange}
            />
          )}
        </Stack>
        <Stack gap vertical>
          <Stack alignNormal>
            <Tick animationConfig={AnimationConfig}>
              <InlineTileList
                biome={biome}
                onSelect={
                  canChange && setMap && map
                    ? ({ index: unitIndex }) => {
                        const units = [...action.units];
                        const [vector, unit] = units[unitIndex];

                        if (
                          canDeploy(
                            map.copy({ units: map.units.delete(vector) }),
                            unit.info,
                            vector,
                            true,
                          )
                        ) {
                          setMap(
                            'units',
                            map.copy({
                              units: map.units.set(vector, unit),
                            }),
                          );
                        }

                        onChange(index, 'update', {
                          ...action,
                          units: ImmutableMap(
                            units.filter((_, index) => index !== unitIndex),
                          ),
                        });
                      }
                    : undefined
                }
                tiles={[...action.units.keys()].map(
                  (vector) => map?.getTileInfo(vector) || Plain,
                )}
                units={[...action.units.values()]}
              />
            </Tick>
          </Stack>
        </Stack>
        <Stack alignCenter gap={16}>
          <fbt desc="Label to pick which player to spawn units as">
            Spawn units as player:
          </fbt>
          <Stack gap={16} nowrap>
            {canChange ? (
              <>
                <InlineLink
                  className={spawnLinkStyle}
                  onClick={() =>
                    onChange(index, 'update', {
                      ...action,
                      player: undefined,
                    })
                  }
                  selected={player == null}
                >
                  <fbt desc="Label for spawning players as is">default</fbt>
                </InlineLink>
                {playerIDs.map((id) => (
                  <PlayerIcon
                    id={id}
                    key={id}
                    onClick={() =>
                      onChange(index, 'update', {
                        ...action,
                        player: id,
                      })
                    }
                    selected={player === id}
                  />
                ))}
              </>
            ) : player == null ? (
              <fbt desc="Label for spawning players as is">default</fbt>
            ) : (
              <PlayerIcon id={player} />
            )}
          </Stack>
        </Stack>
        {canChange ? (
          <Stack start>
            <InlineLink onClick={() => onChange(index, 'toggle-select-units')}>
              {focused ? (
                <fbt desc="Label to stop selecting units">
                  Stop selecting units
                </fbt>
              ) : (
                <fbt desc="Button to select spawn effect units">
                  Select units
                </fbt>
              )}
            </InlineLink>
          </Stack>
        ) : null}
        {trigger === 'GameEnd' && (
          <p className={lightStyle}>
            <fbt desc="Game end spawn effect conflict note">
              Note: This Action is associated with a Game End Effect and will be
              removed upon saving. If you want to keep this action, please
              change the effect type, for example by changing the objective to
              be optional.
            </fbt>
          </p>
        )}
      </Box>
    );
  }

  return (
    <Box className={boxStyle}>
      <Stack className={headlineStyle} nowrap>
        <h2>{action.type}</h2>
        <TopBarIcons
          first={first}
          index={index}
          last={last}
          onChange={onChange}
        />
      </Stack>
    </Box>
  );
});

const vars = new CSSVariables<'portraits'>('ad');

const boxStyle = css`
  margin: 4px 2px 4px 0px;
  flex-shrink: 0;
`;

const portraitStyle = css`
  height: fit-content;
`;

const portraitSelectorStyle = css`
  bottom: -2px;
  left: -4px;
  padding: 2px 4px;
  top: -2px;
  transform-origin: left center;
`;

const bottomPortraitSelectorStyle = css`
  ${Breakpoints.lg} {
    transform-origin: center center;
    left: calc(
      (${vars.apply('portraits')} - 1) * -50% -
        (${vars.apply('portraits')} * 4px)
    );
    right: calc(
      (${vars.apply('portraits')} - 1) * -50% -
        (${vars.apply('portraits')} * 4px)
    );
  }
`;

const portraitWithManyVariantsStyle = css`
  ${Breakpoints.lg} {
    left: calc(
      (${vars.apply('portraits')} - 4) * -50% -
        ((${vars.apply('portraits')} - 3) * 4px)
    );
    right: calc(
      (${vars.apply('portraits')} - 2) * -100% -
        ((${vars.apply('portraits')} + 3) * 4px)
    );
  }
`;

const selectPortraitStyle = css`
  cursor: pointer;

  transition:
    transform 150ms ease,
    filter 150ms ease;
  transform: scale(1);
  filter: grayscale(1);

  &:hover {
    transform: scale(1.04);
  }

  &:active {
    transform: scale(0.96);
  }
`;

const selectedPortraitStyle = css`
  filter: grayscale(0);
`;

const playerSelectorStyle = css`
  left: -12px;
  overflow-y: auto;
  top: -12px;
`;

const playerSelectorListStyle = css`
  gap: 12px;
  padding: 2px;
  padding: 8px;
`;

const messageStyle = css`
  margin: 0 2px 0 -4px;
`;

const boxMarginStyle = css`
  align-content: start;
  align-items: start;
  flex-grow: 1;
  margin: 4px 0 4px 16px;
`;

const headlineStyle = css`
  height: 1em;
  width: 100%;
`;

const textareaStyle = css`
  html body & {
    background: none;
    box-shadow: none;
    line-height: 1.4em;
    margin: 0;
    padding: 0;

    &:focus {
      box-shadow: none;
    }
  }
`;

const heightStyle = css`
  height: 90px;
  overflow: auto;
`;

const selectableTextStyle = css`
  user-select: text;
`;

const iconStyle = css`
  margin: 0 4px 4px;
  cursor: pointer;
`;

const spawnLinkStyle = css`
  ${pixelBorder(applyVar('background-color'), 2)}

  background: ${applyVar('background-color')};
  align-items: center;
  padding: 0 4px;
`;

const lightStyle = css`
  opacity: 0.7;
`;
