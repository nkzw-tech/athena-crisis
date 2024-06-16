import { Effect, Effects, EffectTrigger } from '@deities/apollo/Effects.tsx';

export default function replaceEffect(
  effects: Effects,
  trigger: EffectTrigger,
  currentEffect: Effect,
  newEffect: Effect,
) {
  const newEffects = new Map(effects);
  const effectList = newEffects.get(trigger);
  if (effectList) {
    const newEffectList = new Set(
      [...effectList].map((item) =>
        item === currentEffect ? newEffect : item,
      ),
    );
    newEffects.set(trigger, newEffectList);
    return newEffects;
  }
  return effects;
}
