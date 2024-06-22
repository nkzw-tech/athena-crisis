import getAllUnitsToRefill from '@deities/athena/lib/getAllUnitsToRefill.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import getUnitsToRefill from '@deities/athena/lib/getUnitsToRefill.tsx';
import Entity from '@deities/athena/map/Entity.tsx';
import vec from '@deities/athena/map/vec.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import MapData from '@deities/athena/MapData.tsx';
import { moveable } from '@deities/athena/Radius.tsx';
import { VisionT } from '@deities/athena/Vision.tsx';
import {
  ActionResponse,
  ActionResponses,
  AttackBuildingActionResponse,
  AttackUnitActionResponse,
  CaptureActionResponse,
  CompleteUnitActionResponse,
  CreateBuildingActionResponse,
  CreateUnitActionResponse,
  DropUnitActionResponse,
  EndTurnActionResponse,
  HealActionResponse,
  MoveActionResponse,
  MoveUnitActionResponse,
  RescueActionResponse,
  SabotageActionResponse,
  SpawnActionResponse,
  SupplyActionResponse,
  ToggleLightningActionResponse,
} from '../ActionResponse.tsx';
import getAttackDirection from '../attack-direction/getAttackDirection.tsx';
import {
  HiddenDestroyedBuildingActionResponse,
  HiddenMoveActionResponse,
  HiddenSourceAttackBuildingActionResponse,
  HiddenSourceAttackUnitActionResponse,
  HiddenTargetAttackBuildingActionResponse,
  HiddenTargetAttackUnitActionResponse,
} from '../HiddenAction.tsx';
import { GameState } from '../Types.tsx';

const completeUnit = ({ from }: { from: Vector }) =>
  ({
    from,
    type: 'CompleteUnit',
  }) as const;

const supplyActionWithDefault =
  (
    defaultFn: (actionResponse: SupplyActionResponse) => ActionResponse | null,
  ) =>
  (
    actionResponse: SupplyActionResponse,
    map: MapData,
    activeMap: MapData,
    vision: VisionT,
  ) => {
    const unit = map.units.get(actionResponse.from);
    return unit
      ? getUnitsToRefill(map, vision, map.getPlayer(unit), actionResponse.from)
          .size
        ? actionResponse
        : defaultFn(actionResponse)
      : null;
  };

const getAttackWeapon = (
  map: MapData,
  from: Vector,
  entityB: Entity | undefined,
): number | undefined =>
  entityB && map.units.get(from)?.getAttackWeapon(entityB)?.id;

type VisibleModifierAction<T> =
  | true
  | ((
      actionResponse: T,
      previousMap: MapData,
      activeMap: MapData,
      vision: VisionT,
    ) => ActionResponse | ActionResponses | null);

type VisibleModifier<T extends ActionResponse> =
  | false
  | VisibleModifierAction<T>
  | {
      Both?: VisibleModifierAction<T>;
      Hidden?: VisibleModifierAction<T>;
      Source?: VisibleModifierAction<T>;
      Target?: VisibleModifierAction<T>;
    };

const VisibleActionModifiers: Record<
  ActionResponse['type'],
  VisibleModifier<never>
> = {
  ActivatePower: true,
  AttackBuilding: {
    Both: true,
    Hidden: ({
      building,
      to,
    }: AttackBuildingActionResponse): HiddenDestroyedBuildingActionResponse | null =>
      building ? null : { to, type: 'HiddenDestroyedBuilding' },
    Source: (
      {
        building,
        chargeA,
        from,
        hasCounterAttack,
        playerA,
        to,
        unitA,
      }: AttackBuildingActionResponse,
      map: MapData,
      activeMap: MapData,
    ): HiddenTargetAttackBuildingActionResponse => {
      const newUnitA = activeMap.units.get(from);
      return {
        chargeA,
        direction: getAttackDirection(from, to)[0],
        from,
        hasCounterAttack,
        newPlayerA:
          unitA && newUnitA && newUnitA.player !== map.units.get(from)?.player
            ? newUnitA.player
            : undefined,
        playerA,
        ...(!building ? { to } : null),
        type: 'HiddenTargetAttackBuilding',
        unitA,
        weapon: getAttackWeapon(map, from, map.buildings.get(to)),
      };
    },
    Target: (
      {
        building,
        chargeB,
        chargeC,
        from,
        hasCounterAttack,
        playerC,
        to,
        unitC,
      }: AttackBuildingActionResponse,
      map: MapData,
    ): HiddenSourceAttackBuildingActionResponse => ({
      building,
      chargeB,
      chargeC,
      direction: getAttackDirection(from, to)[1],
      hasCounterAttack,
      playerC,
      to,
      type: 'HiddenSourceAttackBuilding',
      unitC,
      weapon: hasCounterAttack
        ? getAttackWeapon(map, to, map.units.get(from))
        : undefined,
    }),
  },
  AttackUnit: {
    Both: true,
    Source: (
      {
        chargeA,
        from,
        hasCounterAttack,
        playerA,
        to,
        unitA,
      }: AttackUnitActionResponse,
      map: MapData,
      activeMap: MapData,
    ): HiddenTargetAttackUnitActionResponse => {
      const newUnitA = activeMap.units.get(from);
      return {
        chargeA,
        direction: getAttackDirection(from, to)[0],
        from,
        hasCounterAttack,
        newPlayerA:
          unitA && newUnitA && newUnitA.player !== map.units.get(from)?.player
            ? newUnitA.player
            : undefined,
        playerA,
        type: 'HiddenTargetAttackUnit',
        unitA,
        weapon: getAttackWeapon(map, from, map.units.get(to)),
      };
    },
    Target: (
      {
        chargeB,
        from,
        hasCounterAttack,
        playerB,
        to,
        unitB,
      }: AttackUnitActionResponse,
      map: MapData,
      activeMap: MapData,
    ): HiddenSourceAttackUnitActionResponse => {
      const newUnitB = activeMap.units.get(to);
      return {
        chargeB,
        direction: getAttackDirection(from, to)[1],
        hasCounterAttack,
        newPlayerB:
          unitB && newUnitB && newUnitB.player !== map.units.get(to)?.player
            ? newUnitB.player
            : undefined,
        playerB,
        to,
        type: 'HiddenSourceAttackUnit',
        unitB,
        weapon: hasCounterAttack
          ? getAttackWeapon(map, to, map.units.get(from))
          : undefined,
      };
    },
  },
  AttackUnitGameOver: true,
  BeginGame: true,
  BeginTurnGameOver: true,
  BuySkill: true,
  Capture: {
    Hidden: (
      actionResponse: CaptureActionResponse,
    ): null | CaptureActionResponse => {
      const { building } = actionResponse;
      return building && building.info.configuration.attackStatusEffect
        ? actionResponse
        : null;
    },
    Source: true,
  },
  CaptureGameOver: true,
  CharacterMessage: true,
  CompleteBuilding: { Source: true },
  CompleteUnit: { Source: true },
  CreateBuilding: {
    Hidden: (
      actionResponse: CreateBuildingActionResponse,
      _: MapData,
      activeMap: MapData,
    ): CreateBuildingActionResponse => ({
      ...actionResponse,
      building: actionResponse.building.hide(activeMap.config.biome),
    }),
    Source: true,
  },
  CreateTracks: true,
  CreateUnit: {
    Both: true,
    Source: true,
    Target: (
      { from, to, unit }: CreateUnitActionResponse,
      _: MapData,
      activeMap: MapData,
    ): HiddenMoveActionResponse => ({
      path: [from, to],
      type: 'HiddenMove',
      unit,
    }),
  },
  DropUnit: {
    Both: true,
    Source: true,
    Target: (
      { from, index, to }: DropUnitActionResponse,
      map: MapData,
    ): [HiddenMoveActionResponse, CompleteUnitActionResponse] | null => {
      const unitA = map.units.get(from);
      const unitB = unitA && unitA.getTransportedUnit(index);
      return unitB
        ? [
            {
              path: [from, to],
              type: 'HiddenMove',
              unit: unitB.deploy(),
            },
            completeUnit({ from: to }),
          ]
        : null;
    },
  },
  EndTurn: computeVisibleEndTurnActionResponse,
  Fold: { Source: true },
  GameEnd: true,
  Heal: {
    Both: true,
    Source: (
      { from }: HealActionResponse,
      map: MapData,
      activeMap: MapData,
    ): null | MoveUnitActionResponse =>
      map.units.get(from!)!.hasMoved()
        ? null
        : {
            from: from!,
            type: 'MoveUnit',
          },
    Target: ({ to, type }): HealActionResponse => ({
      to,
      type,
    }),
  },
  HiddenDestroyedBuilding: false,
  HiddenFundAdjustment: false,
  HiddenMove: false,
  HiddenSourceAttackBuilding: false,
  HiddenSourceAttackUnit: false,
  HiddenTargetAttackBuilding: false,
  HiddenTargetAttackUnit: false,
  Message: true,
  Move: (
    actionResponse: MoveActionResponse,
    map: MapData,
    _: MapData,
    vision: VisionT,
  ): MoveActionResponse | HiddenMoveActionResponse | null => {
    const { completed, from, fuel, path: initialPath, to } = actionResponse;
    const unit = map.units.get(from);
    if (!unit) {
      return null;
    }

    const isVisible = (vector: Vector) => vision.isVisible(map, vector);
    const isHidden = (vector: Vector) => !vision.isVisible(map, vector);
    const dropHidden = (path: Array<Vector>): Array<Vector> => {
      let next = path;
      path = [vec(0, 0), ...path];
      while (next.length > 0 && isHidden(next[0])) {
        next = next.slice(1);
        path = path.slice(1);
      }
      return path;
    };

    let path: Array<Vector> = [
      from,
      ...(initialPath ||
        getMovementPath(map, to, moveable(map, unit, from), null).path),
    ];
    if (path.length <= 1 || path.every(isHidden)) {
      return null;
    }
    if (path.every(isVisible)) {
      return actionResponse;
    }

    // Drop all parts of the path at the beginning that are hidden except the first one.
    // Then, drop all parts of the path at the end that are hidden except the last one.
    if (isHidden(path[0])) {
      path = dropHidden(path);
    }

    if (path.length > 0 && isHidden(path.at(-1)!)) {
      path = dropHidden(path.reverse()).reverse();
    }

    return path.length > 1
      ? {
          ...(isHidden(path[0]) || completed ? { unit } : null),
          completed,
          fuel,
          path,
          type: 'HiddenMove',
        }
      : null;
  },
  MoveUnit: {
    Source: true,
  },
  OptionalObjective: true,
  PreviousTurnGameOver: true,
  ReceiveReward: true,
  Rescue: {
    Source: (
      { from }: RescueActionResponse,
      _: MapData,
      activeMap: MapData,
    ): CompleteUnitActionResponse => completeUnit({ from: from! }),
    Target: ({ player, to, type }): RescueActionResponse => ({
      player,
      to,
      type,
    }),
  },
  Sabotage: {
    Source: (
      { from }: SabotageActionResponse,
      _: MapData,
      activeMap: MapData,
    ): CompleteUnitActionResponse => completeUnit({ from: from! }),
    Target: ({ to, type }): SabotageActionResponse => ({
      to,
      type,
    }),
  },
  SecretDiscovered: true,
  SetViewer: true,
  Spawn: (
    actionResponse: SpawnActionResponse,
    map: MapData,
    activeMap: MapData,
    vision: VisionT,
  ): SpawnActionResponse | null => {
    const units = actionResponse.units
      .filter((_, vector) => vision.isVisible(activeMap, vector))
      .sortBy((unit) =>
        activeMap.matchesTeam(unit, vision.currentViewer) ? -1 : 1,
      );
    return units.size ? { ...actionResponse, units } : null;
  },
  Start: true,
  Supply: {
    Hidden: supplyActionWithDefault(() => null),
    Source: supplyActionWithDefault(completeUnit),
  },
  ToggleLightning: (
    { from, to, type }: ToggleLightningActionResponse,
    map: MapData,
    _: MapData,
    vision: VisionT,
  ): ToggleLightningActionResponse =>
    from && vision.isVisible(map, from)
      ? { from, to, type }
      : {
          player: map.buildings.get(from!)!.player,
          to,
          type,
        },
  Unfold: { Source: true },
};

const processVisibleAction = (
  previousMap: MapData,
  activeMap: MapData,
  vision: VisionT,
  actionResponse: ActionResponse,
): ActionResponse | ActionResponses | null => {
  const modifier = VisibleActionModifiers[actionResponse.type];
  if (modifier === true) {
    return actionResponse;
  }

  if (modifier === false) {
    return null;
  }

  if (typeof modifier === 'function') {
    return modifier(actionResponse as never, previousMap, activeMap, vision);
  }

  const from = 'from' in actionResponse ? actionResponse.from : null;
  const to = 'to' in actionResponse ? actionResponse.to : null;
  const sourceIsVisible = from && vision.isVisible(previousMap, from);
  const targetIsVisible = to && vision.isVisible(previousMap, to);
  const response = actionResponse as never;
  if (sourceIsVisible && targetIsVisible && modifier.Both) {
    return modifier.Both === true
      ? actionResponse
      : modifier.Both(response, previousMap, activeMap, vision);
  }

  if (targetIsVisible && modifier.Target) {
    return modifier.Target === true
      ? actionResponse
      : modifier.Target(response, previousMap, activeMap, vision);
  }

  if (sourceIsVisible && modifier.Source) {
    return modifier.Source === true
      ? actionResponse
      : modifier.Source(response, previousMap, activeMap, vision);
  }

  if (!sourceIsVisible && !targetIsVisible && modifier.Hidden) {
    return modifier.Hidden === true
      ? actionResponse
      : modifier.Hidden(response, previousMap, activeMap, vision);
  }

  return null;
};

type ActionResponseWithMapData = [ActionResponse, MapData?, MapData?];

export default function computeVisibleActions(
  previousMap: MapData,
  vision: VisionT,
  gameState: GameState,
): ReadonlyArray<ActionResponseWithMapData> {
  const responses: Array<ActionResponseWithMapData> = [];
  for (const [actionResponse, activeMap] of gameState) {
    const hasFog = activeMap.config.fog;
    if (
      hasFog &&
      (activeMap.isOpponent(
        vision.currentViewer,
        activeMap.getCurrentPlayer(),
      ) ||
        actionResponse.type === 'Spawn')
    ) {
      const newActionResponse = processVisibleAction(
        previousMap,
        activeMap,
        vision,
        actionResponse,
      );
      if (newActionResponse) {
        const items: Array<ActionResponseWithMapData> = Array.isArray(
          newActionResponse,
        )
          ? newActionResponse.map((actionResponse) => [actionResponse])
          : [[newActionResponse as ActionResponse]];

        const lastItem = items.at(-1);
        if (lastItem) {
          items[items.length - 1] = [lastItem[0], previousMap, activeMap];
        }
        responses.push(...items);
      }
    } else {
      responses.push(
        hasFog ? [actionResponse, previousMap, activeMap] : [actionResponse],
      );
    }
    previousMap = activeMap;
  }
  return responses.filter(([actionResponse], index) => {
    const nextActionResponse = responses[index + 1]?.[0];
    return !(
      actionResponse.type === 'HiddenFundAdjustment' &&
      (nextActionResponse?.type === 'HiddenFundAdjustment' ||
        nextActionResponse?.type === 'EndTurn')
    );
  });
}

export function computeVisibleEndTurnActionResponse(
  actionResponse: EndTurnActionResponse,
  map: MapData,
  activeMap: MapData,
  vision: VisionT,
): EndTurnActionResponse {
  if (!map.config.fog) {
    return actionResponse;
  }

  const units = getAllUnitsToRefill(
    map,
    vision,
    map.getPlayer(actionResponse.next.player),
    'hidden',
  );

  return units.size
    ? {
        ...actionResponse,
        supply: [...units.keys()],
      }
    : actionResponse;
}
