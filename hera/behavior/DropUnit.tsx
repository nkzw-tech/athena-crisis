import { DropUnitAction } from '@deities/apollo/action-mutators/ActionMutators.tsx';
import applyActionResponse from '@deities/apollo/actions/applyActionResponse.tsx';
import { Plain } from '@deities/athena/info/Tile.tsx';
import canDeploy from '@deities/athena/lib/canDeploy.tsx';
import getMovementPath from '@deities/athena/lib/getMovementPath.tsx';
import { TransportedUnit } from '@deities/athena/map/Unit.tsx';
import Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import getFirst from '@deities/hephaestus/getFirst.tsx';
import useInput from '@deities/ui/controls/useInput.tsx';
import getColor from '@deities/ui/getColor.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Magic from '@deities/ui/icons/Magic.tsx';
import { css } from '@emotion/css';
import { useCallback, useState } from 'react';
import addFlashAnimation from '../lib/addFlashAnimation.tsx';
import { RadiusType } from '../Radius.tsx';
import Tick from '../Tick.tsx';
import { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import Flyout, { FlyoutItemWithHighlight } from '../ui/Flyout.tsx';
import UnitTile from '../Unit.tsx';
import { resetBehavior, selectFallback } from './Behavior.tsx';
import dropUnitAction from './drop/dropUnitAction.tsx';

const getRadius = (
  transportedUnit: TransportedUnit,
  unitIndex: number,
  state: State,
): StateLike | null => {
  const { map, selectedPosition, selectedUnit } = state;
  if (!selectedPosition || !selectedUnit) {
    return null;
  }

  const fields = new Map(
    selectedPosition
      .adjacent()
      .filter(
        (vector) =>
          canDeploy(map, transportedUnit.info, vector, true) &&
          selectedUnit.info.canDropFrom(map.getTileInfo(selectedPosition)),
      )
      .map((vector) => [vector, RadiusItem(vector, 0, selectedPosition)]),
  );

  const first = getFirst(fields.keys());
  return !fields.size
    ? {
        ...resetBehavior(),
        animations: addFlashAnimation(state.animations, {
          children: 'No space!',
          color: 'error',
          position: selectedPosition,
        }),
      }
    : {
        behavior: new DropUnit(unitIndex),
        position: first,
        radius: {
          fields,
          path: first ? [first] : null,
          type: RadiusType.Move,
        },
      };
};

export default class DropUnit {
  public readonly type = 'dropUnit' as const;

  constructor(private dropUnit: number | null = null) {}

  enter(vector: Vector, state: State): StateLike | null {
    const { map, radius } = state;
    return radius
      ? {
          radius: {
            ...radius,
            path: radius.fields.has(vector)
              ? getMovementPath(map, vector, radius.fields, null).path
              : null,
          },
        }
      : null;
  }

  select(vector: Vector, state: State, actions: Actions) {
    const { radius, selectedPosition } = state;
    if (
      selectedPosition &&
      this.dropUnit != null &&
      radius &&
      radius.fields.get(vector)
    ) {
      const actionResponse = actions.optimisticAction(
        state,
        DropUnitAction(selectedPosition, this.dropUnit, vector),
      );
      if (actionResponse.type === 'DropUnit') {
        return dropUnitAction(
          applyActionResponse(state.map, state.vision, actionResponse),
          actionResponse,
          state,
          (state) => state,
        );
      }
    }
    return selectFallback(vector, state, actions);
  }

  component = ({ actions, state }: StateWithActions) => {
    const {
      animationConfig,
      map,
      position,
      radius,
      selectedPosition,
      selectedUnit,
      tileSize,
      zIndex,
    } = state;

    const width = map.size.width;
    const [currentIndex, setCurrentIndex] = useState(0);
    const hasUnit = this.dropUnit != null;

    useInput(
      'navigate',
      useCallback(
        (event) => {
          if (hasUnit) {
            return;
          }

          event.preventDefault();
          const newIndex = currentIndex + event.detail.y;
          const unit = selectedUnit?.transports?.[newIndex];
          if (unit) {
            setCurrentIndex(newIndex);
          }
        },
        [currentIndex, hasUnit, selectedUnit?.transports],
      ),
      'menu',
    );

    useInput(
      'accept',
      useCallback(
        (event) => {
          if (hasUnit) {
            return;
          }

          event.preventDefault();
          const unit = selectedUnit?.transports?.[currentIndex];
          if (unit) {
            actions.update(getRadius(unit, currentIndex, state));
          }
        },
        [actions, currentIndex, hasUnit, selectedUnit?.transports, state],
      ),
      'menu',
    );

    const drop = useCallback(() => {
      if (hasUnit && position && radius?.fields.has(position)) {
        actions.update(this.select(position, state, actions));
      }
    }, [actions, hasUnit, position, radius?.fields, state]);

    useInput('tertiary', drop, 'menu');
    useInput('gamepad:tertiary', drop, 'menu');

    if (!radius && selectedPosition && selectedUnit?.transports) {
      const { transports } = selectedUnit;
      return (
        <Tick animationConfig={animationConfig}>
          <Flyout
            items={transports.map((unit, index) => {
              const deployedUnit = unit.deploy();
              return (
                <FlyoutItemWithHighlight
                  highlight={currentIndex === index}
                  icon={(highlight) => (
                    <div style={{ position: 'relative' }}>
                      <UnitTile
                        animationConfig={animationConfig}
                        biome={map.config.biome}
                        firstPlayerID={map.getFirstPlayerID()}
                        highlightStyle={highlight ? 'idle' : undefined}
                        size={tileSize}
                        tile={Plain}
                        unit={deployedUnit}
                      />
                      {unit.isLeader() && (
                        <Icon
                          className={leaderIconStyle}
                          icon={Magic}
                          style={{ color: getColor(unit.player) }}
                        />
                      )}
                    </div>
                  )}
                  key={index}
                  onClick={() => actions.update(getRadius(unit, index, state))}
                >
                  {deployedUnit.info.name}
                </FlyoutItemWithHighlight>
              );
            })}
            position={selectedPosition}
            resetPosition={actions.resetPosition}
            tileSize={tileSize}
            width={width}
            zIndex={zIndex}
          />
        </Tick>
      );
    }
    return null;
  };
}

const leaderIconStyle = css`
  position: absolute;
  right: 0;
  top: 1px;
`;
