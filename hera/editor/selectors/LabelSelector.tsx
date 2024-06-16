import {
  PlayerID,
  PlayerIDs,
  PlayerIDSet,
} from '@deities/athena/map/Player.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import pixelBorder from '@deities/ui/pixelBorder.tsx';
import { css, cx } from '@emotion/css';
import { ReactNode } from 'react';
import UILabel from '../../ui/UILabel.tsx';

export default function LabelSelector({
  active,
  onChange,
}: {
  active?: PlayerID | null;
  onChange: (label: PlayerID | null) => void;
}) {
  return PlayerIDs.map((label) => (
    <SelectableLabel
      active={active === label}
      color={label}
      key={label}
      onClick={() => onChange(active === label ? null : label)}
    />
  ));
}

export function ManyLabelSelector({
  active,
  children,
  onChange,
}: {
  active?: PlayerIDSet;
  children?: ReactNode;
  onChange: (labels: PlayerIDSet) => void;
}) {
  return (
    <>
      {PlayerIDs.map((label) => (
        <SelectableLabel
          active={!!active?.has(label)}
          color={label}
          key={label}
          onClick={() => {
            const set = new Set(active);
            set[active?.has(label) ? 'delete' : 'add'](label);
            onChange(set);
          }}
        />
      ))}
      {children}
    </>
  );
}

export function SelectableLabel({
  active,
  color,
  onClick,
}: {
  active: boolean;
  color: PlayerID;
  onClick: () => void;
}) {
  return (
    <a className={cx(linkStyle, active && activeStyle)} onClick={onClick}>
      <UILabel color={color} />
    </a>
  );
}

const linkStyle = css`
  cursor: pointer;
  display: block;
  padding: 6.75px;
  margin: 4px 8px;
  transform: scale(1);
  transition: transform 150ms ease;

  &:hover {
    transform: scale(1.1);
  }

  &:active {
    transform: scale(0.9);
  }
`;

const activeStyle = css`
  ${pixelBorder(applyVar('border-color'), 2)}

  background-color: ${applyVar('background-color')};
`;
