import { PlayerIDs } from '@deities/athena/map/Player.tsx';
import {
  Criteria,
  Objective,
  objectiveHasLabel,
} from '@deities/athena/Objectives.tsx';
import clipBorder from '@deities/ui/clipBorder.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import gradient from '@deities/ui/gradient.tsx';
import Stack from '@deities/ui/Stack.tsx';
import { css } from '@emotion/css';
import UnknownTypeError from '@nkzw/core/UnknownTypeError.js';
import { list } from 'fbtee';
import getTranslatedFactionName from '../lib/getTranslatedFactionName.tsx';
import { PlayerDetails } from '../Types.tsx';
import UILabel from '../ui/UILabel.tsx';
import ObjectiveTitle from './ObjectiveTitle.tsx';

const PlayerList = ({
  conjunction = 'or',
  playerDetails,
  players,
}: {
  conjunction?: 'and' | 'or';
  playerDetails: PlayerDetails;
  players: PlayerIDs;
}) =>
  players.length ? (
    list(
      players.map((id) => (
        <span key={`player-${id}`} style={{ color: getColor(id) }}>
          {getTranslatedFactionName(playerDetails, id)}
        </span>
      )),
      conjunction,
    )
  ) : (
    <fbt desc="Player list name that applies to any player, like 'Any player can achieve the objective…'">
      Any player
    </fbt>
  );

const ObjectiveText = ({
  objective,
  playerDetails,
}: {
  objective: Objective;
  playerDetails: PlayerDetails;
}) => {
  const { type } = objective;
  const playerList = (
    <PlayerList
      playerDetails={playerDetails}
      players={(type !== Criteria.Default && objective.players) || []}
    />
  );

  const labels =
    (objectiveHasLabel(objective) &&
      objective.label &&
      [...objective.label].map((id) => (
        <UILabel className={labelStyle} color={id} key={`label-${id}`} />
      ))) ||
    null;
  const labelList =
    labels && list(labels, type === Criteria.DefeatOneLabel ? 'or' : 'and');

  switch (type) {
    case Criteria.Default:
      return (
        <fbt desc="Explanation for the default win condition">
          You win by either defeating all opposing units or capturing all HQs.
          Capturing an opponent&apos;s HQ also gives you control of their
          buildings.
        </fbt>
      );
    case Criteria.CaptureLabel:
      return (
        <fbt desc="Explanation for the capture by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by capturing all buildings with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case Criteria.CaptureAmount:
      return (
        <fbt desc="Explanation for the capture by amount win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by capturing{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
            many="buildings"
            name="number of buildings"
          >
            building
          </fbt:plural>.
        </fbt>
      );
    case Criteria.DefeatOneLabel:
    case Criteria.DefeatLabel:
      return (
        <fbt desc="Explanation for the defeat by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by defeating{' '}
          <fbt:plural
            count={type === Criteria.DefeatOneLabel ? 1 : 0}
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
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case Criteria.DefeatAmount:
      return (
        <fbt desc="Explanation for the defeat by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by defeating{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>.
        </fbt>
      );
    case Criteria.EscortLabel:
      return (
        <fbt desc="Explanation for the escort by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by escorting all units with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case Criteria.Survival:
      return (
        <fbt desc="Explanation for the survival win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by surviving{' '}
          <fbt:param name="rounds">{objective.rounds}</fbt:param>{' '}
          <fbt:plural
            count={objective.rounds}
            many="rounds"
            name="number of rounds"
          >
            round
          </fbt:plural>.
        </fbt>
      );
    case Criteria.EscortAmount:
      return labels?.length ? (
        <fbt desc="Explanation for the escort by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by escorting{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
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
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the escort by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by escorting{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>.
        </fbt>
      );
    case Criteria.RescueAmount:
      return labels?.length ? (
        <fbt desc="Explanation for the rescue by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by rescuing{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
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
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      ) : (
        <fbt desc="Explanation for the rescue by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by rescuing{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
            many="units"
            name="number of units"
          >
            unit
          </fbt:plural>.
        </fbt>
      );
    case Criteria.RescueLabel:
      return (
        <fbt desc="Explanation for the rescue by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by rescuing all units with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case Criteria.DestroyLabel:
      return (
        <fbt desc="Explanation for the destroy by label win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by destroying all buildings with the{' '}
          <fbt:plural
            count={labels?.length || 0}
            many="labels"
            name="number of labels"
          >
            label
          </fbt:plural>{' '}
          <fbt:param name="label">{labelList}</fbt:param>.
        </fbt>
      );
    case Criteria.DestroyAmount:
      return (
        <fbt desc="Explanation for the destroy by amount win condition with multiple players">
          <fbt:param name="players">{playerList}</fbt:param> can achieve the
          objective by destroying{' '}
          <fbt:param name="amount">{objective.amount}</fbt:param>{' '}
          <fbt:plural
            count={objective.amount}
            many="buildings"
            name="number of buildings"
          >
            building
          </fbt:plural>.
        </fbt>
      );
    default: {
      objective satisfies never;
      throw new UnknownTypeError('WinConditionText', type);
    }
  }
};

const CompletedConditionText = ({
  playerDetails,
  players,
}: {
  playerDetails: PlayerDetails;
  players: PlayerIDs;
}) => (
  <div>
    <fbt desc="List of players that completed an objective">
      Completed by{' '}
      <fbt:param name="players">
        <PlayerList playerDetails={playerDetails} players={players} />
      </fbt:param>.
    </fbt>
  </div>
);

export default function ObjectiveDescription({
  objective,
  playerDetails,
  round,
}: {
  objective: Objective;
  playerDetails: PlayerDetails;
  round: number;
}) {
  return (
    <Stack
      className={boxStyle}
      gap
      style={{
        background:
          objective.type !== Criteria.Default && objective.players?.length
            ? gradient(objective.players, 0.15)
            : applyVar('background-color'),
      }}
      vertical
    >
      <h2>
        <ObjectiveTitle objective={objective} />
      </h2>
      <p>
        <ObjectiveText objective={objective} playerDetails={playerDetails} />
      </p>
      {objective.type === Criteria.Survival && (
        <div>
          <fbt desc="Current round description">
            Current round: <fbt:param name="round">{round}</fbt:param>
          </fbt>
        </div>
      )}
      {objective.type !== Criteria.Default && objective.completed?.size ? (
        <CompletedConditionText
          playerDetails={playerDetails}
          players={[...objective.completed]}
        />
      ) : null}
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
