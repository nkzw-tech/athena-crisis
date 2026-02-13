import { CharacterMessageEffectAction } from '@deities/apollo/Action.tsx';
import { Effects, EffectTrigger } from '@deities/apollo/Effects.tsx';

export default function getAllEffectCharacters(effects: Effects | null, effect?: EffectTrigger) {
  return effects
    ? [
        ...new Map(
          [...effects].flatMap(([trigger, list]) =>
            !effect || effect === trigger
              ? [...list].flatMap(
                  ({ actions }) =>
                    actions
                      .filter(
                        (action): action is CharacterMessageEffectAction =>
                          action.type === 'CharacterMessageEffect',
                      )
                      .map((action) => [action.unitId, action]) || [],
                )
              : [],
          ),
        ).values(),
      ]
    : [];
}
