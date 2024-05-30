import {
  WinCondition,
  winConditionHasLabel,
  WinCriteria,
} from '@deities/athena/WinConditions.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import { Fragment } from 'react';
import intlList, { Conjunctions, Delimiters } from '../i18n/intlList.tsx';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import { FactionNames } from '../Types.tsx';
import UILabel from '../ui/UILabel.tsx';
import WinConditionTitle from '../win-conditions/WinConditionTitle.tsx';

const WinConditionText = ({
  condition,
  factionNames,
  round,
}: {
  condition: WinCondition;
  factionNames: FactionNames;
  round: number;
}) => {
  const { type } = condition;
  const players =
    (type !== WinCriteria.Default &&
      condition.players?.map((id) => (
        <span key={`player-${id}`} style={{ color: getColor(id) }}>
          {getTranslatedFactionName(factionNames, id)}
        </span>
      ))) ||
    [];

  const playerList = players
    ? intlList(players, Conjunctions.OR, Delimiters.COMMA)
    : null;

  const labels =
    (winConditionHasLabel(condition) &&
      condition.label &&
      [...condition.label].map((id) => (
        <UILabel className={labelStyle} color={id} key={`label-${id}`} />
      ))) ||
    null;
  const labelList =
    labels &&
    intlList(
      labels,
      type === WinCriteria.DefeatOneLabel ? Conjunctions.OR : Conjunctions.AND,
      Delimiters.COMMA,
    );

  switch (type) {
    case WinCriteria.Default:
      return (
        <fbt desc="Explanation for the default win condition">
          You win by either defeating all opposing units or capturing all HQs.
          Capturing an opponent&apos;s HQ also gives you control of their
          buildings.
        </fbt>
      );
    case WinCriteria.CaptureLabel:
      return players.length ? (
        <fbt desc="Explanation for the capture by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they capture all buildings with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the capture by label win condition">
          Any player wins if they capture all buildings with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case WinCriteria.CaptureAmount:
      return players.length ? (
        <fbt desc="Explanation for the capture by amount win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they capture{' '}
          <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="buildings"
            name="number of buildings"
          >
            building
          </fbt:plural>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the capture by amount win condition for any player">
          You win if you capture{' '}
          <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="buildings"
            name="number of buildings"
          >
            building
          </fbt:plural>.
        </fbt>
      );
    case WinCriteria.DefeatOneLabel:
    case WinCriteria.DefeatLabel:
      return players.length ? (
        <fbt desc="Explanation for the defeat by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they defeat{' '}
          <fbt:plural
            count={type === WinCriteria.DefeatOneLabel ? 1 : 0}
            many="all units"
            name="number of labels"
          >
            one unit
          </fbt:plural>{' '}
          with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the defeat by label win condition">
          Any player wins if they defeat all units with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case WinCriteria.DefeatAmount:
      return players.length ? (
        <fbt desc="Explanation for the defeat by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they defeat <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the defeat by label win condition">
          Any player wins if they defeat{' '}
          <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>.
        </fbt>
      );
    case WinCriteria.EscortLabel:
      return (
        <fbt desc="Explanation for the escort by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they escort all units with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case WinCriteria.Survival:
      return (
        <Fragment>
          <fbt desc="Explanation for the survival win condition with multiple players">
            <fbt:param name="players">{playerList}</fbt:param>{' '}
            <fbt:plural
              count={players.length}
              many="win"
              name="number of players"
            >
              wins
            </fbt:plural>{' '}
            if they survive{' '}
            <fbt:param name="rounds">{condition.rounds}</fbt:param> rounds.
          </fbt>{' '}
          <fbt desc="Current round description">
            Current round: <fbt:param name="round">{round}</fbt:param>.
          </fbt>
        </Fragment>
      );
    case WinCriteria.EscortAmount:
      return labels?.length ? (
        <fbt desc="Explanation for the escort by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they escort <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>{' '}
          with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the escort by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they escort <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>.
        </fbt>
      );
    case WinCriteria.RescueLabel:
      return players.length ? (
        <fbt desc="Explanation for the rescue by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they rescue all units with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the rescue by label win condition">
          Any player wins if they rescue all units with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case WinCriteria.DestroyLabel:
      return players.length ? (
        <fbt desc="Explanation for the destroy by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they destroy all buildings with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the destroy by label win condition">
          Any player wins if they destroy all buildings with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case WinCriteria.DestroyAmount:
      return players.length ? (
        <fbt desc="Explanation for the destroy by amount win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param>{' '}
          <fbt:plural
            count={players.length}
            many="win"
            name="number of players"
          >
            wins
          </fbt:plural>{' '}
          if they destroy{' '}
          <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="buildings"
            name="number of buildings"
          >
            building
          </fbt:plural>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the destroy by amount win condition for any player">
          You win if you destroy{' '}
          <fbt:param name="amount">{condition.amount}</fbt:param>{' '}
          <fbt:plural
            count={condition.amount}
            many="buildings"
            name="number of buildings"
          >
            building
          </fbt:plural>.
        </fbt>
      );
    default: {
      condition satisfies never;
      throw new UnknownTypeError('WinConditionText', type);
    }
  }
};

export default function WinConditionDescription({
  condition,
  factionNames,
  round,
}: {
  condition: WinCondition;
  factionNames: FactionNames;
  round: number;
}) {
  return (
    <Stack
      className={boxStyle}
      gap
      style={{
        background:
          condition.type !== WinCriteria.Default && condition.players?.length
            ? gradient(condition.players, 0.15)
            : applyVar('background-color'),
        color: applyVar('text-color'),
      }}
      vertical
    >
      <h2>
        <WinConditionTitle condition={condition} />
      </h2>
      <p>
        <WinConditionText
          condition={condition}
          factionNames={factionNames}
          round={round}
        />
      </p>
    </Stack>
  );
}

const boxStyle = css`
  ${clipBorder()}
  padding: 12px;
`;

const labelStyle = css`
  margin: -2px 4px 0;
  vertical-align: middle;
`;
