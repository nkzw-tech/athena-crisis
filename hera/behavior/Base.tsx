import { Behavior } from '@deities/athena/info/Building.tsx';
import { Pioneer } from '@deities/athena/info/Unit.tsx';
import getAttackableEntitiesInRange from '@deities/athena/lib/getAttackableEntitiesInRange.tsx';
import Building from '@deities/athena/map/Building.tsx';
import { AnimationConfig } from '@deities/athena/map/Configuration.tsx';
import Entity, { isBuilding, isUnit } from '@deities/athena/map/Entity.tsx';
import isPlayable from '@deities/athena/map/isPlayable.tsx';
import Unit from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { attackable, moveable } from '@deities/athena/Radius.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, ClearTimerFunction, State, StateLike, StateWithActions } from '../Types.tsx';
import AbstractSelectBehavior, { BaseSelectComponent } from './AbstractSelectBehavior.tsx';
import { resetBehavior } from './Behavior.tsx';
import BuySkills from './BuySkills.tsx';
import CreateUnit from './CreateUnit.tsx';
import Menu from './Menu.tsx';
import Move from './Move.tsx';
import Radar from './Radar.tsx';
import TeleportIndicator from './swap/TeleportIndicator.tsx';

export default class Base extends AbstractSelectBehavior {
  public readonly type = 'base' as const;
  private timer: number | null = null;

  deactivate(actions: Actions | null): StateLike | null {
    if (actions) {
      this.clearTimers(actions.clearTimer);
    }

    return {
      highlightedPositions: null,
    };
  }

  enter(vector: Vector, state: State, actions: Actions): StateLike | null {
    this.clearTimers(actions.clearTimer);

    const { highlightedPositions, map, messages, radius } = state;
    if (map.units.has(vector) || messages.has(vector)) {
      this.showInfo(vector, state, actions);
    }

    let newState: StateLike | null = radius?.type === RadiusType.Attack ? { radius: null } : null;

    if (highlightedPositions) {
      newState = { ...newState, highlightedPositions: null };
    }

    return newState;
  }

  clearTimers(clearTimer: ClearTimerFunction) {
    if (this.timer) {
      clearTimer(this.timer);
      this.timer = null;
    }
  }

  private async showInfo(vector: Vector, state: State, { scheduleTimer, update }: Actions) {
    const { map, messages, selectedPosition, vision } = state;
    const unit = map.units.get(vector);
    const message = messages.get(vector);
    const info = unit?.info;
    if (
      (message || (unit && unit.player !== 0)) &&
      !selectedPosition &&
      vision.isVisible(map, vector)
    ) {
      const showAttackRadius = unit && info?.hasAttack();
      this.timer = await scheduleTimer(
        () =>
          update((state) => ({
            highlightedPositions: [vector],
            ...(showAttackRadius && !state.radius
              ? {
                  radius: {
                    dim: showAttackRadius && !unit.canAttack(map.getPlayer(unit)),
                    fields: attackable(map, unit.recover(), vector, 'cost'),
                    path: null,
                    type: RadiusType.Attack,
                  },
                }
              : null),
          })),
        AnimationConfig.AnimationDuration * 2,
      );
    }
  }

  onCancel(state: State) {
    const { selectedBuilding, selectedUnit } = state;
    return selectedBuilding && selectedUnit ? resetBehavior() : null;
  }

  protected onSelect(vector: Vector, state: State, entity: Entity): StateLike | null {
    const { currentViewer, map, vision } = state;
    if (isUnit(entity)) {
      const entityIsPlayable = isPlayable(map, currentViewer, entity);
      const player = map.getPlayer(entity);
      const fields =
        !entity.hasMoved() && !entity.isUnfolded() && (!entity.isCapturing() || !entityIsPlayable)
          ? moveable(vision.apply(map), entity, vector)
          : null;
      if (
        fields?.size ||
        !entityIsPlayable ||
        (entity.isUnfolded() && getAttackableEntitiesInRange(map, vector, vision).size)
      ) {
        const additionalFields =
          !entityIsPlayable && entity.canAttack(player) && entity.info.hasAttack()
            ? attackable(map, entity, vector, 'cover')
            : null;

        const isLongRange = entity.info.isLongRange() && !entity.info.canAct(player);
        const additionalRadius = additionalFields?.size
          ? {
              fields: new Map(
                [...additionalFields].filter(
                  isLongRange ? Boolean : ([vector]: [Vector, unknown]) => !fields?.has(vector),
                ),
              ),
              path: null,
              type: RadiusType.Attack,
            }
          : null;

        return {
          additionalRadius,
          behavior: new Move(),
          position: vector,
          radius: {
            fields: new Map(fields),
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
      const hasSellSkillsBehavior = entity.info.hasBehavior(Behavior.SellSkills);
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
          highlightedPositions: null,
          position: vector,
          radius: null,
          selectedBuilding: entity,
          selectedPosition: vector,
          selectedUnit: null,
        };
      }
    }

    return null;
  }

  protected canSelectCandidates(state: State, unit?: Unit | null, building?: Building | null) {
    const { currentViewer, map } = state;
    if (
      unit &&
      building &&
      isPlayable(map, currentViewer) &&
      map.isOpponent(map.getCurrentPlayer(), unit)
    ) {
      building = null;
    }

    if (unit && (unit.isCompleted() || unit.player === 0)) {
      unit = null;
    }

    if (building && (building.isCompleted() || !isPlayable(map, currentViewer, building))) {
      building = null;
    }
    return { building: building || null, unit: unit || null };
  }

  protected override getState = (
    vector: Vector,
    state: State,
    unit: Unit | null,
    building: Building | null,
    actions: Actions,
  ): StateLike | null => {
    let newState = super.getState(vector, state, unit, building, actions);
    if (newState?.selectedBuilding && newState.selectedPosition && newState.selectedUnit) {
      this.clearTimers(actions.clearTimer);
      if (state.radius?.type === RadiusType.Attack) {
        newState = { ...newState, radius: null };
      }
    }
    return newState;
  };

  override component = ({ actions, state }: StateWithActions) => {
    return (
      <>
        <BaseSelectComponent actions={actions} getState={this.getState} state={state} />
        <TeleportIndicator
          state={state}
          unit={Pioneer.create(state.map.currentPlayer)}
          vector={state.position}
        />
      </>
    );
  };
}
