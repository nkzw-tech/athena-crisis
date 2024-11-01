import { SizeVector } from '@deities/athena/MapData.tsx';
import { Effects } from '../Effects.tsx';
import { resizeEntities, ResizeOrigin } from './resizeMap.tsx';

export default function resizeEffects(
  effects: Effects,
  previousSize: SizeVector,
  size: SizeVector,
  origin: Set<ResizeOrigin>,
) {
  const offsetX = origin.has('left') ? previousSize.width - size.width : 0;
  const offsetY = origin.has('top') ? previousSize.height - size.height : 0;
  return new Map(
    [...effects].map(([trigger, effectList]) => [
      trigger,
      new Set(
        [...effectList].map((effect) => ({
          ...effect,
          actions: [...effect.actions].map((action) =>
            action.type === 'SpawnEffect'
              ? ({
                  ...action,
                  units: resizeEntities(action.units, size, offsetX, offsetY),
                } as const)
              : action,
          ),
        })),
      ),
    ]),
  );
}
