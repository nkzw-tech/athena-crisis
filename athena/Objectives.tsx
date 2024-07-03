import isPositiveInteger from '@deities/hephaestus/isPositiveInteger.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import {
  PlayerID,
  PlayerIDs,
  PlayerIDSet,
  toPlayerIDs,
} from './map/Player.tsx';
import {
  EncodedReward,
  maybeDecodeReward,
  maybeEncodeReward,
  Reward,
  validateReward,
} from './map/Reward.tsx';
import Vector, { decodeVectorArray, encodeVectorArray } from './map/Vector.tsx';
import MapData from './MapData.tsx';

export enum Criteria {
  Default = 0,
  CaptureLabel = 1,
  CaptureAmount = 2,
  DefeatLabel = 3,
  EscortLabel = 4,
  Survival = 5,
  EscortAmount = 6,
  RescueLabel = 8,
  DefeatAmount = 9,
  DefeatOneLabel = 10,
  DestroyLabel = 11,
  DestroyAmount = 12,
  RescueAmount = 13,
}

export const CriteriaList = [
  Criteria.Default,
  Criteria.CaptureAmount,
  Criteria.CaptureLabel,
  Criteria.DefeatAmount,
  Criteria.DefeatLabel,
  Criteria.DefeatOneLabel,
  Criteria.DestroyAmount,
  Criteria.DestroyLabel,
  Criteria.EscortAmount,
  Criteria.EscortLabel,
  Criteria.RescueAmount,
  Criteria.RescueLabel,
  Criteria.Survival,
] as const;

export const CriteriaListWithoutDefault = [
  Criteria.CaptureAmount,
  Criteria.CaptureLabel,
  Criteria.DefeatAmount,
  Criteria.DefeatLabel,
  Criteria.DefeatOneLabel,
  Criteria.DestroyAmount,
  Criteria.DestroyLabel,
  Criteria.EscortAmount,
  Criteria.EscortLabel,
  Criteria.RescueAmount,
  Criteria.RescueLabel,
  Criteria.Survival,
] as const;

export const MIN_AMOUNT = 1;
export const MAX_AMOUNT = 128;
export const MIN_ROUNDS = 1;
export const MAX_ROUNDS = 1024;

type CaptureLabelObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.CaptureLabel;
}>;

type CaptureAmountObjective = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.CaptureAmount;
}>;

type DefeatObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DefeatLabel;
}>;

type SurvivalObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  rounds: number;
  type: Criteria.Survival;
}>;

type EscortLabelObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.EscortLabel;
  vectors: ReadonlySet<Vector>;
}>;

type EscortAmountObjective = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  label?: PlayerIDSet;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.EscortAmount;
  vectors: ReadonlySet<Vector>;
}>;

type RescueLabelObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.RescueLabel;
}>;

type DefeatAmountObjective = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DefeatAmount;
}>;

type DefeatOneLabelObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DefeatOneLabel;
}>;

type DestroyLabelObjective = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DestroyLabel;
}>;

type DestroyAmountObjective = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DestroyAmount;
}>;

type RescueAmountObjective = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.RescueAmount;
}>;

export type ObjectivesWithVectors =
  | EscortLabelObjective
  | EscortAmountObjective;

export type Objective =
  | Readonly<{
      hidden: boolean;
      reward?: Reward | null;
      type: Criteria.Default;
    }>
  | CaptureAmountObjective
  | CaptureLabelObjective
  | DefeatAmountObjective
  | DefeatOneLabelObjective
  | DefeatObjective
  | DestroyAmountObjective
  | DestroyLabelObjective
  | EscortAmountObjective
  | EscortLabelObjective
  | RescueAmountObjective
  | RescueLabelObjective
  | SurvivalObjective;

export type PlainObjective =
  | [
      type: Criteria.Default,
      hidden: 0 | 1,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.CaptureLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.CaptureAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.DefeatLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.EscortLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      vectors: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.Survival,
      hidden: 0 | 1,
      rounds: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.EscortAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      vectors: ReadonlyArray<number>,
      label: null | ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.RescueLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.DefeatAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.DefeatOneLabel,
      hidden: 0 | 1,
      label: null | ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.DestroyLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.DestroyAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: Criteria.RescueAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ];

export type ObjectiveID = number;
export type Objectives = ImmutableMap<ObjectiveID, Objective>;
export type PlainObjectives = ReadonlyArray<
  readonly [objectiveId: number, objective: PlainObjective]
>;

export function encodeObjective(objective: Objective): PlainObjective {
  const { hidden, type } = objective;
  switch (type) {
    case Criteria.Default:
      return [type, hidden ? 1 : 0, maybeEncodeReward(objective.reward)];
    case Criteria.CaptureLabel:
    case Criteria.DestroyLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(objective.label),
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.CaptureAmount:
    case Criteria.DestroyAmount:
      return [
        type,
        hidden ? 1 : 0,
        objective.amount,
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.DefeatLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(objective.label),
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.EscortLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(objective.label),
        objective.players || [],
        encodeVectorArray([...objective.vectors]),
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.Survival:
      return [
        type,
        hidden ? 1 : 0,
        objective.rounds,
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.EscortAmount:
      return [
        type,
        hidden ? 1 : 0,
        objective.amount,
        objective.players,
        encodeVectorArray([...objective.vectors]),
        objective.label ? Array.from(objective.label) : [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.RescueAmount:
      return [
        type,
        hidden ? 1 : 0,
        objective.amount,
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.RescueLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(objective.label),
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.DefeatAmount:
      return [
        type,
        hidden ? 1 : 0,
        objective.amount,
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    case Criteria.DefeatOneLabel:
      return [
        type,
        hidden ? 1 : 0,
        objective.label ? Array.from(objective.label) : [],
        objective.players || [],
        maybeEncodeReward(objective.reward),
        objective.optional ? 1 : 0,
        objective.completed?.size ? Array.from(objective.completed) : [],
      ];
    default: {
      objective satisfies never;
      throw new UnknownTypeError('encodeObjective', type);
    }
  }
}

export function decodeObjective(objective: PlainObjective): Objective {
  const type = objective[0];
  switch (type) {
    case Criteria.Default: {
      return {
        hidden: !!objective[1],
        reward: maybeDecodeReward(objective[2]),
        type,
      };
    }
    case Criteria.CaptureLabel:
    case Criteria.DestroyLabel:
      return {
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        label: new Set(toPlayerIDs(objective[2])),
        optional: !!objective[5],
        players: objective[3] ? toPlayerIDs(objective[3]) : undefined,
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    case Criteria.CaptureAmount:
    case Criteria.DestroyAmount:
      return {
        amount: objective[2]!,
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        optional: !!objective[5],
        players: objective[3] ? toPlayerIDs(objective[3]) : undefined,
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    case Criteria.DefeatLabel:
      return {
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        label: new Set(toPlayerIDs(objective[2])),
        optional: !!objective[5],
        players: objective[3] ? toPlayerIDs(objective[3]) : undefined,
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    case Criteria.EscortLabel:
      return {
        completed: objective[7]
          ? new Set(toPlayerIDs(objective[7]))
          : new Set(),
        hidden: !!objective[1],
        label: new Set(toPlayerIDs(objective[2])),
        optional: !!objective[6],
        players: toPlayerIDs(objective[3]),
        reward: maybeDecodeReward(objective[5]),
        type,
        vectors: new Set(decodeVectorArray(objective[4])),
      };
    case Criteria.Survival:
      return {
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        optional: !!objective[5],
        players: toPlayerIDs(objective[3]),
        reward: maybeDecodeReward(objective[4]),
        rounds: objective[2]!,
        type,
      };
    case Criteria.EscortAmount:
      return {
        amount: objective[2],
        completed: objective[8]
          ? new Set(toPlayerIDs(objective[8]))
          : new Set(),
        hidden: !!objective[1],
        label: objective[5] ? new Set(toPlayerIDs(objective[5])) : undefined,
        optional: !!objective[7],
        players: toPlayerIDs(objective[3]),
        reward: maybeDecodeReward(objective[6]),
        type,
        vectors: new Set(decodeVectorArray(objective[4])),
      };
    case Criteria.RescueAmount:
      return {
        amount: objective[2],
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        optional: !!objective[5],
        players: objective[3] ? toPlayerIDs(objective[3]) : undefined,
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    case Criteria.RescueLabel:
      return {
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        label: new Set(toPlayerIDs(objective[2])),
        optional: !!objective[5],
        players: objective[3] ? toPlayerIDs(objective[3]) : undefined,
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    case Criteria.DefeatAmount:
      return {
        amount: objective[2],
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        optional: !!objective[5],
        players: toPlayerIDs(objective[3]),
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    case Criteria.DefeatOneLabel:
      return {
        completed: objective[6]
          ? new Set(toPlayerIDs(objective[6]))
          : new Set(),
        hidden: !!objective[1],
        label: objective[2] ? new Set(toPlayerIDs(objective[2])) : new Set(),
        optional: !!objective[5],
        players: objective[3] ? toPlayerIDs(objective[3]) : undefined,
        reward: maybeDecodeReward(objective[4]),
        type,
      };
    default: {
      objective satisfies never;
      throw new UnknownTypeError('decodeObjective', type);
    }
  }
}

export function encodeObjectives(objectives: Objectives): PlainObjectives {
  return sortBy([...objectives], ([id]) => id).map(([id, objective]) => [
    id,
    encodeObjective(objective),
  ]);
}

export function decodeObjectives(objectives: PlainObjectives) {
  return ImmutableMap(
    objectives.map(([id, objective]) => [id, decodeObjective(objective)]),
  );
}

export function decodeLegacyWinConditions(
  objectives: ReadonlyArray<PlainObjective>,
): Objectives {
  return ImmutableMap(
    objectives.map((objective, index) => [index, decodeObjective(objective)]),
  );
}

export function formatObjective(objective: Objective) {
  const newObjective: Record<string, unknown> = { ...objective };
  if ('label' in objective && objective.label) {
    newObjective.label = Array.from(objective.label || []);
  }
  if ('players' in objective && objective.players) {
    newObjective.players = Array.from(objective.players || []);
  }
  if ('vectors' in objective) {
    newObjective.vectors = Array.from(objective.vectors).map(String);
  }
  return newObjective;
}

export function objectiveHasVectors(
  objective: Objective,
): objective is EscortLabelObjective | EscortAmountObjective {
  const { type } = objective;
  return type === Criteria.EscortLabel || type === Criteria.EscortAmount;
}

export function objectiveHasLabel(
  objective: Objective,
): objective is
  | CaptureLabelObjective
  | DefeatOneLabelObjective
  | DefeatObjective
  | DestroyLabelObjective
  | EscortAmountObjective
  | EscortLabelObjective
  | RescueLabelObjective {
  const { type } = objective;
  return (
    type === Criteria.CaptureLabel ||
    type === Criteria.DefeatLabel ||
    type === Criteria.DefeatOneLabel ||
    type === Criteria.DestroyLabel ||
    type === Criteria.EscortLabel ||
    type === Criteria.EscortAmount ||
    type === Criteria.RescueLabel
  );
}

export function objectiveHasAmounts(
  objective: Objective,
): objective is
  | CaptureAmountObjective
  | DefeatAmountObjective
  | DestroyAmountObjective
  | EscortAmountObjective
  | RescueAmountObjective {
  const { type } = objective;
  return (
    type === Criteria.CaptureAmount ||
    type === Criteria.DestroyAmount ||
    type === Criteria.DefeatAmount ||
    type === Criteria.RescueAmount ||
    type === Criteria.EscortAmount
  );
}

export function objectiveHasRounds(
  objective: Objective,
): objective is SurvivalObjective {
  const { type } = objective;
  return type === Criteria.Survival;
}

export function getOpponentPriorityLabels(
  objectives: Objectives,
  player: PlayerID,
) {
  const labels = new Set<PlayerID>();
  for (const [, objective] of objectives) {
    if (!objectiveHasLabel(objective) || !objective.label?.size) {
      continue;
    }

    const { label, players, type } = objective;
    if (
      ((type === Criteria.DefeatLabel ||
        type === Criteria.DestroyLabel ||
        type === Criteria.DefeatOneLabel) &&
        (!players?.length || players.includes(player))) ||
      ((type === Criteria.EscortAmount ||
        type === Criteria.EscortLabel ||
        type === Criteria.RescueLabel) &&
        players?.length &&
        !players.includes(player))
    ) {
      for (const player of label) {
        labels.add(player);
      }
    }
  }
  return labels;
}

const validateLabel = (label: PlayerIDSet) => {
  if (!label.size) {
    return false;
  }

  toPlayerIDs([...label]);
  return true;
};

const validatePlayers = (map: MapData, players: PlayerIDs) => {
  if (players.length > 0) {
    const playerIDSet = new Set(toPlayerIDs(players));
    if (playerIDSet.size !== players.length) {
      return false;
    }
    for (const player of playerIDSet) {
      if (!map.maybeGetPlayer(player)) {
        return false;
      }
    }
    return true;
  }
  return false;
};

const validateAmount = (amount: number) =>
  isPositiveInteger(amount) && amount >= MIN_AMOUNT && amount <= MAX_AMOUNT;

export function validateObjective(
  map: MapData,
  objective: Objective,
  id: ObjectiveID,
) {
  if (typeof id !== 'number' || !Number.isInteger(id)) {
    return false;
  }

  const { hidden, type } = objective;
  if (
    (hidden !== false && hidden !== true) ||
    (objective.reward && !validateReward(objective.reward)) ||
    (type !== Criteria.Default && objective.completed?.size)
  ) {
    return false;
  }

  const validateVector = (vector: Vector) => map.contains(vector);

  switch (type) {
    case Criteria.Default:
      return true;
    case Criteria.CaptureLabel:
    case Criteria.DefeatLabel:
    case Criteria.DefeatOneLabel:
    case Criteria.DestroyLabel:
    case Criteria.RescueLabel:
      return (
        validateLabel(objective.label) &&
        (objective.players?.length
          ? validatePlayers(map, objective.players)
          : true)
      );
    case Criteria.CaptureAmount:
    case Criteria.DefeatAmount:
    case Criteria.DestroyAmount:
      if (!validateAmount(objective.amount)) {
        return false;
      }
      return objective.players?.length
        ? validatePlayers(map, objective.players)
        : true;
    case Criteria.EscortLabel:
      if (![...objective.vectors].every(validateVector)) {
        return false;
      }
      return (
        validateLabel(objective.label) &&
        validatePlayers(map, objective.players)
      );
    case Criteria.Survival:
      if (
        !isPositiveInteger(objective.rounds) ||
        objective.rounds < MIN_ROUNDS ||
        objective.rounds > MAX_ROUNDS
      ) {
        return false;
      }

      if (!validatePlayers(map, objective.players)) {
        return false;
      }

      return objective.players.includes(map.active[0])
        ? objective.rounds > 1
        : true;
    case Criteria.EscortAmount:
      if (!validateAmount(objective.amount)) {
        return false;
      }

      if (objective.label?.size && !validateLabel(objective.label)) {
        return false;
      }

      return (
        validatePlayers(map, toPlayerIDs(objective.players)) &&
        [...objective.vectors].every(validateVector)
      );
    case Criteria.RescueAmount:
      if (!validateAmount(objective.amount)) {
        return false;
      }

      return objective.players?.length
        ? validatePlayers(map, objective.players)
        : true;
    default: {
      objective satisfies never;
      return false;
    }
  }
}

export function validateObjectives(map: MapData) {
  const { objectives } = map.config;
  if (
    objectives.size > 32 ||
    objectives.filter(({ type }) => type === Criteria.Default).size > 1
  ) {
    return false;
  }

  if (
    objectives.every(
      (objective) => objective.type !== Criteria.Default && objective.optional,
    )
  ) {
    return false;
  }

  return objectives.every(validateObjective.bind(null, map));
}

export function resetObjectives(
  objectives: Objectives,
  active: PlayerIDSet,
): Objectives {
  return objectives.map((objective) =>
    objective.type === Criteria.Default || !objective.players
      ? { ...objective, completed: new Set() }
      : ({
          ...objective,
          completed: new Set(),
          players: objective.players.filter((player) => active.has(player)),
        } as const),
  );
}

export function onlyHasDefaultObjective(objectives: Objectives) {
  return (
    objectives.size === 0 ||
    (objectives.size === 1 && objectives.first()?.type === Criteria.Default)
  );
}

export function getHiddenLabels(objectives: Objectives): PlayerIDSet | null {
  if (onlyHasDefaultObjective(objectives)) {
    return null;
  }

  let labels: Set<PlayerID> | null = null;
  for (const [, objective] of objectives) {
    if (objective.hidden && objectiveHasLabel(objective) && objective.label) {
      for (const label of objective.label) {
        if (!labels) {
          labels = new Set();
        }

        labels.add(label);
      }
    }
  }
  return labels;
}

export function getInitialObjective(
  map: MapData,
  criteria: Criteria,
): Objective {
  const hidden = false;
  const optional = false;
  const currentPlayer = map.getCurrentPlayer().id;
  const players = [currentPlayer > 0 ? currentPlayer : map.active[0]];
  const label = new Set(players);
  switch (criteria) {
    case Criteria.Default:
      return {
        hidden,
        type: criteria,
      };
    case Criteria.CaptureLabel:
    case Criteria.DestroyLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    case Criteria.DefeatLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    case Criteria.CaptureAmount:
    case Criteria.DestroyAmount:
      return {
        amount: 10,
        hidden,
        optional,
        type: criteria,
      };
    case Criteria.EscortLabel:
      return {
        hidden,
        label,
        optional,
        players,
        type: criteria,
        vectors: new Set(),
      };
    case Criteria.Survival:
      return {
        hidden,
        optional,
        players,
        rounds: MIN_ROUNDS + 4,
        type: criteria,
      };
    case Criteria.EscortAmount:
      return {
        amount: 1,
        hidden,
        optional,
        players,
        type: criteria,
        vectors: new Set(),
      };
    case Criteria.RescueAmount:
      return {
        amount: 1,
        hidden,
        optional,
        players,
        type: criteria,
      };
    case Criteria.RescueLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    case Criteria.DefeatAmount:
      return {
        amount: 5,
        hidden,
        optional,
        players,
        type: criteria,
      };
    case Criteria.DefeatOneLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    default: {
      criteria satisfies never;
      throw new UnknownTypeError('getInitialObjective', criteria);
    }
  }
}
