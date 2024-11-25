import {
  getSkillConfig,
  Skill,
  SkillGroup,
} from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { SquareButtonStyle } from '@deities/ui/Button.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useBlockInput from '@deities/ui/controls/useBlockInput.tsx';
import useHorizontalMenuNavigation from '@deities/ui/controls/useHorizontalMenuNavigation.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import useMenuNavigation from '@deities/ui/controls/useMenuNavigation.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Dialog, {
  DialogScrollContainer,
  DialogTab,
  DialogTabBar,
} from '@deities/ui/Dialog.tsx';
import getColor, { BaseColor } from '@deities/ui/getColor.tsx';
import gradient from '@deities/ui/gradient.tsx';
import useScrollIntoView from '@deities/ui/hooks/useScrollIntoView.tsx';
import Icon, { SVGIcon } from '@deities/ui/Icon.tsx';
import Question from '@deities/ui/icons/Question.tsx';
import SkillBorder, {
  SkillBorderIcons,
  SkillIconBorderStyle,
} from '@deities/ui/icons/SkillBorder.tsx';
import Skills from '@deities/ui/icons/Skills.tsx';
import InfoBox from '@deities/ui/InfoBox.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Portal from '@deities/ui/Portal.tsx';
import { RainbowStyle, SquarePulseStyle } from '@deities/ui/PulseStyle.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import { Sprites } from 'athena-crisis:images';
import {
  ReactElement,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import getTranslatedCrystalName from '../invasions/getTranslatedCrystalName.tsx';
import getSkillConfigForDisplay from '../lib/getSkillConfigForDisplay.tsx';
import SkillDescription from './SkillDescription.tsx';
import StarIcon from './StarIcon.tsx';

const SkillIconInternal = ({
  active,
  background,
  borderStyle,
  button,
  canActivate,
  color,
  disabled,
  icon,
  isFocused,
  onClick,
}: {
  active?: boolean;
  background?: string;
  borderStyle?: SkillIconBorderStyle;
  button?: boolean;
  canActivate?: boolean;
  color?: BaseColor;
  disabled?: boolean;
  icon: SVGIcon;
  isFocused?: boolean;
  onClick?: () => void;
}) => {
  const isInteractive = (button || onClick) && !disabled;
  return (
    <>
      <div
        className={cx(
          containerStyle,
          isInteractive && SquareButtonStyle,
          isInteractive && hoverStyle,
          (active || canActivate) && !disabled && SquarePulseStyle,
          isInteractive && isFocused && 'hover',
          isInteractive && isFocused && SquarePulseStyle,
        )}
        onClick={onClick}
      >
        <Icon
          className={cx(borderIconStyle, active && RainbowStyle)}
          icon={(borderStyle && SkillBorderIcons[borderStyle]) || SkillBorder}
          style={{
            color: disabled
              ? applyVar('text-color-light')
              : color
                ? getColor(color)
                : undefined,
            height: SkillBorder.height,
            width: SkillBorder.width,
          }}
        />
        <div className={skillStyle}>
          {background && (
            <div
              className={backgroundStyle}
              style={{
                background,
              }}
            />
          )}
          <Icon
            className={iconStyle}
            icon={icon}
            style={{
              height: 20,
              width: 20,
            }}
          />
        </div>
      </div>
    </>
  );
};

const containerStyle = css`
  position: relative;
`;

const skillStyle = css`
  align-items: center;
  display: inline-flex;
  height: ${TileSize}px;
  justify-content: center;
  position: relative;
  width: ${TileSize}px;

  color: ${applyVar('text-color')};
  &:hover {
    color: ${applyVar('text-color')};
  }
`;

const borderIconStyle = css`
  color: ${applyVar('border-color')};
  inset: -2px;
  position: absolute;
  z-index: 2;
`;

const hoverStyle = css`
  ${`.${borderIconStyle}`} {
    transition: color 150ms ease;
  }

  &:hover ${`.${borderIconStyle}`} {
    color: ${applyVar('text-color')};
  }
`;

const backgroundStyle = css`
  image-rendering: pixelated;
  inset: 0;
  mask-image: url('${Sprites.Noise}'),
    linear-gradient(
      to bottom right,
      rgba(0, 0, 0, 0.7) 0%,
      rgba(0, 0, 0, 0.7) 50%
    );
  position: absolute;
  z-index: 1;
`;

const iconStyle = css`
  position: relative;
  z-index: 2;
`;

export default function SkillDialog({
  actionName,
  availableSkills,
  blocklistedAreDisabled,
  blocklistedSkills,
  canAction,
  children,
  currentSkill,
  favorites,
  focus,
  onAction,
  onClose,
  onSelect,
  selectedSkills,
  showCost,
  size,
  tabs,
  toggleBlocklist,
  toggleFavorite,
  transformOrigin,
}: {
  actionName?: ReactElement;
  availableSkills: ReadonlySet<Skill>;
  blocklistedAreDisabled?: boolean;
  blocklistedSkills?: ReadonlySet<Skill> | null;
  canAction?: (skill: Skill) => boolean;
  children?: ReactNode;
  currentSkill?: Skill | null;
  favorites?: ReadonlySet<Skill>;
  focus?: boolean;
  onAction?: (skill: Skill) => void;
  onClose: () => void;
  onSelect?: (skill: Skill | null) => void;
  selectedSkills?: ReadonlySet<Skill> | null;
  showCost?: boolean;
  size?: 'small';
  tabs?: ReactNode;
  toggleBlocklist?: boolean;
  toggleFavorite?: (skill: Skill) => void;
  transformOrigin?: string;
}) {
  return (
    <Dialog
      onClose={onClose}
      size={size}
      transformOrigin={transformOrigin || 'center center'}
    >
      <SkillContainer
        actionName={actionName}
        availableSkills={availableSkills}
        blocklistedAreDisabled={blocklistedAreDisabled}
        blocklistedSkills={blocklistedSkills}
        canAction={canAction}
        currentSkill={currentSkill}
        favorites={favorites}
        focus={focus}
        onAction={onAction}
        onClose={onClose}
        onSelect={onSelect}
        selectedSkills={selectedSkills}
        showCost={showCost}
        toggleBlocklist={toggleBlocklist}
        toggleFavorite={toggleFavorite}
      >
        {children}
      </SkillContainer>
      {tabs && <DialogTabBar>{tabs}</DialogTabBar>}
    </Dialog>
  );
}

type SkillGroupType = SkillGroup | 'all' | 'favorite';

export function SkillContainer({
  actionName,
  availableSkills: initialAvailableSkills,
  blocklistedAreDisabled,
  blocklistedSkills: initialBlocklistedSkills,
  canAction,
  children,
  currentSkill,
  favorites,
  focus,
  onAction,
  onClose,
  onSelect,
  selectedSkills,
  showCost,
  toggleBlocklist,
  toggleFavorite,
}: {
  actionName?: ReactElement;
  availableSkills: ReadonlySet<Skill>;
  blocklistedAreDisabled?: boolean;
  blocklistedSkills?: ReadonlySet<Skill> | null;
  canAction?: (skill: Skill) => boolean;
  children?: ReactNode;
  currentSkill?: Skill | null;
  favorites?: ReadonlySet<Skill>;
  focus?: boolean;
  onAction?: (skill: Skill) => void;
  onClose: () => void;
  onSelect?: (skill: Skill | null) => void;
  selectedSkills?: ReadonlySet<Skill> | null;
  showCost?: boolean;
  toggleBlocklist?: boolean;
  toggleFavorite?: (skill: Skill) => void;
}) {
  const hasAction = onAction && actionName && currentSkill;
  const [group, _setGroup] = useState<SkillGroupType>('all');
  const [favoriteList, setFavoriteList] = useState(() => new Set(favorites));
  const [availableSkills, skillGroups] = useMemo(() => {
    const availableSkills =
      group === 'all'
        ? initialAvailableSkills
        : new Set(
            [...initialAvailableSkills].filter((skill) =>
              group === 'favorite'
                ? favoriteList?.has(skill)
                : getSkillConfig(skill).group === group,
            ),
          );
    return [
      availableSkills,
      new Set(
        [...initialAvailableSkills].map((skill) => getSkillConfig(skill).group),
      ),
    ] as const;
  }, [group, initialAvailableSkills, favoriteList]);

  const partition = groupBy(availableSkills, (skill) =>
    selectedSkills?.has(skill)
      ? 'selected'
      : !blocklistedAreDisabled &&
          !toggleBlocklist &&
          initialBlocklistedSkills?.has(skill)
        ? 'disabled'
        : 'enabled',
  );
  const enabledSkills = partition.get('enabled');
  const disabledSkills = partition.get('disabled');

  useBlockInput('dialog');

  const [hasUsedNavigation, setHasUsedNavigation] = useState(false);
  const offset = initialAvailableSkills.size > 1 ? 1 : 0;
  const [selected, , reset] = useMenuNavigation(
    offset + (enabledSkills?.length || 0),
    'dialog',
    true,
    hasUsedNavigation ? 0 : -1,
  );

  const groupItems = 1 + skillGroups.size + (favorites ? 1 : 0);
  const [selectedGroup, activeGroup] = useHorizontalMenuNavigation(
    offset && selected === 0 ? groupItems : 0,
    'dialog',
    false,
    group === 'all'
      ? 0
      : group === 'favorite'
        ? groupItems - 1
        : [...skillGroups].indexOf(group) + 1,
  );

  const setGroup = useCallback(
    (group: SkillGroupType) => {
      setFavoriteList(new Set(favorites));
      _setGroup(group);
      setHasUsedNavigation(activeGroup !== -1);
      reset();
    },
    [activeGroup, favorites, reset],
  );

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (
          selected === -1 &&
          onAction &&
          currentSkill &&
          (!canAction || canAction(currentSkill))
        ) {
          event.preventDefault();
          onAction(currentSkill);
        }
      },
      [canAction, currentSkill, onAction, selected],
    ),
    'dialog',
  );

  useInput(
    'cancel',
    useCallback(
      (event) => {
        event.preventDefault();

        onClose();
      },
      [onClose],
    ),
    // Has to be on top in order not to interfere with the Map.
    'top',
  );

  const blocklistedSkills = new Set(initialBlocklistedSkills);
  if (blocklistedAreDisabled && initialBlocklistedSkills && currentSkill) {
    blocklistedSkills.delete(currentSkill);
  }

  const key = currentSkill && focus ? `skill-${currentSkill}` : 'skill';
  return (
    <DialogScrollContainer key={key} navigate={false}>
      <Stack gap={16} vertical>
        {focus ? (
          <h2>
            <fbt desc="Headline to view a skill">Skill</fbt>
          </h2>
        ) : (
          <h1>
            {onSelect ? (
              <fbt desc="Headline to choose a skill">Choose a skill</fbt>
            ) : availableSkills.size > 1 ? (
              <fbt desc="Headline to view skills">Skills</fbt>
            ) : (
              <fbt desc="Headline to view a skill">Skill</fbt>
            )}
          </h1>
        )}
        {initialAvailableSkills.size > 1 && (
          <Stack gap={16}>
            <InlineLink
              active={activeGroup === 0}
              className={buttonStyle}
              hover={group === 'all'}
              onClick={() => setGroup('all')}
              selected={selectedGroup === 0}
            >
              <fbt desc="View all skills">All</fbt>
            </InlineLink>
            {[...skillGroups].map((currentGroup, index) => (
              <InlineLink
                active={activeGroup === 1 + index}
                className={buttonStyle}
                hover={group === currentGroup}
                key={currentGroup}
                onClick={() => setGroup(currentGroup)}
                selected={selectedGroup === 1 + index}
              >
                {currentGroup === SkillGroup.Attack ? (
                  <fbt desc="Filter by attack-based skills">Attack</fbt>
                ) : currentGroup === SkillGroup.Defense ? (
                  <fbt desc="Filter by defense-based skills">Defense</fbt>
                ) : currentGroup === SkillGroup.Unlock ? (
                  <fbt desc="Filter by unlock-based skills">Unlock</fbt>
                ) : currentGroup === SkillGroup.Special ? (
                  <fbt desc="Filter by special-based skills">Special</fbt>
                ) : currentGroup === SkillGroup.Invasion ? (
                  <fbt desc="Filter by invasion-based skills">Invasion</fbt>
                ) : currentGroup === SkillGroup.AI ? (
                  <fbt desc="Filter by AI-based skills">AI</fbt>
                ) : null}
              </InlineLink>
            ))}
            {favorites && (
              <InlineLink
                active={activeGroup === groupItems - 1}
                className={buttonStyle}
                hover={group === 'favorite'}
                onClick={() => setGroup('favorite')}
                selected={selectedGroup === groupItems - 1}
              >
                <fbt desc="View favorite skills">Favorite</fbt>
              </InlineLink>
            )}
          </Stack>
        )}
        <Stack gap vertical>
          {enabledSkills?.map((skill, index) => (
            <SkillListItem
              blocklistedSkills={blocklistedSkills}
              currentSkill={!focus ? currentSkill : undefined}
              isFavorite={favorites?.has(skill)}
              key={skill}
              onSelect={
                !hasAction || !canAction || canAction(skill)
                  ? onSelect
                  : undefined
              }
              selected={selected === index + offset}
              showCost={showCost}
              skill={skill}
              toggleBlocklist={toggleBlocklist}
              toggleFavorite={toggleFavorite}
            />
          ))}
        </Stack>
        {selectedSkills?.size ? (
          <Stack gap={16} vertical>
            <h2>
              <fbt desc="Headline to for already selected skills">
                Skills selected in other slots
              </fbt>
            </h2>
            <Stack gap vertical>
              {[...selectedSkills].map((skill) => (
                <SkillListItem
                  blocklistedSkills={selectedSkills}
                  currentSkill={currentSkill}
                  isFavorite={favorites?.has(skill)}
                  key={skill}
                  onSelect={onSelect}
                  showCost={showCost}
                  skill={skill}
                  toggleBlocklist={toggleBlocklist}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </Stack>
          </Stack>
        ) : null}
        {disabledSkills?.length ? (
          <Stack gap={16} vertical>
            <h2>
              <fbt desc="Headline to for disabled skills">Disabled skills</fbt>
            </h2>
            <Stack gap={16} vertical>
              {disabledSkills.map((skill) => (
                <SkillListItem
                  blocklistedSkills={initialBlocklistedSkills}
                  currentSkill={currentSkill}
                  isFavorite={favorites?.has(skill)}
                  key={skill}
                  onSelect={onSelect}
                  showCost={showCost}
                  skill={skill}
                  toggleBlocklist={toggleBlocklist}
                  toggleFavorite={toggleFavorite}
                />
              ))}
            </Stack>
          </Stack>
        ) : null}
        {children}
      </Stack>
    </DialogScrollContainer>
  );
}

const SkillListItem = ({
  blocklistedSkills,
  currentSkill,
  isFavorite,
  onSelect,
  selected,
  showCost,
  skill,
  toggleBlocklist,
  toggleFavorite,
}: {
  blocklistedSkills?: ReadonlySet<Skill> | null;
  currentSkill?: Skill | null;
  isFavorite?: boolean;
  onSelect?: (skill: Skill | null) => void;
  selected?: boolean;
  showCost?: boolean;
  skill: Skill;
  toggleBlocklist?: boolean;
  toggleFavorite?: (skill: Skill) => void;
}) => {
  const element = useRef<HTMLDivElement>(null);
  const isPointerRef = useRef(false);
  const { alpha, borderStyle, colors, icon, name, textColor } =
    getSkillConfigForDisplay(skill);

  const onClick = useCallback(() => {
    if (!isPointerRef.current) {
      onSelect?.(skill);
    }
    isPointerRef.current = false;
  }, [onSelect, skill]);

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (selected && onSelect) {
          event.preventDefault();
          onSelect(currentSkill === skill ? null : skill);
        }
      },
      [selected, currentSkill, onSelect, skill],
    ),
    'dialog',
  );

  useScrollIntoView(element, selected);

  const isBlocked = blocklistedSkills?.has(skill);
  const isInteractive = onSelect && (toggleBlocklist || !isBlocked);
  const background = gradient(colors, alpha);
  const color: BaseColor = Array.isArray(colors) ? colors[0] : colors;

  return (
    <Stack
      className={cx(boxStyle, selected && selectedBoxStyle)}
      gap
      key={skill}
      ref={element}
      vertical
    >
      <Stack
        className={cx(
          itemStyle,
          isBlocked && blockedStyle,
          selected && 'hover',
        )}
        gap
        onClick={isInteractive ? onClick : undefined}
        onPointerDown={(event) => {
          isPointerRef.current = event.pointerType === 'touch';
        }}
        vertical
      >
        <Stack alignCenter gap nowrap>
          <Stack alignCenter gap nowrap start>
            {currentSkill === skill && <div>{'\u00bb'}</div>}
            <SkillIconInternal
              background={background}
              borderStyle={borderStyle}
              color={color}
              icon={icon}
            />
            <div
              className={tagStyle}
              style={{
                background,
                color:
                  alpha != null && alpha >= 0.5 ? textColor : getColor(color),
              }}
            >
              {name}
            </div>
          </Stack>
          {toggleFavorite && (
            <div
              className={SquareButtonStyle}
              onClick={(event) => {
                event.stopPropagation();
                toggleFavorite(skill);
              }}
            >
              <StarIcon
                size="small"
                type={isFavorite ? 'achieved' : 'missed'}
              />
            </div>
          )}
        </Stack>
        <Stack className={descriptionStyle} gap vertical>
          <SkillDescription color={color} skill={skill} type="regular" />
          <SkillDescription color={color} skill={skill} type="power" />
        </Stack>
      </Stack>
      {showCost && (
        <Stack className={costStyle} gap nowrap start>
          <Icon className={coinIconStyle} icon={Coin} />
          {getSkillConfig(skill).cost}
        </Stack>
      )}
      {currentSkill === skill && onSelect && (
        <div className={descriptionStyle}>
          <InlineLink onClick={() => onSelect(null)}>
            <fbt desc="Remove current skill">Remove this skill</fbt>
          </InlineLink>
        </div>
      )}
    </Stack>
  );
};

const DisabledSkillDialog = ({ onClose }: { onClose: () => void }) => {
  useInput('cancel', onClose, 'dialog');

  useBlockInput('dialog');

  return (
    <Dialog onClose={onClose} size={'small'} transformOrigin={'center center'}>
      <DialogScrollContainer key="skill" navigate={false}>
        <Stack gap={16} vertical>
          <h1>
            <fbt desc="Headline to view a skill">Skill</fbt>
          </h1>
          <InfoBox>
            <p>
              <fbt desc="Explanation for why a skill slot is disabled.">
                You cannot bring more skills into an invasion than the player
                with the{' '}
                <fbt:param name="crystalName">
                  {getTranslatedCrystalName(Crystal.Power)}
                </fbt:param>. They currently have fewer unlocked skill slots
                than you.
              </fbt>
            </p>
          </InfoBox>
        </Stack>
      </DialogScrollContainer>
    </Dialog>
  );
};

export function SkillSelector({
  availableSkills,
  blocklistedAreDisabled: blocklistedAreUnavailable,
  blocklistedSkills,
  currentSkill,
  disabled,
  favorites,
  isFocused,
  onSelect,
  selectedSkills,
  showCost,
  slot,
  toggleFavorite,
}: {
  availableSkills: ReadonlySet<Skill>;
  blocklistedAreDisabled?: boolean;
  blocklistedSkills?: ReadonlySet<Skill> | null;
  currentSkill?: Skill | null;
  disabled?: boolean;
  favorites?: ReadonlySet<Skill>;
  isFocused?: boolean;
  onSelect: (skill: Skill | null) => void;
  selectedSkills?: ReadonlySet<Skill> | null;
  showCost?: boolean;
  slot?: number;
  toggleFavorite?: (skill: Skill) => void;
}) {
  const [showSkillSelector, setShowSkillSelector] = useState(false);

  const onClose = useCallback(() => {
    if (showSkillSelector) {
      AudioPlayer.playSound('UI/Cancel');
      setShowSkillSelector(false);
    }
  }, [showSkillSelector]);

  const onSelectSkill = useCallback(
    (skill: Skill | null) => {
      AudioPlayer.playSound('UI/Accept');
      onSelect(skill);
      onClose();
    },
    [onClose, onSelect],
  );

  const showSelector = useCallback(
    (event: Event) => {
      if (isFocused) {
        event.preventDefault();

        AudioPlayer.playSound('UI/Accept');
        setShowSkillSelector(true);
      }
    },
    [isFocused],
  );
  useInput('accept', showSelector, 'menu');
  useInput('info', showSelector, 'menu');

  const config = currentSkill && getSkillConfigForDisplay(currentSkill);
  const background = (config && gradient(config.colors, config.alpha)) || '';
  const color: BaseColor =
    (config &&
      (Array.isArray(config.colors) ? config.colors[0] : config.colors)) ||
    '';

  return (
    <>
      <SkillIconInternal
        background={background}
        borderStyle="plus"
        color={color}
        disabled={disabled}
        icon={Skills}
        isFocused={isFocused}
        key={currentSkill}
        onClick={() => setShowSkillSelector(true)}
        {...config}
      />
      {showSkillSelector && (
        <Portal>
          {disabled ? (
            <DisabledSkillDialog onClose={onClose} />
          ) : (
            <SkillDialog
              availableSkills={availableSkills}
              blocklistedAreDisabled={blocklistedAreUnavailable}
              blocklistedSkills={blocklistedSkills}
              currentSkill={currentSkill}
              favorites={favorites}
              onClose={onClose}
              onSelect={onSelectSkill}
              selectedSkills={selectedSkills}
              showCost={showCost}
              tabs={
                slot ? (
                  <DialogTab highlight>
                    <fbt desc="Skill selector tabs">
                      Slot <fbt:param name="slot">{slot}</fbt:param>
                    </fbt>
                  </DialogTab>
                ) : undefined
              }
              toggleFavorite={toggleFavorite}
            />
          )}
        </Portal>
      )}
    </>
  );
}

export function SkillIcon({
  active,
  canActivate,
  dialogSize,
  disabled,
  favorites,
  hideDialog,
  showName,
  skill,
  toggleFavorite,
}: {
  active?: boolean;
  canActivate?: boolean;
  dialogSize?: 'small';
  disabled?: boolean;
  favorites?: ReadonlySet<Skill>;
  hideDialog?: boolean;
  showName?: boolean;
  skill: Skill;
  toggleFavorite?: (skill: Skill) => void;
}) {
  const [showDialog, setShowDialog] = useState(false);

  const onClose = useCallback(() => {
    if (showDialog) {
      setShowDialog(false);
    }
  }, [showDialog]);

  const { alpha, borderStyle, colors, icon, name, textColor } =
    getSkillConfigForDisplay(skill);
  const background = gradient(colors, alpha);
  const color: BaseColor = Array.isArray(colors) ? colors[0] : colors;

  return (
    <>
      <Stack
        alignCenter
        className={cx(!hideDialog && pointerStyle)}
        gap
        onClick={!hideDialog ? () => setShowDialog(true) : undefined}
        start
      >
        <SkillIconInternal
          active={active}
          background={background}
          borderStyle={borderStyle}
          button={!hideDialog}
          canActivate={canActivate}
          color={color}
          disabled={disabled}
          icon={icon}
        />
        {showName && (
          <div
            className={tagStyle}
            style={{
              background,
              color:
                alpha != null && alpha >= 0.5 ? textColor : getColor(color),
            }}
          >
            {name}
          </div>
        )}
      </Stack>
      {showDialog && (
        <Portal>
          <SkillDialog
            availableSkills={new Set([skill])}
            favorites={favorites}
            onClose={onClose}
            size={dialogSize}
            toggleFavorite={toggleFavorite}
          />
        </Portal>
      )}
    </>
  );
}

export function HiddenSkillIcon() {
  return (
    <Stack alignCenter className={pointerStyle} gap start>
      <SkillIconInternal icon={Question} />
    </Stack>
  );
}

const tagStyle = css`
  ${clipBorder(2)}
  padding: 3px 6px 5px;
  width: fit-content;
`;

const itemStyle = css`
  cursor: pointer;
`;

const boxStyle = css`
  padding: 8px;
  position: relative;
  transition: background-color 150ms ease;

  @media (hover: hover) {
    &:hover {
      ${clipBorder()}
      background-color: ${applyVar('background-color')};
    }
  }
`;

const selectedBoxStyle = css`
  ${clipBorder()}

  background-color: ${applyVar('background-color')};
`;

const blockedStyle = css`
  opacity: 0.7;
  color: ${applyVar('text-color-light')};
`;

const costStyle = css`
  ${clipBorder(4)}

  background: ${applyVar('background-color-light')};
  padding: 8px;
  position: absolute;
  right: 0;
  top: 0;
`;

const pointerStyle = css`
  cursor: pointer;
`;

const coinIconStyle = css`
  margin-top: 1px;
`;

const descriptionStyle = css`
  padding: 0 20px 0 38px;

  ${Breakpoints.lg} {
    padding: 0 40px 0 38px;
  }
`;

const buttonStyle = css`
  padding: 1px 4px 4px;
`;
