import isPositiveInteger from '@deities/hephaestus/isPositiveInteger.tsx';
import UnknownTypeError from '@deities/hephaestus/UnknownTypeError.tsx';
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

type CaptureLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.CaptureLabel;
}>;

type CaptureAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.CaptureAmount;
}>;

type DefeatWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DefeatLabel;
}>;

type SurvivalWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  rounds: number;
  type: Criteria.Survival;
}>;

type EscortLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.EscortLabel;
  vectors: ReadonlySet<Vector>;
}>;

type EscortAmountWinCondition = Readonly<{
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

type RescueLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.RescueLabel;
}>;

type DefeatAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DefeatAmount;
}>;

type DefeatOneLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DefeatOneLabel;
}>;

type DestroyLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DestroyLabel;
}>;

type DestroyAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.DestroyAmount;
}>;

type RescueAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: Criteria.RescueAmount;
}>;

export type WinConditionsWithVectors =
  | EscortLabelWinCondition
  | EscortAmountWinCondition;

export type WinCondition =
  | Readonly<{
      hidden: boolean;
      reward?: Reward | null;
      type: Criteria.Default;
    }>
  | CaptureAmountWinCondition
  | CaptureLabelWinCondition
  | DefeatAmountWinCondition
  | DefeatOneLabelWinCondition
  | DefeatWinCondition
  | DestroyAmountWinCondition
  | DestroyLabelWinCondition
  | EscortAmountWinCondition
  | EscortLabelWinCondition
  | RescueAmountWinCondition
  | RescueLabelWinCondition
  | SurvivalWinCondition;

export type PlainWinCondition =
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

export type WinConditions = ReadonlyArray<WinCondition>;
export type PlainWinConditions = ReadonlyArray<PlainWinCondition>;

export function encodeWinCondition(condition: WinCondition): PlainWinCondition {
  const { hidden, type } = condition;
  switch (type) {
    case Criteria.Default:
      return [type, hidden ? 1 : 0, maybeEncodeReward(condition.reward)];
    case Criteria.CaptureLabel:
    case Criteria.DestroyLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.CaptureAmount:
    case Criteria.DestroyAmount:
      return [
        type,
        hidden ? 1 : 0,
        condition.amount,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.DefeatLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.EscortLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        encodeVectorArray([...condition.vectors]),
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.Survival:
      return [
        type,
        hidden ? 1 : 0,
        condition.rounds,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.EscortAmount:
      return [
        type,
        hidden ? 1 : 0,
        condition.amount,
        condition.players,
        encodeVectorArray([...condition.vectors]),
        condition.label ? Array.from(condition.label) : [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.RescueAmount:
      return [
        type,
        hidden ? 1 : 0,
        condition.amount,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.RescueLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.DefeatAmount:
      return [
        type,
        hidden ? 1 : 0,
        condition.amount,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case Criteria.DefeatOneLabel:
      return [
        type,
        hidden ? 1 : 0,
        condition.label ? Array.from(condition.label) : [],
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    default: {
      condition satisfies never;
      throw new UnknownTypeError('encodeWinCondition', type);
    }
  }
}

export function decodeWinCondition(condition: PlainWinCondition): WinCondition {
  const type = condition[0];
  switch (type) {
    case Criteria.Default: {
      return {
        hidden: !!condition[1],
        reward: maybeDecodeReward(condition[2]),
        type,
      };
    }
    case Criteria.CaptureLabel:
    case Criteria.DestroyLabel:
      return {
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        label: new Set(toPlayerIDs(condition[2])),
        optional: !!condition[5],
        players: condition[3] ? toPlayerIDs(condition[3]) : undefined,
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    case Criteria.CaptureAmount:
    case Criteria.DestroyAmount:
      return {
        amount: condition[2]!,
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        optional: !!condition[5],
        players: condition[3] ? toPlayerIDs(condition[3]) : undefined,
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    case Criteria.DefeatLabel:
      return {
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        label: new Set(toPlayerIDs(condition[2])),
        optional: !!condition[5],
        players: condition[3] ? toPlayerIDs(condition[3]) : undefined,
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    case Criteria.EscortLabel:
      return {
        completed: condition[7]
          ? new Set(toPlayerIDs(condition[7]))
          : new Set(),
        hidden: !!condition[1],
        label: new Set(toPlayerIDs(condition[2])),
        optional: !!condition[6],
        players: toPlayerIDs(condition[3]),
        reward: maybeDecodeReward(condition[5]),
        type,
        vectors: new Set(decodeVectorArray(condition[4])),
      };
    case Criteria.Survival:
      return {
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        optional: !!condition[5],
        players: toPlayerIDs(condition[3]),
        reward: maybeDecodeReward(condition[4]),
        rounds: condition[2]!,
        type,
      };
    case Criteria.EscortAmount:
      return {
        amount: condition[2],
        completed: condition[8]
          ? new Set(toPlayerIDs(condition[8]))
          : new Set(),
        hidden: !!condition[1],
        label: condition[5] ? new Set(toPlayerIDs(condition[5])) : undefined,
        optional: !!condition[7],
        players: toPlayerIDs(condition[3]),
        reward: maybeDecodeReward(condition[6]),
        type,
        vectors: new Set(decodeVectorArray(condition[4])),
      };
    case Criteria.RescueAmount:
      return {
        amount: condition[2],
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        optional: !!condition[5],
        players: condition[3] ? toPlayerIDs(condition[3]) : undefined,
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    case Criteria.RescueLabel:
      return {
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        label: new Set(toPlayerIDs(condition[2])),
        optional: !!condition[5],
        players: condition[3] ? toPlayerIDs(condition[3]) : undefined,
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    case Criteria.DefeatAmount:
      return {
        amount: condition[2],
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        optional: !!condition[5],
        players: toPlayerIDs(condition[3]),
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    case Criteria.DefeatOneLabel:
      return {
        completed: condition[6]
          ? new Set(toPlayerIDs(condition[6]))
          : new Set(),
        hidden: !!condition[1],
        label: condition[2] ? new Set(toPlayerIDs(condition[2])) : new Set(),
        optional: !!condition[5],
        players: condition[3] ? toPlayerIDs(condition[3]) : undefined,
        reward: maybeDecodeReward(condition[4]),
        type,
      };
    default: {
      condition satisfies never;
      throw new UnknownTypeError('decodeWinCondition', type);
    }
  }
}

export function encodeWinConditions(conditions: WinConditions) {
  return conditions.map(encodeWinCondition);
}

export function decodeWinConditions(conditions: PlainWinConditions) {
  return conditions.map(decodeWinCondition);
}

export function formatWinCondition(condition: WinCondition) {
  const newCondition: Record<string, unknown> = { ...condition };
  if ('label' in condition && condition.label) {
    newCondition.label = Array.from(condition.label || []);
  }
  if ('players' in condition && condition.players) {
    newCondition.players = Array.from(condition.players || []);
  }
  if ('vectors' in condition) {
    newCondition.vectors = Array.from(condition.vectors).map(String);
  }
  return newCondition;
}

export function winConditionHasVectors(
  condition: WinCondition,
): condition is EscortLabelWinCondition | EscortAmountWinCondition {
  const { type } = condition;
  return type === Criteria.EscortLabel || type === Criteria.EscortAmount;
}

export function winConditionHasLabel(
  condition: WinCondition,
): condition is
  | CaptureLabelWinCondition
  | DefeatOneLabelWinCondition
  | DefeatWinCondition
  | DestroyLabelWinCondition
  | EscortAmountWinCondition
  | EscortLabelWinCondition
  | RescueLabelWinCondition {
  const { type } = condition;
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

export function winConditionHasAmounts(
  condition: WinCondition,
): condition is
  | CaptureAmountWinCondition
  | DefeatAmountWinCondition
  | DestroyAmountWinCondition
  | EscortAmountWinCondition
  | RescueAmountWinCondition {
  const { type } = condition;
  return (
    type === Criteria.CaptureAmount ||
    type === Criteria.DestroyAmount ||
    type === Criteria.DefeatAmount ||
    type === Criteria.RescueAmount ||
    type === Criteria.EscortAmount
  );
}

export function winConditionHasRounds(
  condition: WinCondition,
): condition is SurvivalWinCondition {
  const { type } = condition;
  return type === Criteria.Survival;
}

export function getOpponentPriorityLabels(
  conditions: WinConditions,
  player: PlayerID,
) {
  const labels = new Set<PlayerID>();
  for (const condition of conditions) {
    if (!winConditionHasLabel(condition) || !condition.label?.size) {
      continue;
    }

    const { label, players, type } = condition;
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

export function validateWinCondition(map: MapData, condition: WinCondition) {
  const { hidden, type } = condition;
  if (
    (hidden !== false && hidden !== true) ||
    (condition.reward && !validateReward(condition.reward)) ||
    (type !== Criteria.Default && condition.completed?.size)
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
        validateLabel(condition.label) &&
        (condition.players?.length
          ? validatePlayers(map, condition.players)
          : true)
      );
    case Criteria.CaptureAmount:
    case Criteria.DefeatAmount:
    case Criteria.DestroyAmount:
      if (!validateAmount(condition.amount)) {
        return false;
      }
      return condition.players?.length
        ? validatePlayers(map, condition.players)
        : true;
    case Criteria.EscortLabel:
      if (![...condition.vectors].every(validateVector)) {
        return false;
      }
      return (
        validateLabel(condition.label) &&
        validatePlayers(map, condition.players)
      );
    case Criteria.Survival:
      if (
        !isPositiveInteger(condition.rounds) ||
        condition.rounds < MIN_ROUNDS ||
        condition.rounds > MAX_ROUNDS
      ) {
        return false;
      }

      if (!validatePlayers(map, condition.players)) {
        return false;
      }

      return condition.players.includes(map.active[0])
        ? condition.rounds > 1
        : true;
    case Criteria.EscortAmount:
      if (!validateAmount(condition.amount)) {
        return false;
      }

      if (condition.label?.size && !validateLabel(condition.label)) {
        return false;
      }

      return (
        validatePlayers(map, toPlayerIDs(condition.players)) &&
        [...condition.vectors].every(validateVector)
      );
    case Criteria.RescueAmount:
      if (!validateAmount(condition.amount)) {
        return false;
      }

      return condition.players?.length
        ? validatePlayers(map, condition.players)
        : true;
    default: {
      condition satisfies never;
      return false;
    }
  }
}

export function validateWinConditions(map: MapData) {
  const { winConditions } = map.config;
  if (
    !Array.isArray(winConditions) ||
    winConditions.length > 32 ||
    winConditions.filter(({ type }) => type === Criteria.Default).length > 1
  ) {
    return false;
  }

  if (
    winConditions.every(
      (condition) => condition.type !== Criteria.Default && condition.optional,
    )
  ) {
    return false;
  }

  return winConditions.every(validateWinCondition.bind(null, map));
}

export function resetWinConditions(
  conditions: WinConditions,
  active: PlayerIDSet,
): WinConditions {
  return conditions.map((condition) =>
    condition.type === Criteria.Default || !condition.players
      ? { ...condition, completed: new Set() }
      : ({
          ...condition,
          completed: new Set(),
          players: condition.players.filter((player) => active.has(player)),
        } as const),
  );
}

export function onlyHasDefaultWinCondition(winConditions: WinConditions) {
  return (
    winConditions.length === 0 ||
    (winConditions.length === 1 && winConditions[0].type === Criteria.Default)
  );
}

export function getHiddenLabels(conditions: WinConditions): PlayerIDSet | null {
  if (onlyHasDefaultWinCondition(conditions)) {
    return null;
  }

  let labels: Set<PlayerID> | null = null;
  for (const condition of conditions) {
    if (
      condition.hidden &&
      winConditionHasLabel(condition) &&
      condition.label
    ) {
      for (const label of condition.label) {
        if (!labels) {
          labels = new Set();
        }

        labels.add(label);
      }
    }
  }
  return labels;
}

export function getInitialWinCondition(
  map: MapData,
  criteria: Criteria,
): WinCondition {
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
      throw new UnknownTypeError('getInitialWinCondition', criteria);
    }
  }
}
