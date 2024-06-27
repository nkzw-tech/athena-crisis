import { getSkillConfig, Skill } from '@deities/athena/info/Skill.tsx';
import { TileSize } from '@deities/athena/map/Configuration.tsx';
import groupBy from '@deities/hephaestus/groupBy.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import AudioPlayer from '@deities/ui/AudioPlayer.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { ButtonStyle, SquareButtonStyle } from '@deities/ui/Button.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import useBlockInput from '@deities/ui/controls/useBlockInput.tsx';
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
import SkillBorder, {
  SkillBorderIcons,
  SkillIconBorderStyle,
} from '@deities/ui/icons/SkillBorder.tsx';
import Skills from '@deities/ui/icons/Skills.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import Portal from '@deities/ui/Portal.tsx';
import {
  RainbowStyle,
  SquarePulseStyle,
} from '@deities/ui/RainbowPulseStyle.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import Charge from '@iconify-icons/pixelarticons/ac.js';
import Coin from '@iconify-icons/pixelarticons/coin.js';
import { Sprites } from 'athena-crisis:images';
import { ReactElement, ReactNode, useCallback, useRef, useState } from 'react';
import getSkillConfigForDisplay from '../lib/getSkillConfigForDisplay.tsx';
import SkillDescription from './SkillDescription.tsx';

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
  background: string;
  borderStyle?: SkillIconBorderStyle;
  button?: boolean;
  canActivate?: boolean;
  color: BaseColor;
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
              ? applyVar('text-color-inactive')
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
`;

const iconStyle = css`
  position: relative;
`;

export default function SkillDialog({
  actionName,
  availableSkills,
  blocklistedAreDisabled,
  blocklistedSkills: initialBlocklistedSkills,
  canAction,
  children,
  currentSkill,
  focus,
  onAction,
  onClose,
  onSelect,
  selectedSkills,
  showAction,
  showCost,
  tabs,
  toggleBlocklist,
  transformOrigin,
}: {
  actionName?: ReactElement;
  availableSkills: ReadonlySet<Skill>;
  blocklistedAreDisabled?: boolean;
  blocklistedSkills?: ReadonlySet<Skill> | null;
  canAction?: (skill: Skill) => boolean;
  children?: ReactNode;
  currentSkill?: Skill | null;
  focus?: boolean;
  onAction?: (skill: Skill) => void;
  onClose: () => void;
  onSelect?: (skill: Skill | null) => void;
  selectedSkills?: ReadonlySet<Skill> | null;
  showAction?: (skill: Skill) => boolean;
  showCost?: boolean;
  tabs?: ReactNode;
  toggleBlocklist?: boolean;
  transformOrigin?: string;
}) {
  const hasAction = onAction && actionName && currentSkill;
  const partition = groupBy(
    sortBy([...availableSkills], (skill) => skill),
    (skill) =>
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

  const [selected] = useMenuNavigation(
    enabledSkills?.length || 0,
    'dialog',
    true,
  );

  useInput(
    'accept',
    useCallback(
      (event) => {
        if (
          onAction &&
          currentSkill &&
          (!canAction || canAction(currentSkill))
        ) {
          event.preventDefault();
          onAction(currentSkill);
        }
      },
      [canAction, currentSkill, onAction],
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
    // Has to be on top in order not to interfer with the Map.
    'top',
  );

  const blocklistedSkills = new Set(initialBlocklistedSkills);
  if (blocklistedAreDisabled && initialBlocklistedSkills && currentSkill) {
    blocklistedSkills.delete(currentSkill);
  }

  return (
    <Dialog
      onClose={onClose}
      transformOrigin={transformOrigin || 'center center'}
    >
      <DialogScrollContainer>
        <Stack gap={24} vertical>
          {!focus && (
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
          <Stack gap vertical>
            {enabledSkills?.map((skill, index) => (
              <SkillListItem
                blocklistedSkills={blocklistedSkills}
                currentSkill={!focus ? currentSkill : undefined}
                key={skill}
                onSelect={onSelect}
                selected={selected === index}
                showCost={showCost}
                skill={skill}
                toggleBlocklist={toggleBlocklist}
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
                    key={skill}
                    onSelect={onSelect}
                    showCost={showCost}
                    skill={skill}
                    toggleBlocklist={toggleBlocklist}
                  />
                ))}
              </Stack>
            </Stack>
          ) : null}
          {disabledSkills?.length ? (
            <Stack gap={16} vertical>
              <h2>
                <fbt desc="Headline to for disabled skills">
                  Disabled skills
                </fbt>
              </h2>
              <Stack gap={16} vertical>
                {disabledSkills.map((skill) => (
                  <SkillListItem
                    blocklistedSkills={initialBlocklistedSkills}
                    currentSkill={currentSkill}
                    key={skill}
                    onSelect={onSelect}
                    showCost={showCost}
                    skill={skill}
                    toggleBlocklist={toggleBlocklist}
                  />
                ))}
              </Stack>
            </Stack>
          ) : null}
          {children}
        </Stack>
      </DialogScrollContainer>
      {(hasAction || tabs) && (
        <DialogTabBar>
          {tabs}
          {hasAction && (!showAction || showAction(currentSkill)) && (
            <DialogTab
              disabled={canAction ? !canAction(currentSkill) : false}
              end
              onClick={() => onAction(currentSkill)}
            >
              {actionName}
            </DialogTab>
          )}
        </DialogTabBar>
      )}
    </Dialog>
  );
}

const SkillListItem = ({
  blocklistedSkills,
  currentSkill,
  onSelect,
  selected,
  showCost,
  skill,
  toggleBlocklist,
}: {
  blocklistedSkills?: ReadonlySet<Skill> | null;
  currentSkill?: Skill | null;
  onSelect?: (skill: Skill | null) => void;
  selected?: boolean;
  showCost?: boolean;
  skill: Skill;
  toggleBlocklist?: boolean;
}) => {
  const element = useRef<HTMLDivElement>(null);
  const { alpha, borderStyle, colors, icon, name } =
    getSkillConfigForDisplay(skill);
  const { charges } = getSkillConfig(skill);

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
          isInteractive && ButtonStyle,
          isBlocked && blockedStyle,
          selected && 'hover',
        )}
        gap
        onClick={isInteractive ? () => onSelect(skill) : undefined}
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
                  alpha != null && alpha >= 0.5 ? undefined : getColor(color),
              }}
            >
              {name}
            </div>
          </Stack>
        </Stack>
        <SkillDescription
          className={descriptionStyle}
          color={color}
          skill={skill}
          type="regular"
        />
        {charges ? (
          <div className={descriptionStyle}>
            <SkillDescription color={color} skill={skill} type="power" />
            <div>
              <Icon className={chargeIconStyle} icon={Charge} />
              <fbt desc="Power charge cost">
                Cost: <fbt:param name="charges">{charges}</fbt:param>{' '}
                <fbt:plural
                  count={charges}
                  many="charges"
                  name="number of charges"
                >
                  charge
                </fbt:plural>
              </fbt>
            </div>
          </div>
        ) : null}
      </Stack>
      {showCost && (
        <Stack className={costStyle} gap={4} nowrap start>
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

export function SkillSelector({
  availableSkills,
  blocklistedAreDisabled: blocklistedAreUnavailable,
  blocklistedSkills,
  currentSkill,
  isFocused,
  onSelect,
  selectedSkills,
  showCost,
  slot,
}: {
  availableSkills: ReadonlySet<Skill>;
  blocklistedAreDisabled?: boolean;
  blocklistedSkills?: ReadonlySet<Skill> | null;
  currentSkill?: Skill | null;
  isFocused?: boolean;
  onSelect: (skill: Skill | null) => void;
  selectedSkills?: ReadonlySet<Skill> | null;
  showCost?: boolean;
  slot?: number;
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
        icon={Skills}
        isFocused={isFocused}
        key={currentSkill}
        onClick={() => setShowSkillSelector(true)}
        {...config}
      />
      {showSkillSelector && (
        <Portal>
          <SkillDialog
            availableSkills={availableSkills}
            blocklistedAreDisabled={blocklistedAreUnavailable}
            blocklistedSkills={blocklistedSkills}
            currentSkill={currentSkill}
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
          />
        </Portal>
      )}
    </>
  );
}

export function SkillIcon({
  active,
  canActivate,
  disabled,
  hideDialog,
  showName,
  skill,
}: {
  active?: boolean;
  canActivate?: boolean;
  disabled?: boolean;
  hideDialog?: boolean;
  showName?: boolean;
  skill: Skill;
}) {
  const [showDialog, setShowDialog] = useState(false);

  const onClose = useCallback(() => {
    if (showDialog) {
      setShowDialog(false);
    }
  }, [showDialog]);

  const { alpha, borderStyle, colors, icon, name } =
    getSkillConfigForDisplay(skill);
  const background = gradient(colors, alpha);
  const color: BaseColor = Array.isArray(colors) ? colors[0] : colors;

  return (
    <>
      <Stack
        alignCenter
        className={pointerStyle}
        gap
        onClick={!hideDialog ? () => setShowDialog(true) : undefined}
        start
      >
        <SkillIconInternal
          active={active}
          background={background}
          borderStyle={borderStyle}
          button
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
              color: alpha != null && alpha > 0.7 ? undefined : getColor(color),
            }}
          >
            {name}
          </div>
        )}
      </Stack>
      {showDialog && (
        <Portal>
          <SkillDialog availableSkills={new Set([skill])} onClose={onClose} />
        </Portal>
      )}
    </>
  );
}

const tagStyle = css`
  ${clipBorder(2)}
  padding: 3px 6px 5px;
  width: fit-content;
`;

const descriptionStyle = css`
  line-height: 1.4em;
  padding: 0 20px 0 38px;

  ${Breakpoints.lg} {
    padding: 0 40px 0 38px;
  }
`;

const itemStyle = css`
  cursor: pointer;
  transform-origin: left center;
`;

const boxStyle = css`
  padding: 8px;
  position: relative;
  transition: background-color 150ms ease;

  &:hover {
    ${clipBorder()}
    background-color: ${applyVar('background-color')};
  }
`;

const selectedBoxStyle = css`
  ${clipBorder()}
  background-color: ${applyVar('background-color')};
`;

const blockedStyle = css`
  opacity: 0.7;
  color: ${applyVar('text-color-inactive')};
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

const chargeIconStyle = css`
  margin: -4px 4px 0 0;
`;
