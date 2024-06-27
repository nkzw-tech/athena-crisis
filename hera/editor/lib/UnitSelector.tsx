import {
  mapUnits,
  mapUnitsWithContentRestriction,
  UnitInfo,
} from '@deities/athena/info/Unit.tsx';
import {
  DynamicPlayerID,
  PlayerID,
  resolveDynamicPlayerID,
} from '@deities/athena/map/Player.tsx';
import MapData from '@deities/athena/MapData.tsx';
import Breakpoints from '@deities/ui/Breakpoints.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import Dropdown from '@deities/ui/Dropdown.tsx';
import getColor from '@deities/ui/getColor.tsx';
import InlineLink from '@deities/ui/InlineLink.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css, cx } from '@emotion/css';
import { memo } from 'react';
import Portrait from '../../character/Portrait.tsx';
import { UserWithFactionNameAndSkills } from '../../hooks/useUserMap.tsx';

export default memo(function UnitSelector({
  border,
  currentPlayer,
  hasContentRestrictions,
  highlight,
  isVisible,
  map,
  onSelect,
  selectedPlayer,
  selectedUnit,
  user,
  width,
}: {
  border?: true;
  currentPlayer?: PlayerID;
  hasContentRestrictions: boolean;
  highlight?: boolean;
  isVisible: boolean;
  map?: MapData;
  onSelect?: (unit: UnitInfo) => void;
  selectedPlayer: DynamicPlayerID;
  selectedUnit: UnitInfo | null;
  user: UserWithFactionNameAndSkills | null;
  width?: 'auto';
}) {
  const shouldRenderControls = isVisible && !!onSelect;
  const hasCurrentPlayer = map && currentPlayer != null;
  const player = hasCurrentPlayer
    ? resolveDynamicPlayerID(map, selectedPlayer, currentPlayer)
    : selectedPlayer;

  return (
    <Dropdown
      className={cx(width !== 'auto' && unitContainerStyle)}
      dropdownClassName={unitSelectorStyle}
      shouldRenderControls={shouldRenderControls}
      title={
        <div
          className={cx(
            nowrapStyle,
            border && borderStyle,
            highlight && highlightStyle,
          )}
          key={selectedUnit?.id}
          style={
            map && player != null ? { color: getColor(player) } : undefined
          }
        >
          {selectedUnit ? (
            <>
              {selectedUnit.name}
              {!hasCurrentPlayer || currentPlayer === player
                ? ` - ${selectedUnit.characterName}`
                : null}
            </>
          ) : (
            <fbt desc="Label to select a unit">Select a unit</fbt>
          )}
        </div>
      }
    >
      {(hasContentRestrictions ? mapUnitsWithContentRestriction : mapUnits)(
        (unit) => (
          <InlineLink
            className={unitStyle}
            key={unit.id}
            onClick={onSelect ? () => onSelect(unit) : undefined}
            selectedText={unit.id === selectedUnit?.id}
          >
            <Stack alignCenter gap nowrap start>
              <Portrait
                clip
                player={player}
                scale={0.5}
                unit={unit}
                variant={0}
              />
              <div>
                {unit.name} - {String(unit.characterName)}
              </div>
            </Stack>
          </InlineLink>
        ),
        new Set(user?.skills),
      )}
    </Dropdown>
  );
});

const unitContainerStyle = css`
  min-width: 120px;

  ${Breakpoints.sm} {
    min-width: 320px;
  }
`;

const unitSelectorStyle = css`
  gap: 8px;
  left: 0;
  max-height: 300px;
  min-width: 320px;
  overflow-y: auto;
  padding: 2px;
  top: -12px;
`;

const unitStyle = css`
  image-rendering: pixelated;
`;

const nowrapStyle = css`
  white-space: nowrap;
`;

const borderStyle = css`
  ${pixelBorder(undefined, 2)}

  padding: 2px 8px;
`;

const highlightStyle = css`
  ${pixelBorder(applyVar('highlight-color'), 2)}

  background-color: ${applyVar('background-color')};
`;
