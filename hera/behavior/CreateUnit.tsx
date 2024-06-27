import { CreateUnitAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import { UnitInfo } from '@deities/athena/info/Unit.tsx';
import { getDeterministicUnitName } from '@deities/athena/info/UnitNames.tsx';
import getBuildableUnits from '@deities/athena/lib/getBuildableUnits.tsx';
import getDeployableVectors from '@deities/athena/lib/getDeployableVectors.tsx';
import getLeaders from '@deities/athena/lib/getLeaders.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import getColor from '@deities/ui/getColor.tsx';
import { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Info from '@deities/ui/icons/Info.tsx';
import Magic from '@deities/ui/icons/Magic.tsx';
import { css } from '@emotion/css';
import More from '@iconify-icons/pixelarticons/more-horizontal.js';
import { fbt } from 'fbt';
import { MouseEvent, useState } from 'react';
import addFlashAnimation from '../lib/addFlashAnimation.tsx';
import toTransformOrigin, {
  ClientCoordinates,
} from '../lib/toTransformOrigin.tsx';
import { RadiusType } from '../Radius.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import ActionWheel, {
  ActionWheelFunds,
  LargeActionButton,
} from '../ui/ActionWheel.tsx';
import UnitTile from '../Unit.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import createUnitAction from './createUnit/createUnitAction.tsx';

const MAX_UNITS = 8;

export default class CreateUnit {
  public readonly type = 'createUnit' as const;
  public readonly navigate;

  constructor(private unitToBuild: UnitInfo | null = null) {
    this.navigate = !unitToBuild;
  }

  activate(state: State): StateLike | null {
    const { animations, map, selectedBuilding, selectedPosition } = state;
    if (
      selectedBuilding &&
      selectedPosition &&
      !getBuildableUnits(map, selectedBuilding, selectedPosition).length
    ) {
      return {
        animations: addFlashAnimation(animations, {
          children: fbt('No buildable units!', 'Error message'),
          color: 'error',
          position: selectedPosition,
        }),
        ...resetBehavior(),
      };
    }
    return null;
  }

  enter(vector: Vector, state: State): StateLike | null {
    const { map, radius, selectedPosition } = state;
    return radius
      ? {
          radius: {
            ...radius,
            path: radius.fields.has(vector)
              ? vector.equals(selectedPosition)
                ? [vector]
                : getMovementPath(map, vector, radius.fields, null).path
              : null,
          },
        }
      : null;
  }

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    const { unitToBuild } = this;
    const { radius, selectedPosition } = state;
    if (
      selectedPosition &&
      unitToBuild != null &&
      radius &&
      radius.fields.get(vector)
    ) {
      actions.requestFrame(async () => {
        const actionResponse = actions.optimisticAction(
          state,
          CreateUnitAction(selectedPosition, unitToBuild.id, vector),
        );
        if (actionResponse.type === 'CreateUnit') {
          actions.update(await createUnitAction(actions, actionResponse));
        }
      });
      return null;
    }
    return selectFallback(vector, state, actions);
  }

  component = ({ actions, state }: StateWithActions) => {
    const { showGameInfo, update } = actions;
    const [cursor, setCursor] = useState(0);

    const {
      animationConfig,
      behavior,
      currentViewer,
      map,
      navigationDirection,
      radius,
      selectedBuilding,
      selectedPosition,
      tileSize,
      zIndex,
    } = state;
    if (
      behavior?.type === 'createUnit' &&
      currentViewer &&
      !radius &&
      selectedBuilding &&
      selectedPosition
    ) {
      const currentPlayer = map.getCurrentPlayer();
      const funds = currentPlayer.funds;
      const units = sortBy(
        getBuildableUnits(map, selectedBuilding, selectedPosition),
        (unit) => unit.getCostFor(currentPlayer),
      );
      const { hasLeader } = getLeaders(map, selectedBuilding.player);
      const color = getColor(selectedBuilding.player);
      const unitsToDisplay =
        units.length > MAX_UNITS
          ? units.slice(cursor, cursor + MAX_UNITS - 1)
          : units;
      const entityCount =
        unitsToDisplay.length + (unitsToDisplay.length < units.length ? 1 : 0);
      let position = 0;
      return (
        <ActionWheel
          actions={actions}
          animationConfig={animationConfig}
          color={map.getCurrentPlayer().id}
          entityCount={entityCount}
          position={selectedPosition}
          tileSize={tileSize}
          zIndex={zIndex}
        >
          <ActionWheelFunds funds={funds} />
          {unitsToDisplay.map((unit) => {
            const cost = unit.getCostFor(currentPlayer);
            const isDisabled =
              funds < cost ||
              !getDeployableVectors(
                map,
                unit,
                selectedPosition,
                currentPlayer.id,
              ).length;
            const entity = unit.create(selectedBuilding.player, {
              name: getDeterministicUnitName(
                map,
                selectedPosition,
                selectedBuilding.player,
                unit,
                0,
                hasLeader(selectedBuilding.player, unit.id),
              ),
            });
            const create = () => {
              if (!isDisabled && selectedPosition) {
                const fields = new Map(
                  getDeployableVectors(
                    map,
                    unit,
                    selectedPosition,
                    currentPlayer.id,
                  ).map((vector) => [
                    vector,
                    RadiusItem(vector, 0, selectedPosition),
                  ]),
                );
                const first = getFirst(fields.keys());
                update({
                  behavior: new CreateUnit(unit),
                  navigationDirection: null,
                  position: first,
                  radius: {
                    fields,
                    path: first ? [first] : null,
                    type: RadiusType.Move,
                  },
                });
              }
            };

            const showInfo = (
              event:
                | MouseEvent
                | LongPressReactEvents<Element>
                | ClientCoordinates,
            ) =>
              showGameInfo({
                create: isDisabled ? undefined : create,
                origin: toTransformOrigin(event),
                type: 'map-info',
                unit: entity,
                vector: selectedPosition,
              });

            return (
              <LargeActionButton
                detail={String(cost)}
                disabled={isDisabled}
                entityCount={entityCount}
                icon={(highlight) => (
                  <>
                    <UnitTile
                      animationConfig={animationConfig}
                      biome={map.config.biome}
                      firstPlayerID={map.getFirstPlayerID()}
                      highlightStyle={
                        highlight
                          ? entity.canMove()
                            ? 'move'
                            : 'idle'
                          : undefined
                      }
                      size={tileSize}
                      tile={Plain}
                      unit={isDisabled ? entity.complete() : entity}
                    />
                    {entity.isLeader() && (
                      <Icon
                        className={leaderIconStyle}
                        icon={Magic}
                        style={{ color }}
                      />
                    )}
                    <Icon
                      className={infoIconStyle}
                      icon={Info}
                      onClick={(event) => {
                        event.stopPropagation();
                        showInfo(event);
                      }}
                    />
                  </>
                )}
                key={unit.id}
                navigationDirection={navigationDirection}
                onClick={create}
                onLongPress={showInfo}
                position={position++}
              />
            );
          })}
          {unitsToDisplay.length < units.length && (
            <LargeActionButton
              detail={
                cursor === 0
                  ? fbt('More', 'Button to show more menu items')
                  : fbt('Back', 'Button to show previous menu items')
              }
              entityCount={entityCount}
              icon={(highlight, props) => <Icon icon={More} {...props} />}
              navigationDirection={navigationDirection}
              onClick={() =>
                setCursor((cursor) =>
                  cursor === 0 ? cursor + MAX_UNITS - 1 : 0,
                )
              }
              position={position}
            />
          )}
        </ActionWheel>
      );
    }
    return null;
  };
}

const leaderIconStyle = css`
  position: absolute;
  right: 1px;
  top: 1px;
`;

const infoIconStyle = css`
  color: ${applyVar('text-color-light')};
  bottom: 1px;
  position: absolute;
  right: 0;
`;
