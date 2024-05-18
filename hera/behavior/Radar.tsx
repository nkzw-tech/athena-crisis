import { Lightning } from '@deities/athena/info/Tile.tsx';
import canPlaceLightning from '@deities/athena/lib/canPlaceLightning.tsx';
import { Charge } from '@deities/athena/map/Configuration.tsx';
import type Vector from '@deities/athena/map/Vector.tsx';
import { RadiusItem } from '@deities/athena/Radius.tsx';
import Icon from '@deities/ui/Icon.tsx';
import ZapOn from '@deities/ui/icons/ZapOn.tsx';
import Zap from '@iconify-icons/pixelarticons/zap.js';
import { fbt } from 'fbt';
import { RadiusType } from '../Radius.tsx';
import type { Actions, State, StateLike, StateWithActions } from '../Types.tsx';
import ActionWheel, {
  ActionWheelCharge,
  LargeActionButton,
} from '../ui/ActionWheel.tsx';
import { selectFallback } from './Behavior.tsx';
import toggleLightningAction from './radar/toggleLightningAction.tsx';

export default class Radar {
  public readonly type = 'radar' as const;
  public readonly navigate;

  constructor(private readonly radarType?: 'on' | 'off') {
    this.navigate = !radarType;
  }

  activate(state: State) {
    if (this.radarType) {
      const { map } = state;
      const fields = new Map(
        map.reduceEachField<Array<[Vector, RadiusItem]>>((fields, vector) => {
          const tile = map.getTileInfo(vector);
          return (this.radarType === 'off' && tile === Lightning) ||
            (this.radarType === 'on' && canPlaceLightning(map, vector))
            ? [...fields, [vector, RadiusItem(vector)]]
            : fields;
        }, []),
      );

      return {
        radius: {
          fields,
          path: null,
          type: RadiusType.Lightning,
        },
      };
    }

    return null;
  }

  select(vector: Vector, state: State, actions: Actions): StateLike | null {
    const { radius, selectedPosition } = state;
    if (selectedPosition && radius && radius.fields.get(vector)) {
      actions.requestFrame(async () =>
        actions.update(
          await toggleLightningAction(actions, selectedPosition, vector, state),
        ),
      );
      return null;
    }
    return selectFallback(vector, state, actions);
  }

  component = ({ actions, state }: StateWithActions) => {
    const { update } = actions;
    const {
      animationConfig,
      map,
      navigationDirection,
      selectedPosition,
      tileSize,
      zIndex,
    } = state;
    if (!this.radarType && selectedPosition) {
      const { charge, id } = map.getCurrentPlayer();
      return (
        <ActionWheel
          actions={actions}
          animationConfig={animationConfig}
          color={id}
          entityCount={2}
          position={selectedPosition}
          tileSize={tileSize}
          zIndex={zIndex}
        >
          <ActionWheelCharge charge={charge} requiredCharge={1} />
          <LargeActionButton
            detail={fbt('Off', 'Off button')}
            disabled={charge < Charge}
            entityCount={2}
            icon={(highlight, props) => <Icon icon={Zap} {...props} />}
            navigationDirection={navigationDirection}
            onClick={() => update({ behavior: new Radar('off') })}
            position={1}
          />
          <LargeActionButton
            detail={fbt('On', 'On button')}
            disabled={charge < Charge}
            entityCount={2}
            icon={(highlight, props) => <Icon icon={ZapOn} {...props} />}
            navigationDirection={navigationDirection}
            onClick={() => update({ behavior: new Radar('on') })}
            position={3}
          />
        </ActionWheel>
      );
    }
    return null;
  };
}
