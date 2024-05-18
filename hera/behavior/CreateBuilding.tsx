import { filterBuildings } from '@deities/athena/info/Building.tsx';
import canBuild from '@deities/athena/lib/canBuild.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import type { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Info from '@deities/ui/icons/Info.tsx';
import { css } from '@emotion/css';
import BuildingTile from '../Building.tsx';
import type { ClientCoordinates } from '../lib/toTransformOrigin.tsx';
import toTransformOrigin from '../lib/toTransformOrigin.tsx';
import type { StateWithActions } from '../Types.tsx';
import ActionWheel, {
  ActionWheelFunds,
  LargeActionButton,
} from '../ui/ActionWheel.tsx';
import { selectFallback } from './Behavior.tsx';
import createBuildingAction from './createBuilding/createBuildingAction.tsx';

export default class CreateBuilding {
  public readonly type = 'createBuilding' as const;
  public readonly navigate = true;

  select = selectFallback;

  component({ actions, state }: StateWithActions) {
    const { showGameInfo } = actions;
    const {
      animationConfig,
      currentViewer,
      map,
      navigationDirection,
      selectedPosition,
      selectedUnit,
      tileSize,
      zIndex,
    } = state;
    if (currentViewer && selectedPosition && selectedUnit) {
      const funds = map.getCurrentPlayer().funds;
      const buildings = sortBy(
        filterBuildings(
          (building) =>
            building.configuration.cost < Number.POSITIVE_INFINITY &&
            canBuild(map, building, map.getCurrentPlayer(), selectedPosition),
        ),
        ({ configuration: { cost } }) => cost,
      );
      let position = 0;
      return (
        <ActionWheel
          actions={actions}
          animationConfig={animationConfig}
          color={map.getCurrentPlayer().id}
          entityCount={buildings.length}
          position={selectedPosition}
          tileSize={tileSize}
          zIndex={zIndex}
        >
          <ActionWheelFunds funds={funds} />
          {buildings.map((building, id) => {
            const isDisabled = funds < building.configuration.cost;
            const entity = building.create(currentViewer);
            const create = () => {
              const { selectedPosition, selectedUnit } = state;
              if (!isDisabled && selectedPosition && selectedUnit) {
                actions.update(
                  createBuildingAction(
                    actions,
                    selectedPosition,
                    building,
                    state,
                  ),
                );
              }
            };

            const showInfo = (
              event:
                | MouseEvent
                | LongPressReactEvents<Element>
                | ClientCoordinates,
            ) =>
              showGameInfo({
                biome: map.config.biome,
                building: entity,
                create: isDisabled ? undefined : create,
                origin: toTransformOrigin(event),
                type: 'map-info',
                vector: selectedPosition,
              });

            return (
              <LargeActionButton
                detail={String(building.configuration.cost)}
                disabled={isDisabled}
                entityCount={buildings.length}
                icon={(highlight) => (
                  <>
                    <BuildingTile
                      biome={map.config.biome}
                      building={isDisabled ? entity.complete() : entity}
                      highlight={highlight}
                      position={new SpriteVector(1, 2)}
                      size={tileSize}
                    />
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
                key={id}
                navigationDirection={navigationDirection}
                onClick={create}
                onLongPress={showInfo}
                position={position++}
              />
            );
          })}
        </ActionWheel>
      );
    }
    return null;
  }
}

const infoIconStyle = css`
  color: ${applyVar('text-color-light')};
  bottom: 1px;
  position: absolute;
  right: 0;
`;
