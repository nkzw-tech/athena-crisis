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

export enum WinCriteria {
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
}

export const WinCriteriaList = [
  WinCriteria.Default,
  WinCriteria.CaptureLabel,
  WinCriteria.CaptureAmount,
  WinCriteria.DefeatLabel,
  WinCriteria.DefeatOneLabel,
  WinCriteria.DefeatAmount,
  WinCriteria.EscortLabel,
  WinCriteria.EscortAmount,
  WinCriteria.Survival,
  WinCriteria.RescueLabel,
  WinCriteria.DestroyLabel,
  WinCriteria.DestroyAmount,
] as const;

export const WinCriteriaListWithoutDefault = [
  WinCriteria.CaptureLabel,
  WinCriteria.CaptureAmount,
  WinCriteria.DefeatLabel,
  WinCriteria.DefeatAmount,
  WinCriteria.EscortLabel,
  WinCriteria.EscortAmount,
  WinCriteria.Survival,
  WinCriteria.RescueLabel,
  WinCriteria.DefeatOneLabel,
  WinCriteria.DestroyLabel,
  WinCriteria.DestroyAmount,
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
  type: WinCriteria.CaptureLabel;
}>;

type CaptureAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.CaptureAmount;
}>;

type DefeatWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.DefeatLabel;
}>;

type SurvivalWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  rounds: number;
  type: WinCriteria.Survival;
}>;

type EscortLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.EscortLabel;
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
  type: WinCriteria.EscortAmount;
  vectors: ReadonlySet<Vector>;
}>;

type RescueLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.RescueLabel;
}>;

type DefeatAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.DefeatAmount;
}>;

type DefeatOneLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.DefeatOneLabel;
}>;

type DestroyLabelWinCondition = Readonly<{
  completed?: PlayerIDSet;
  hidden: boolean;
  label: PlayerIDSet;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.DestroyLabel;
}>;

type DestroyAmountWinCondition = Readonly<{
  amount: number;
  completed?: PlayerIDSet;
  hidden: boolean;
  optional: boolean;
  players?: PlayerIDs;
  reward?: Reward | null;
  type: WinCriteria.DestroyAmount;
}>;

export type WinConditionsWithVectors =
  | EscortLabelWinCondition
  | EscortAmountWinCondition;

export type WinCondition =
  | Readonly<{
      hidden: boolean;
      reward?: Reward | null;
      type: WinCriteria.Default;
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
  | RescueLabelWinCondition
  | SurvivalWinCondition;

export type PlainWinCondition =
  | [
      type: WinCriteria.Default,
      hidden: 0 | 1,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.CaptureLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.CaptureAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.DefeatLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.EscortLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      vectors: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.Survival,
      hidden: 0 | 1,
      rounds: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.EscortAmount,
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
      type: WinCriteria.RescueLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.DefeatAmount,
      hidden: 0 | 1,
      amount: number,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.DefeatOneLabel,
      hidden: 0 | 1,
      label: null | ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.DestroyLabel,
      hidden: 0 | 1,
      label: ReadonlyArray<number>,
      players: ReadonlyArray<number>,
      reward?: EncodedReward | null,
      optional?: 0 | 1,
      completed?: ReadonlyArray<number>,
    ]
  | [
      type: WinCriteria.DestroyAmount,
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
    case WinCriteria.Default:
      return [type, hidden ? 1 : 0, maybeEncodeReward(condition.reward)];
    case WinCriteria.CaptureLabel:
    case WinCriteria.DestroyLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case WinCriteria.CaptureAmount:
    case WinCriteria.DestroyAmount:
      return [
        type,
        hidden ? 1 : 0,
        condition.amount,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case WinCriteria.DefeatLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case WinCriteria.EscortLabel:
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
    case WinCriteria.Survival:
      return [
        type,
        hidden ? 1 : 0,
        condition.rounds,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case WinCriteria.EscortAmount:
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
    case WinCriteria.RescueLabel:
      return [
        type,
        hidden ? 1 : 0,
        Array.from(condition.label),
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case WinCriteria.DefeatAmount:
      return [
        type,
        hidden ? 1 : 0,
        condition.amount,
        condition.players || [],
        maybeEncodeReward(condition.reward),
        condition.optional ? 1 : 0,
        condition.completed?.size ? Array.from(condition.completed) : [],
      ];
    case WinCriteria.DefeatOneLabel:
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
    case WinCriteria.Default: {
      return {
        hidden: !!condition[1],
        reward: maybeDecodeReward(condition[2]),
        type,
      };
    }
    case WinCriteria.CaptureLabel:
    case WinCriteria.DestroyLabel:
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
    case WinCriteria.CaptureAmount:
    case WinCriteria.DestroyAmount:
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
    case WinCriteria.DefeatLabel:
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
    case WinCriteria.EscortLabel:
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
    case WinCriteria.Survival:
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
    case WinCriteria.EscortAmount:
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
    case WinCriteria.RescueLabel:
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
    case WinCriteria.DefeatAmount:
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
    case WinCriteria.DefeatOneLabel:
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
  return type === WinCriteria.EscortLabel || type === WinCriteria.EscortAmount;
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
    type === WinCriteria.CaptureLabel ||
    type === WinCriteria.DefeatLabel ||
    type === WinCriteria.DefeatOneLabel ||
    type === WinCriteria.DestroyLabel ||
    type === WinCriteria.EscortLabel ||
    type === WinCriteria.EscortAmount ||
    type === WinCriteria.RescueLabel
  );
}

export function winConditionHasAmounts(
  condition: WinCondition,
): condition is
  | CaptureAmountWinCondition
  | DefeatAmountWinCondition
  | DestroyAmountWinCondition
  | EscortAmountWinCondition {
  const { type } = condition;
  return (
    type === WinCriteria.CaptureAmount ||
    type === WinCriteria.DestroyAmount ||
    type === WinCriteria.DefeatAmount ||
    type === WinCriteria.EscortAmount
  );
}

export function winConditionHasRounds(
  condition: WinCondition,
): condition is SurvivalWinCondition {
  const { type } = condition;
  return type === WinCriteria.Survival;
}

export function getOpponentPriorityLabels(
  conditions: WinConditions,
  player: PlayerID,
) {
  return new Set(
    conditions.flatMap((condition) =>
      winConditionHasLabel(condition) &&
      condition.label &&
      (((condition.type === WinCriteria.DefeatLabel ||
        condition.type === WinCriteria.DestroyLabel ||
        condition.type === WinCriteria.DefeatOneLabel) &&
        (!condition.players || condition.players.includes(player))) ||
        ((condition.type === WinCriteria.EscortAmount ||
          condition.type === WinCriteria.EscortLabel ||
          condition.type === WinCriteria.RescueLabel) &&
          condition.players &&
          !condition.players.includes(player)))
        ? [...condition.label]
        : [],
    ),
  );
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
    (type !== WinCriteria.Default && condition.completed?.size)
  ) {
    return false;
  }

  const validateVector = (vector: Vector) => map.contains(vector);

  switch (type) {
    case WinCriteria.Default:
      return true;
    case WinCriteria.CaptureLabel:
    case WinCriteria.DefeatLabel:
    case WinCriteria.DefeatOneLabel:
    case WinCriteria.DestroyLabel:
    case WinCriteria.RescueLabel:
      return (
        validateLabel(condition.label) &&
        (condition.players?.length
          ? validatePlayers(map, condition.players)
          : true)
      );
    case WinCriteria.CaptureAmount:
    case WinCriteria.DefeatAmount:
    case WinCriteria.DestroyAmount:
      if (!validateAmount(condition.amount)) {
        return false;
      }
      return condition.players?.length
        ? validatePlayers(map, condition.players)
        : true;
    case WinCriteria.EscortLabel:
      if (![...condition.vectors].every(validateVector)) {
        return false;
      }
      return (
        validateLabel(condition.label) &&
        validatePlayers(map, condition.players)
      );
    case WinCriteria.Survival:
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
    case WinCriteria.EscortAmount:
      if (condition.label?.size && !validateLabel(condition.label)) {
        return false;
      }

      if (
        !isPositiveInteger(condition.amount) ||
        condition.amount > MAX_AMOUNT
      ) {
        return false;
      }

      return (
        validatePlayers(map, toPlayerIDs(condition.players)) &&
        [...condition.vectors].every(validateVector)
      );
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
    winConditions.filter(({ type }) => type === WinCriteria.Default).length > 1
  ) {
    return false;
  }

  if (
    winConditions.filter(({ type }) => type === WinCriteria.Default).length > 1
  ) {
    return false;
  }

  if (
    winConditions.every(
      (condition) =>
        condition.type !== WinCriteria.Default && condition.optional,
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
    condition.type === WinCriteria.Default || !condition.players
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
    (winConditions.length === 1 &&
      winConditions[0].type === WinCriteria.Default)
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
  criteria: WinCriteria,
): WinCondition {
  const hidden = false;
  const optional = false;
  const currentPlayer = map.getCurrentPlayer().id;
  const players = [currentPlayer > 0 ? currentPlayer : map.active[0]];
  const label = new Set(players);
  switch (criteria) {
    case WinCriteria.Default:
      return {
        hidden,
        type: criteria,
      };
    case WinCriteria.CaptureLabel:
    case WinCriteria.DestroyLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    case WinCriteria.DefeatLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    case WinCriteria.CaptureAmount:
    case WinCriteria.DestroyAmount:
      return {
        amount: 10,
        hidden,
        optional,
        type: criteria,
      };
    case WinCriteria.EscortLabel:
      return {
        hidden,
        label,
        optional,
        players,
        type: criteria,
        vectors: new Set(),
      };
    case WinCriteria.Survival:
      return {
        hidden,
        optional,
        players,
        rounds: MIN_ROUNDS + 4,
        type: criteria,
      };
    case WinCriteria.EscortAmount:
      return {
        amount: 1,
        hidden,
        optional,
        players,
        type: criteria,
        vectors: new Set(),
      };
    case WinCriteria.RescueLabel:
      return {
        hidden,
        label,
        optional,
        type: criteria,
      };
    case WinCriteria.DefeatAmount:
      return {
        amount: 5,
        hidden,
        optional,
        players,
        type: criteria,
      };
    case WinCriteria.DefeatOneLabel:
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
