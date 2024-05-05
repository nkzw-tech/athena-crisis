import { Behavior } from '@deities/athena/info/Building.tsx';
import getAttackableEntitiesInRange from '@deities/athena/lib/getAttackableEntitiesInRange.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Entity, { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import isPlayable from '@deities/athena/map/isPlayable.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { attackable, moveable } from '@deities/athena/Radius.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike } from '../Types.tsx';
import AbstractSelectBehavior from './AbstractSelectBehavior.tsx';
import BuySkills from './BuySkills.tsx';
import CreateUnit from './CreateUnit.tsx';
import Menu from './Menu.tsx';
import Move from './Move.tsx';
import Radar from './Radar.tsx';

export default class Base extends AbstractSelectBehavior {
  public readonly type = 'base' as const;
  private infoTimer: number | null = null;

  deactivate(): StateLike | null {
    this.clearTimers();
    return {
      namedPositions: null,
    };
  }

  enter(vector: Vector, state: State, actions: Actions): StateLike | null {
    this.clearTimers();

    const { map, namedPositions, radius } = state;
    if (map.units.get(vector)) {
      this.showInfo(vector, state, actions);
    }

    let newState: StateLike | null =
      radius?.type === RadiusType.Attack ? { radius: null } : null;

    if (namedPositions) {
      newState = { ...newState, namedPositions: null };
    }

    return newState;
  }

  clearTimers() {
    if (this.infoTimer) {
      clearTimeout(this.infoTimer);
    }
  }

  private async showInfo(vector: Vector, state: State, actions: Actions) {
    const { map, selectedPosition, vision } = state;
    const unit = map.units.get(vector);
    const info = unit?.info;
    if (unit && !selectedPosition && vision.isVisible(map, vector)) {
      const showAttackRadius = !unit.isCompleted() && info?.hasAttack();
      this.infoTimer = await actions.scheduleTimer(
        (state: State): StateLike | null => {
          return {
            namedPositions: [vector],
            ...(showAttackRadius && !state.radius
              ? {
                  radius: {
                    dim:
                      showAttackRadius && !unit.canAttack(map.getPlayer(unit)),
                    fields: attackable(map, unit, vector, 'cost'),
                    path: null,
                    type: RadiusType.Attack,
                  },
                }
              : null),
          };
        },
        AnimationConfig.AnimationDuration * 2.5,
      );
    }
  }

  protected onSelect(
    vector: Vector,
    state: State,
    entity: Entity,
  ): StateLike | null {
    const { currentViewer, map, vision } = state;
    if (isUnit(entity)) {
      const entityIsPlayable = isPlayable(map, currentViewer, entity);
      const player = map.getPlayer(entity);
      const fields =
        !entity.hasMoved() &&
        !entity.isUnfolded() &&
        (!entity.isCapturing() || !entityIsPlayable)
          ? moveable(vision.apply(map), entity, vector)
          : null;
      if (
        fields?.size ||
        !entityIsPlayable ||
        (entity.isUnfolded() &&
          getAttackableEntitiesInRange(map, vector, vision).size)
      ) {
        const additionalFields =
          !entityIsPlayable &&
          entity.canAttack(player) &&
          entity.info.hasAttack()
            ? attackable(map, entity, vector, 'cover')
            : null;

        const isLongRange =
          entity.info.isLongRange() && !entity.info.canAct(player);
        const attackFilter = isLongRange
          ? Boolean
          : ([vector]: [Vector, unknown]) => !fields?.has(vector);
        const moveFilter = isLongRange
          ? ([vector]: [Vector, unknown]) => !additionalFields?.has(vector)
          : Boolean;

        const additionalRadius = additionalFields?.size
          ? {
              fields: new Map([...additionalFields].filter(attackFilter)),
              path: null,
              type: RadiusType.Attack,
            }
          : null;

        return {
          additionalRadius,
          behavior: new Move(),
          position: vector,
          radius: {
            fields: new Map(
              fields ? [...fields].filter(moveFilter) : undefined,
            ),
            path: null,
            type: RadiusType.Move,
          },
          selectedBuilding: null,
          selectedPosition: vector,
          selectedUnit: entity,
          showCursor: true,
        };
      } else if (entityIsPlayable) {
        return {
          additionalRadius: null,
          behavior: new Menu(),
          position: vector,
          radius: null,
          selectedBuilding: null,
          selectedPosition: vector,
          selectedUnit: entity,
          showCursor: true,
        };
      }
    }

    if (isBuilding(entity)) {
      const hasRadarBehavior = entity.info.hasBehavior(Behavior.Radar);
      const hasSellSkillsBehavior = entity.info.hasBehavior(
        Behavior.SellSkills,
      );
      if (
        hasRadarBehavior ||
        hasSellSkillsBehavior ||
        entity.canBuildUnits(map.getCurrentPlayer())
      ) {
        return {
          behavior: hasRadarBehavior
            ? new Radar()
            : hasSellSkillsBehavior
              ? new BuySkills()
              : new CreateUnit(),
          position: vector,
          selectedBuilding: entity,
          selectedPosition: vector,
          selectedUnit: null,
        };
      }
    }

    return null;
  }

  protected canSelectCandidates(
    state: State,
    unit?: Unit | null,
    building?: Building | null,
  ) {
    const { currentViewer, map } = state;
    if (
      unit &&
      building &&
      isPlayable(map, currentViewer) &&
      map.isOpponent(map.getCurrentPlayer(), unit)
    ) {
      building = null;
    }

    if (unit && unit.isCompleted()) {
      unit = null;
    }

    if (
      building &&
      (building.isCompleted() || !isPlayable(map, currentViewer, building))
    ) {
      building = null;
    }
    return { building: building || null, unit: unit || null };
  }

  protected override getState(
    vector: Vector,
    state: State,
    unit: Unit | null,
    building: Building | null,
  ): StateLike | null {
    let newState = super.getState(vector, state, unit, building);
    if (
      newState?.selectedBuilding &&
      newState.selectedPosition &&
      newState.selectedUnit
    ) {
      this.clearTimers();
      if (state.radius?.type === RadiusType.Attack) {
        newState = { ...newState, radius: null };
      }
    }
    return newState;
  }
}
