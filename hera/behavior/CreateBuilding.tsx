import { filterBuildings } from '@deities/athena/info/Building.tsx';
import canBuild from '@deities/athena/lib/canBuild.tsx';
import hasUnitsOrProductionBuildings from '@deities/athena/lib/hasUnitsOrProductionBuildings.tsx';
import SpriteVector from '@deities/athena/map/SpriteVector.tsx';
import sortBy from '@deities/hephaestus/sortBy.tsx';
import { applyVar } from '@deities/ui/cssVar.tsx';
import { LongPressReactEvents } from '@deities/ui/hooks/usePress.tsx';
import Icon from '@deities/ui/Icon.tsx';
import Info from '@deities/ui/icons/Info.tsx';
import { css } from '@emotion/css';
import BuildingTile from '../Building.tsx';
import toTransformOrigin, {
  ClientCoordinates,
} from '../lib/toTransformOrigin.tsx';
import { StateWithActions } from '../Types.tsx';
import ActionWheel, {
  ActionWheelFunds,
  LargeActionButton,
} from '../ui/ActionWheel.tsx';
import FlashFlyout from '../ui/FlashFlyout.tsx';
import { FlyoutItem } from '../ui/Flyout.tsx';
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
      map,
      navigationDirection,
      selectedPosition,
      selectedUnit,
      tileSize,
      zIndex,
    } = state;
    if (selectedPosition && selectedUnit) {
      const player = map.getCurrentPlayer();
      const allowAnyBuilding = hasUnitsOrProductionBuildings(map, player);
      const funds = player.funds;
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
            const isAllowed = allowAnyBuilding || building.canBuildUnits();
            const hasFunds = funds >= building.configuration.cost;
            const isDisabled = !hasFunds;
            const entity = building.create(player);
            const create = () => {
              const { selectedPosition, selectedUnit } = state;
              if (
                isAllowed &&
                !isDisabled &&
                selectedPosition &&
                selectedUnit
              ) {
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
                      building={
                        isDisabled || !isAllowed ? entity.complete() : entity
                      }
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
                    {highlight && hasFunds && !isAllowed && (
                      <FlashFlyout
                        align="top-lower"
                        animationConfig={animationConfig}
                        items={[
                          <FlyoutItem color="red" key={0}>
                            <fbt desc="Flyout text for when a building cannot be created">
                              Can&apos;t build yet!
                            </fbt>
                          </FlyoutItem>,
                        ]}
                        key="info"
                        position={new SpriteVector(1, -0.5)}
                        tileSize={tileSize}
                        width={0}
                        zIndex={zIndex + 1}
                      />
                    )}
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
