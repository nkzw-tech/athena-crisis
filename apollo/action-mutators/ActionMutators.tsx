import { Skill } from '@deities/athena/info/Skill.tsx';
import { Crystal } from '@deities/athena/invasions/Crystal.tsx';
import { PlayerID } from '@deities/athena/map/Player.tsx';
import Vector from '@deities/athena/map/Vector.tsx';

export const MoveAction = (
  from: Vector,
  to: Vector,
  path?: ReadonlyArray<Vector> | null,
  complete?: boolean,
) =>
  ({
    ...(complete ? { complete } : null),
    from,
    ...(path ? { path } : null),
    to,
    type: 'Move',
  }) as const;

export const AttackUnitAction = (from: Vector, to: Vector) =>
  ({ from, to, type: 'AttackUnit' }) as const;

export const AttackBuildingAction = (from: Vector, to: Vector) =>
  ({ from, to, type: 'AttackBuilding' }) as const;

export const CaptureAction = (from: Vector) =>
  ({ from, type: 'Capture' }) as const;

export const SupplyAction = (from: Vector) =>
  ({ from, type: 'Supply' }) as const;

export const CreateUnitAction = (from: Vector, id: number, to: Vector) =>
  ({ from, id, to, type: 'CreateUnit' }) as const;

export const DropUnitAction = (from: Vector, index: number, to: Vector) =>
  ({ from, index, to, type: 'DropUnit' }) as const;

export const CreateBuildingAction = (from: Vector, id: number) =>
  ({ from, id, type: 'CreateBuilding' }) as const;

export const CreateTracksAction = (from: Vector) =>
  ({ from, type: 'CreateTracks' }) as const;

export const FoldAction = (from: Vector) => ({ from, type: 'Fold' }) as const;

export const UnfoldAction = (from: Vector) =>
  ({ from, type: 'Unfold' }) as const;

export const CompleteUnitAction = (from: Vector) =>
  ({ from, type: 'CompleteUnit' }) as const;

export const CompleteBuildingAction = (from: Vector) =>
  ({ from, type: 'CompleteBuilding' }) as const;

export const EndTurnAction = () => ({ type: 'EndTurn' }) as const;

export const MessageAction = (message: string, player?: PlayerID) =>
  ({ message, player, type: 'Message' }) as const;

export const ToggleLightningAction = (from: Vector, to: Vector) =>
  ({ from, to, type: 'ToggleLightning' }) as const;

export const HealAction = (from: Vector, to: Vector) =>
  ({ from, to, type: 'Heal' }) as const;

export const RescueAction = (from: Vector, to: Vector) =>
  ({ from, to, type: 'Rescue' }) as const;

export const SabotageAction = (from: Vector, to: Vector) =>
  ({ from, to, type: 'Sabotage' }) as const;

export const StartAction = () => ({ type: 'Start' }) as const;

export const BuySkillAction = (from: Vector, skill: Skill) =>
  ({ from, skill, type: 'BuySkill' }) as const;

export const ActivatePowerAction = (skill: Skill, from?: Vector) =>
  ({ from, skill, type: 'ActivatePower' }) as const;

export const ActivateCrystalAction = (crystal: Crystal) =>
  ({ crystal, type: 'ActivateCrystal' }) as const;
