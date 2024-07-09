import { Skill } from '@deities/athena/info/Skill.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { DynamicPlayerID, PlayerID } from '@deities/athena/map/Player.tsx';
import { Reward } from '@deities/athena/map/Reward.tsx';
import { Teams } from '@deities/athena/map/Team.tsx';
import Unit, { DryUnit } from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { Objective } from '@deities/athena/Objectives.tsx';
import ImmutableMap from '@nkzw/immutable-map';
import { HiddenActionResponse } from './HiddenAction.tsx';
import { ObjectiveActionResponses } from './Objective.tsx';

export type MoveActionResponse = Readonly<{
  completed?: boolean;
  from: Vector;
  fuel: number;
  path?: ReadonlyArray<Vector>;
  to: Vector;
  type: 'Move';
}>;

export type AttackUnitActionResponse = Readonly<{
  chargeA?: number;
  chargeB?: number;
  from: Vector;
  hasCounterAttack: boolean;
  playerA: PlayerID;
  playerB: PlayerID;
  to: Vector;
  type: 'AttackUnit';
  unitA?: DryUnit;
  unitB?: DryUnit;
}>;

export type AttackBuildingActionResponse = Readonly<{
  building?: Building;
  chargeA?: number;
  chargeB?: number;
  chargeC?: number;
  from: Vector;
  hasCounterAttack: boolean;
  playerA: PlayerID;
  playerC?: PlayerID;
  to: Vector;
  type: 'AttackBuilding';
  unitA?: DryUnit;
  unitC?: DryUnit;
}>;

export type CaptureActionResponse = Readonly<{
  building?: Building;
  from: Vector;
  player?: PlayerID;
  type: 'Capture';
}>;

export type SupplyActionResponse = Readonly<{
  from: Vector;
  player: PlayerID;
  type: 'Supply';
}>;

export type CreateUnitActionResponse = Readonly<{
  free?: boolean;
  from: Vector;
  skipBehaviorRotation?: boolean;
  to: Vector;
  type: 'CreateUnit';
  unit: Unit;
}>;

export type DropUnitActionResponse = Readonly<{
  from: Vector;
  index: number;
  to: Vector;
  type: 'DropUnit';
}>;

export type CreateBuildingActionResponse = Readonly<{
  building: Building;
  from: Vector;
  type: 'CreateBuilding';
}>;

export type CreateTracksActionResponse = Readonly<{
  from: Vector;
  type: 'CreateTracks';
}>;

export type FoldActionResponse = Readonly<{
  from: Vector;
  type: 'Fold';
}>;

export type UnfoldActionResponse = Readonly<{
  from: Vector;
  type: 'Unfold';
}>;

export type CompleteUnitActionResponse = Readonly<{
  from: Vector;
  type: 'CompleteUnit';
}>;

export type CompleteBuildingActionResponse = Readonly<{
  from: Vector;
  type: 'CompleteBuilding';
}>;

export type EndTurnActionResponse = Readonly<{
  current: Readonly<{ funds: number; player: PlayerID }>;
  miss?: boolean;
  next: Readonly<{ funds: number; player: PlayerID }>;
  rotatePlayers?: boolean;
  round: number;
  supply?: ReadonlyArray<Vector>;
  type: 'EndTurn';
}>;

export type MessageActionResponse = Readonly<{
  message: string;
  player?: PlayerID;
  type: 'Message';
}>;

export type CharacterMessageActionResponse = Readonly<{
  message: string;
  player: DynamicPlayerID;
  type: 'CharacterMessage';
  unitId: number;
  variant?: number;
}>;

export type ToggleLightningActionResponse = Readonly<{
  from?: Vector;
  player?: PlayerID;
  to: Vector;
  type: 'ToggleLightning';
}>;

export type SpawnActionResponse = Readonly<{
  teams?: Teams;
  type: 'Spawn';
  units: ImmutableMap<Vector, Unit>;
}>;

export type HealActionResponse = Readonly<{
  from?: Vector;
  to: Vector;
  type: 'Heal';
}>;

export type RescueActionResponse = Readonly<{
  from?: Vector;
  name?: number;
  player: PlayerID;
  to: Vector;
  type: 'Rescue';
}>;

export type SabotageActionResponse = Readonly<{
  from?: Vector;
  to: Vector;
  type: 'Sabotage';
}>;

export type MoveUnitActionResponse = Readonly<{
  from: Vector;
  type: 'MoveUnit';
}>;

export type StartActionResponse = Readonly<{
  type: 'Start';
}>;

export type BeginGameActionResponse = Readonly<{
  type: 'BeginGame';
}>;

export type SetViewerActionResponse = Readonly<{
  type: 'SetViewer';
}>;

export type ReceiveRewardActionResponse = Readonly<{
  permanent?: boolean;
  player: PlayerID;
  reward: Reward;
  type: 'ReceiveReward';
}>;

export type BuySkillActionResponse = Readonly<{
  from: Vector;
  player: PlayerID;
  skill: Skill;
  type: 'BuySkill';
}>;

export type ActivatePowerActionResponse = Readonly<{
  skill: Skill;
  type: 'ActivatePower';
}>;

export type SecretDiscoveredActionResponse = Readonly<{
  objective: Objective;
  toPlayer?: PlayerID;
  type: 'SecretDiscovered';
}>;

export type ActionResponse =
  | ActivatePowerActionResponse
  | AttackBuildingActionResponse
  | AttackUnitActionResponse
  | BeginGameActionResponse
  | BuySkillActionResponse
  | CaptureActionResponse
  | CharacterMessageActionResponse
  | CompleteBuildingActionResponse
  | CompleteUnitActionResponse
  | CreateBuildingActionResponse
  | CreateTracksActionResponse
  | CreateUnitActionResponse
  | DropUnitActionResponse
  | EndTurnActionResponse
  | FoldActionResponse
  | HealActionResponse
  | MessageActionResponse
  | MoveActionResponse
  | MoveUnitActionResponse
  | ReceiveRewardActionResponse
  | RescueActionResponse
  | SabotageActionResponse
  | SecretDiscoveredActionResponse
  | SetViewerActionResponse
  | SpawnActionResponse
  | StartActionResponse
  | SupplyActionResponse
  | ToggleLightningActionResponse
  | UnfoldActionResponse
  // List of further Action Responses.
  | HiddenActionResponse
  | ObjectiveActionResponses;

export type ActionResponses = ReadonlyArray<ActionResponse>;
export type ActionResponseType = ActionResponse['type'];
